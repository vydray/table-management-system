import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { fromTableId, toTableId, storeId } = req.body

    // storeIdが指定されていない場合はデフォルト値を使用
    const targetStoreId = storeId || 1

    // 1. fromテーブルのデータを取得（店舗IDでフィルタ）
    const { data: fromData, error: fromError } = await supabase
      .from('table_status')
      .select('*')
      .eq('table_name', fromTableId)
      .eq('store_id', targetStoreId)  // 店舗IDでフィルタ
      .single()

    if (fromError || !fromData || !fromData.guest_name) {
      return res.status(400).json({ error: '移動元にお客様情報がありません' })
    }

    // 2. toテーブルが空いているか確認（店舗IDでフィルタ）
    const { data: toData, error: toError } = await supabase
      .from('table_status')
      .select('guest_name')
      .eq('table_name', toTableId)
      .eq('store_id', targetStoreId)  // 店舗IDでフィルタ
      .single()

    if (toError) {
      // レコードが存在しない場合は新規作成が必要
      if (toError.code === 'PGRST116') {
        // 新規レコードを作成
        const { error: insertError } = await supabase
          .from('table_status')
          .insert({
            table_name: toTableId,
            guest_name: fromData.guest_name,
            cast_name: fromData.cast_name,
            entry_time: fromData.entry_time,
            visit_type: fromData.visit_type,
            store_id: targetStoreId
          })

        if (insertError) return res.status(500).json({ error: insertError.message })
      } else {
        return res.status(500).json({ error: toError.message })
      }
    } else if (toData && toData.guest_name) {
      return res.status(400).json({ error: '移動先は既に使用中です' })
    } else {
      // 3. toテーブルにデータをコピー（店舗IDでフィルタ）
      const { error: updateToError } = await supabase
        .from('table_status')
        .update({
          guest_name: fromData.guest_name,
          cast_name: fromData.cast_name,
          entry_time: fromData.entry_time,
          visit_type: fromData.visit_type
        })
        .eq('table_name', toTableId)
        .eq('store_id', targetStoreId)  // 店舗IDでフィルタ

      if (updateToError) return res.status(500).json({ error: updateToError.message })
    }

    // 4. current_order_itemsも移動（店舗IDでフィルタ）
    const { data: orderItems, error: orderFetchError } = await supabase
      .from('current_order_items')
      .select('*')
      .eq('table_id', fromTableId)
      .eq('store_id', targetStoreId)  // 店舗IDでフィルタ

    if (!orderFetchError && orderItems && orderItems.length > 0) {
      // 注文アイテムがある場合は移動
      const updatedItems = orderItems.map(item => ({
        ...item,
        table_id: toTableId
      }))

      // 古いアイテムを削除
      await supabase
        .from('current_order_items')
        .delete()
        .eq('table_id', fromTableId)
        .eq('store_id', targetStoreId)  // 店舗IDでフィルタ

      // 新しいテーブルIDでアイテムを追加
      await supabase
        .from('current_order_items')
        .insert(updatedItems)
    }

    // 5. fromテーブルをクリア（店舗IDでフィルタ）
    const { error: clearFromError } = await supabase
      .from('table_status')
      .update({
        guest_name: null,
        cast_name: null,
        entry_time: null,
        visit_type: null
      })
      .eq('table_name', fromTableId)
      .eq('store_id', targetStoreId)  // 店舗IDでフィルタ

    if (clearFromError) return res.status(500).json({ error: clearFromError.message })
    
    res.status(200).json({ success: true })
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}