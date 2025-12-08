import { getSupabaseServerClient } from '@/lib/supabase'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getBusinessDateFromDateTime } from '../../../utils/dateTime'

const supabase = getSupabaseServerClient()

interface OrderItem {
  name: string
  cast?: string[]
  quantity: number
  price: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const {
      tableId,
      checkoutTime,
      orderItems,
      guestName,
      castName,
      visitType,
      paymentCash,
      paymentCard,
      paymentOther,
      cardFee,
      totalAmount,
      discountAmount,  // 割引金額を追加
      storeId  // 店舗IDを追加
    } = req.body

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required' })
    }

    try {
      // 現在のテーブル情報を取得（店舗IDでフィルタ）
      const { data: tableData, error: fetchError } = await supabase
        .from('table_status')
        .select('*')
        .eq('table_name', tableId)
        .eq('store_id', storeId)  // 店舗IDでフィルタ
      
      if (fetchError) throw fetchError

      const currentData = tableData && tableData.length > 0 ? tableData[0] : null
      
      if (!currentData) {
        return res.status(404).json({ 
          error: 'Table not found', 
          details: `Table ${tableId} not found in table_status for store ${storeId}` 
        })
      }

      // システム設定を取得（店舗IDでフィルタ）
      const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['tax_rate', 'service_fee_rate', 'business_day_start_hour'])
        .eq('store_id', storeId)  // 店舗IDでフィルタ

      // 設定値を取得（パーセント値を小数に変換）
      const taxRatePercent = Number(settings?.find(s => s.setting_key === 'tax_rate')?.setting_value) || 10
      const serviceFeePercent = Number(settings?.find(s => s.setting_key === 'service_fee_rate')?.setting_value) || 15
      const consumptionTaxRate = taxRatePercent / 100  // 10% → 0.10
      const serviceChargeRate = serviceFeePercent / 100  // 20% → 0.20
      const businessDayCutoffHour = Number(settings?.find(s => s.setting_key === 'business_day_start_hour')?.setting_value) || 6

      // 商品マスタとカテゴリーマスタを取得（カテゴリー情報を設定するため）
      const { data: products } = await supabase
        .from('products')
        .select('id, name, category_id')
        .eq('store_id', storeId)

      const { data: categoriesData } = await supabase
        .from('product_categories')
        .select('id, name')
        .eq('store_id', storeId)

      // 商品合計（税込）
      const subtotalIncTax = orderItems.reduce((sum: number, item: OrderItem) => sum + (item.price * item.quantity), 0)
      
      // 商品ごとに税抜き価格を計算して正確な合計を出す
      const subtotal = orderItems.reduce((sum: number, item: OrderItem) => {
        const itemPriceExclTax = Math.round(item.price / (1 + consumptionTaxRate))
        return sum + (itemPriceExclTax * item.quantity)
      }, 0)
      
      // 消費税額（実際に含まれている税額）
      const consumptionTax = subtotalIncTax - subtotal
      
      // サービス料（税込価格に対して）
      const serviceTax = Math.floor(subtotalIncTax * serviceChargeRate)
      
      // 端数調整額を計算
      const roundingAdjustment = totalAmount - (subtotalIncTax + serviceTax)

      // 営業日を計算
      const checkoutDate = new Date(checkoutTime)
      const orderDate = getBusinessDateFromDateTime(checkoutDate, Number(businessDayCutoffHour))

      // 1. ordersテーブルに注文を保存（店舗IDを含む）
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          receipt_number: `${tableId}-${Date.now()}`,
          visit_datetime: currentData.entry_time,
          checkout_datetime: checkoutTime,
          order_date: orderDate + 'T00:00:00.000Z',
          table_number: tableId,
          staff_name: Array.isArray(castName) ? castName.join(', ') : (castName || (Array.isArray(currentData.cast_name) ? currentData.cast_name.join(', ') : currentData.cast_name)),
          guest_name: guestName || currentData.guest_name,
          visit_type: visitType || currentData.visit_type,
          subtotal_excl_tax: subtotal,
          tax_amount: consumptionTax,
          service_charge: serviceTax,
          rounding_adjustment: roundingAdjustment,
          discount_amount: discountAmount || 0,  // 割引金額を追加
          total_incl_tax: totalAmount,
          store_id: storeId  // 店舗IDを追加
        })
        .select()
        .single()

      if (orderError) {
        console.error('注文保存エラー:', orderError)
        throw orderError
      }

      // 2. order_itemsに明細を保存（店舗IDを含む）
      if (orderItems && orderItems.length > 0 && orderData) {
        const itemsToInsert = orderItems.map((item: OrderItem) => {
          const unitPriceExclTax = Math.round(item.price / (1 + consumptionTaxRate))
          const taxAmount = item.price - unitPriceExclTax

          // 商品名からカテゴリーを検索
          const product = products?.find(p => p.name === item.name)
          const category = categoriesData?.find(c => c.id === product?.category_id)

          return {
            order_id: orderData.id,
            category: category?.name || null,
            product_name: item.name,
            // cast_nameを配列として保存（DBがtext[]型の場合はそのまま、空配列はnullに）
            cast_name: item.cast && item.cast.length > 0 ? item.cast : null,
            unit_price: item.price,
            unit_price_excl_tax: unitPriceExclTax,
            tax_amount: taxAmount,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
            pack_number: 0,
            store_id: storeId  // 店舗IDを追加
          }
        })

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert)

        if (itemsError) {
          console.error('注文明細保存エラー:', itemsError)
          throw itemsError
        }
      }

      // 3. paymentsテーブルに支払い情報を保存（店舗IDを含む）
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderData.id,
          cash_amount: paymentCash || 0,
          credit_card_amount: paymentCard || 0,
          other_payment_amount: paymentOther || 0,
          card_fee: cardFee || 0,
          change_amount: Math.max(0, (paymentCash + paymentCard + paymentOther) - totalAmount),
          payment_method: paymentCash > 0 ? 'cash' : paymentCard > 0 ? 'card' : 'other',
          store_id: storeId  // 店舗IDを追加
        })

      if (paymentError) {
        console.error('支払い情報保存エラー:', paymentError)
      }

      // 4. current_order_itemsをクリア（店舗IDでフィルタ）
      await supabase
        .from('current_order_items')
        .delete()
        .eq('table_id', tableId)
        .eq('store_id', storeId)  // 店舗IDでフィルタ

      // 5. table_statusをクリア（店舗IDでフィルタ）
      const { error: updateError } = await supabase
        .from('table_status')
        .update({
          guest_name: null,
          cast_name: null,
          entry_time: null,
          visit_type: null
        })
        .eq('table_name', tableId)
        .eq('store_id', storeId)  // 店舗IDでフィルタ

      if (updateError) throw updateError

      res.status(200).json({ success: true, totalAmount })
    } catch (error) {
      console.error('Checkout error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      res.status(500).json({ 
        error: 'Checkout failed', 
        details: errorMessage
      })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}