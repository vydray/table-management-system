import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { tableId, guestName, castName, timeStr, visitType } = req.body

    let entryTime: string
    
    if (timeStr) {
      // フロントエンドから送られた時刻を使用
      const date = new Date(timeStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      entryTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    } else {
      // 新規登録時はフロントエンドから必ず送るようにする
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