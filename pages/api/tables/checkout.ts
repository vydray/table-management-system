import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// 型定義を追加
interface OrderItem {
  name: string
  cast?: string
  quantity: number
  price: number
}

interface SupabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    console.log('受信データ:', req.body)
    
    const { 
      tableId, 
      checkoutTime, 
      orderItems,
      guestName,
      paymentCash,
      paymentCard,
      paymentOther
    } = req.body

    try {
      // 現在のテーブル情報を取得
      const { data: currentData, error: fetchError } = await supabase
        .from('table_status')
        .select('*')
        .eq('table_name', tableId)
        .single()

      if (fetchError) {
        console.error('テーブル情報取得エラー:', fetchError)
        throw fetchError
      }

      console.log('現在のテーブル情報:', currentData)

      // 1. 各商品をpaymentsテーブルに保存
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems as OrderItem[]) {
  const paymentData = {
  'テーブル番号': tableId,
  '名前': guestName || currentData.guest_name,
  '商品名': item.name,
  'カテゴリー': '',
  '個数': item.quantity,
  '税別': item.price,
  '合計金額': item.price * item.quantity,
  '現金': paymentCash || 0,
  'カード': paymentCard || 0,
  'その他': paymentOther || 0,
  'クレジットカード': 0,
  '会計時間': checkoutTime,  // new Date()を削除
  '来店日時': currentData.entry_time
}
          
          console.log('保存する支払いデータ:', paymentData)
          
          const { error: paymentError } = await supabase
            .from('payments')
            .insert(paymentData)

          if (paymentError) {
            console.error('支払いデータ保存エラー:', paymentError)
            throw paymentError
          }
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

      if (visitError) {
        console.error('訪問履歴保存エラー:', visitError)
        throw visitError
      }

      // 3. 現在の注文をクリア
      const { error: deleteOrderError } = await supabase
        .from('current_order_items')
        .delete()
        .eq('table_id', tableId)
      
      if (deleteOrderError) {
        console.error('注文クリアエラー:', deleteOrderError)
        // エラーでも処理を続ける（テーブルが存在しない可能性があるため）
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

      if (updateError) {
        console.error('テーブル状態更新エラー:', updateError)
        throw updateError
      }

      console.log('会計処理完了')
      res.status(200).json({ success: true })
    } catch (error) {
      console.error('Checkout error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const supabaseError = error as SupabaseError
      
      res.status(500).json({ 
        error: 'Checkout failed', 
        details: errorMessage,
        code: supabaseError?.code || 'UNKNOWN'
      })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}