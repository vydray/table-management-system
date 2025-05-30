import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { fromTableId, toTableId } = req.body

    // 1. fromテーブルのデータを取得
    const { data: fromData, error: fromError } = await supabase
      .from('table_status_jst')
      .select('*')
      .eq('table_name', fromTableId)
      .single()

    if (fromError || !fromData.guest_name) {
      return res.status(400).json({ error: '移動元にお客様情報がありません' })
    }

    // 2. toテーブルが空いているか確認
    const { data: toData, error: toError } = await supabase
      .from('table_status_jst')
      .select('guest_name')
      .eq('table_name', toTableId)
      .single()

    if (toError || toData.guest_name) {
      return res.status(400).json({ error: '移動先は既に使用中です' })
    }

    // 3. toテーブルにデータをコピー
    const { error: updateToError } = await supabase
      .from('table_status_jst')
      .update({
        guest_name: fromData.guest_name,
        cast_name: fromData.cast_name,
        entry_time: fromData.entry_time,
        visit_type: fromData.visit_type
      })
      .eq('table_name', toTableId)

    if (updateToError) return res.status(500).json({ error: updateToError.message })

    // 4. fromテーブルをクリア
    const { error: clearFromError } = await supabase
      .from('table_status_jst')
      .update({
        guest_name: null,
        cast_name: null,
        entry_time: null,
        visit_type: null
      })
      .eq('table_name', fromTableId)

    if (clearFromError) return res.status(500).json({ error: clearFromError.message })
    
    res.status(200).json({ success: true })
  }
}