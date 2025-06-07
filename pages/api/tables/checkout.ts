import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

interface OrderItem {
  name: string
  cast?: string
  quantity: number
  price: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    console.log('受信データ:', req.body)
    
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
      totalAmount
    } = req.body

    try {
      // 現在のテーブル情報を取得
      const { data: tableData, error: fetchError } = await supabase
        .from('table_status')
        .select('*')
        .eq('table_name', tableId)
      
      if (fetchError) throw fetchError

      const currentData = tableData && tableData.length > 0 ? tableData[0] : null
      
      if (!currentData) {
        return res.status(404).json({ 
          error: 'Table not found', 
          details: `Table ${tableId} not found in table_status` 
        })
      }

      // システム設定を取得
      const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['consumption_tax_rate', 'service_charge_rate', 'rounding_unit', 'rounding_method'])

      // 設定値を取得
      const consumptionTaxRate = settings?.find(s => s.setting_key === 'consumption_tax_rate')?.setting_value || 0.10
      const serviceChargeRate = settings?.find(s => s.setting_key === 'service_charge_rate')?.setting_value || 0.15
      const roundingUnit = settings?.find(s => s.setting_key === 'rounding_unit')?.setting_value || 100
      const roundingMethod = settings?.find(s => s.setting_key === 'rounding_method')?.setting_value || 0

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

      // 総合計を計算
      let totalWithService = subtotalIncTax + serviceTax

      // 端数処理を適用
      if (roundingUnit > 0) {
        switch (roundingMethod) {
          case 0: // 切り捨て
            totalWithService = Math.floor(totalWithService / roundingUnit) * roundingUnit
            break
          case 1: // 切り上げ
            totalWithService = Math.ceil(totalWithService / roundingUnit) * roundingUnit
            break
          case 2: // 四捨五入
            totalWithService = Math.round(totalWithService / roundingUnit) * roundingUnit
            break
        }
      }

      // 1. ordersテーブルに注文を保存（全ての情報を含む）
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          receipt_number: `${tableId}-${Date.now()}`,
          visit_datetime: currentData.entry_time,
          checkout_datetime: checkoutTime,
          table_number: tableId,
          staff_name: castName || currentData.cast_name,
          guest_name: guestName || currentData.guest_name,
          visit_type: visitType || currentData.visit_type,
          subtotal_excl_tax: subtotal,      // 税抜金額
          tax_amount: consumptionTax,        // 消費税
          service_charge: serviceTax,        // サービス料
          total_incl_tax: totalWithService   // 端数処理後の総合計
        })
        .select()
        .single()

      if (orderError) {
        console.error('注文保存エラー:', orderError)
        throw orderError
      }

      console.log('作成された注文:', orderData)

      // 2. order_itemsに明細を保存
      if (orderItems && orderItems.length > 0 && orderData) {
        const itemsToInsert = orderItems.map((item: OrderItem) => {
          const unitPriceExclTax = Math.round(item.price / (1 + consumptionTaxRate))
          const taxAmount = item.price - unitPriceExclTax
          
          return {
            order_id: orderData.id,
            category: '',
            product_name: item.name,
            cast_name: item.cast || null,
            unit_price: item.price,
            unit_price_excl_tax: unitPriceExclTax,
            tax_amount: taxAmount,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
            pack_number: 0
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

      // 3. paymentsテーブルに支払い情報を保存
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderData.id,
          cash_amount: paymentCash || 0,
          credit_card_amount: paymentCard || 0,
          other_payment_amount: paymentOther || 0,
          change_amount: Math.max(0, (paymentCash + paymentCard + paymentOther) - totalWithService),
          payment_method: paymentCash > 0 ? 'cash' : paymentCard > 0 ? 'card' : 'other'
        })

      if (paymentError) {
        console.error('支払い情報保存エラー:', paymentError)
      }

      // 4. current_order_itemsをクリア
      await supabase
        .from('current_order_items')
        .delete()
        .eq('table_id', tableId)

      // 5. table_statusをクリア
      const { error: updateError } = await supabase
        .from('table_status')
        .update({
          guest_name: null,
          cast_name: null,
          entry_time: null,
          visit_type: null
        })
        .eq('table_name', tableId)

      if (updateError) throw updateError

      console.log('会計処理完了')
      res.status(200).json({ success: true, totalAmount: totalWithService })
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