import { getSupabaseServerClient } from '@/lib/supabase'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = getSupabaseServerClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { tableId, guestName, castName, timeStr, visitType, storeId } = req.body

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required' })
    }

    // まず、該当するテーブルのレコードが存在するか確認
    const { data: existingData, error: checkError } = await supabase
      .from('table_status')
      .select('*')
      .eq('table_name', tableId)
      .eq('store_id', storeId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116はレコードが見つからないエラー
      return res.status(500).json({ error: checkError.message })
    }

    if (!existingData) {
      // レコードが存在しない場合は新規作成
      const { error: insertError } = await supabase
        .from('table_status')
        .insert({
          table_name: tableId,
          guest_name: guestName,
          cast_name: castName,
          entry_time: timeStr,
          visit_type: visitType,
          store_id: storeId
        })

      if (insertError) return res.status(500).json({ error: insertError.message })
    } else {
      // レコードが存在する場合は更新
      const { error: updateError } = await supabase
        .from('table_status')
        .update({
          guest_name: guestName,
          cast_name: castName,
          entry_time: timeStr,
          visit_type: visitType
        })
        .eq('table_name', tableId)
        .eq('store_id', storeId)  // 店舗IDでもフィルタ

      if (updateError) return res.status(500).json({ error: updateError.message })
    }

    res.status(200).json({ success: true })
  }
}