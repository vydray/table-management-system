// pages/api/tables/checkout.ts
import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { tableId, checkoutTime } = req.body  // orderItems等を削除

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
          guest_name: currentData.guest_name,
          cast_name: currentData.cast_name,
          entry_time: currentData.entry_time,
          visit_type: currentData.visit_type,
          checkout_time: checkoutTime
        })

      if (visitError) throw visitError

      // 2. 現在の注文をクリア
      const { error: deleteOrderError } = await supabase
        .from('current_order_items')
        .delete()
        .eq('table_id', tableId)
      
      if (deleteOrderError) {
        console.error('Failed to delete order items:', deleteOrderError)
        throw deleteOrderError
      }

      // 3. テーブル状態をクリア
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