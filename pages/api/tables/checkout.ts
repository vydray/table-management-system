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
    const { tableId, checkoutTime, orderItems, guestName, castName, visitType } = req.body

    try {
      // 現在のテーブル情報を取得
      const { data: currentData, error: fetchError } = await supabase
        .from('table_status')
        .select('*')
        .eq('table_name', tableId)
        .single()

      if (fetchError) throw fetchError

      // 1. 訪問履歴に保存
      const { error: visitError } = await supabase
        .from('visit_history')
        .insert({
          table_name: tableId,
          guest_name: currentData.guest_name || guestName,
          cast_name: currentData.cast_name || castName,
          entry_time: currentData.entry_time,
          visit_type: currentData.visit_type || visitType,
          checkout_time: checkoutTime
        })

      if (visitError) throw visitError

      // 2. 売上データを保存（sales_historyテーブルが存在する場合）
      if (orderItems && orderItems.length > 0) {
        const totalAmount = orderItems.reduce((sum: number, item: OrderItem) => 
          sum + (item.price * item.quantity), 0
        )

        try {
          const { data: salesData, error: salesError } = await supabase
            .from('sales_history')
            .insert({
              table_id: tableId,
              guest_name: currentData.guest_name || guestName,
              cast_name: currentData.cast_name || castName,
              checkout_time: checkoutTime,
              total_amount: totalAmount,
              entry_time: currentData.entry_time
            })
            .select()
            .single()

          if (!salesError && salesData) {
            // 売上明細を保存
            const salesDetails = orderItems.map((item: OrderItem) => ({
              sales_id: salesData.id,
              product_name: item.name,
              cast_name: item.cast || null,
              quantity: item.quantity,
              unit_price: item.price,
              subtotal: item.price * item.quantity
            }))

            await supabase
              .from('sales_details')
              .insert(salesDetails)
          }
        } catch {
          // sales_historyテーブルが存在しない場合はスキップ
          console.log('Sales history table might not exist, skipping...')
        }
      }

      // 3. 現在の注文をクリア
      try {
        await supabase
          .from('current_orders')
          .delete()
          .eq('table_id', tableId)
      } catch {
        // current_ordersテーブルが存在しない場合はスキップ
        console.log('Current orders table might not exist, skipping...')
      }

      // 4. テーブル状態をクリア
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

      res.status(200).json({ success: true })
    } catch (error) {
      console.error('Checkout error:', error)
      res.status(500).json({ error: 'Checkout failed' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}