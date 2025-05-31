import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'
import { utcToZonedTime, format } from 'date-fns-tz'

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
      // 日本時間としてフォーマット
      entryTime = format(date, 'yyyy-MM-dd HH:mm:ss')
    } else {
      // 新規登録時：サーバーの現在時刻を日本時間に変換
      const utcDate = new Date()
      const japanDate = utcToZonedTime(utcDate, 'Asia/Tokyo')
      
      // 5分単位に丸める
      const minutes = japanDate.getMinutes()
      const roundedMinutes = Math.round(minutes / 5) * 5
      japanDate.setMinutes(roundedMinutes)
      japanDate.setSeconds(0)
      
      if (roundedMinutes === 60) {
        japanDate.setMinutes(0)
        japanDate.setHours(japanDate.getHours() + 1)
      }
      
      // PostgreSQL形式でフォーマット
      entryTime = format(japanDate, 'yyyy-MM-dd HH:mm:ss')
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