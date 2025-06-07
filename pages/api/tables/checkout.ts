import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { 
      tableId, 
      checkoutTime, 
      orderItems,
      guestName,
      paymentCash,
      paymentCard,
      paymentOther,
      paymentOtherMethod,
      totalAmount
    } = req.body

    try {
      // 現在のテーブル情報を取得
      const { data: currentData, error: fetchError } = await supabase
        .from('table_status')
        .select('*')
        .eq('table_name', tableId)
        .single()

      if (fetchError) throw fetchError

      // 1. 各商品をpaymentsテーブルに保存
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              テーブル番号: tableId,
              名前: guestName || currentData.guest_name,
              商品名: item.name,
              カテゴリー: '', // カテゴリー情報が必要な場合は追加
              個数: item.quantity,
              税別: item.price,
              合計金額: item.price * item.quantity,
              現金: paymentCash || 0,
              カード: paymentCard || 0,
              その他: paymentOther || 0,
              クレジットカード: 0, // 必要に応じて
              会計時間: new Date(checkoutTime),
              来店日時: currentData.entry_time
            })

          if (paymentError) throw paymentError
        }
      }

      // 2. 訪問履歴に保存
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

      // 3. 現在の注文をクリア
      await supabase
        .from('current_order_items')
        .delete()
        .eq('table_id', tableId)

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