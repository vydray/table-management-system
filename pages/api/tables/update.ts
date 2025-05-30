import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { tableId, guestName, castName, timeStr, visitType } = req.body

    // timeStrが送られてきた場合、それは日本時間として扱う
    let entryTime: string
    
    if (timeStr) {
      // フロントエンドから送られた時刻（ISO形式）を一度パース
      const date = new Date(timeStr)
      
      // 日本時間として正しく保存するため、フォーマットを調整
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      // PostgreSQLのtimestamp形式で保存（タイムゾーンなし）
      entryTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    } else {
      // timeStrがない場合は現在時刻（これは通常ないはず）
      entryTime = new Date().toISOString()
    }

    const { error } = await supabase
      .from('table_status')
      .update({
        guest_name: guestName,
        cast_name: castName,
        entry_time: entryTime,
        visit_type: visitType
      })
      .eq('table_name', tableId)

    if (error) return res.status(500).json({ error: error.message })
    res.status(200).json({ success: true })
  }
}