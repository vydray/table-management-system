import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { tableId } = req.body

    // 現在のデータを取得
    const { data: currentData, error: fetchError } = await supabase
      .from('table_status')
      .select('*')
      .eq('table_name', tableId)
      .single()

    if (fetchError) return res.status(500).json({ error: fetchError.message })

    // 履歴に追加
    const { error: insertError } = await supabase
      .from('visit_history')
      .insert({
        table_name: currentData.table_name,
        guest_name: currentData.guest_name,
        cast_name: currentData.cast_name,
        entry_time: currentData.entry_time,
        visit_type: currentData.visit_type
      })

    if (insertError) return res.status(500).json({ error: insertError.message })

    // 現在のテーブルをクリア
    const { error: updateError } = await supabase
      .from('table_status')
      .update({
        guest_name: null,
        cast_name: null,
        entry_time: null,
        visit_type: null
      })
      .eq('table_name', tableId)

    if (updateError) return res.status(500).json({ error: updateError.message })
    res.status(200).json({ success: true })
  }
}