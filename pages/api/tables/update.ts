import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// 日本時間を取得する関数
function getJapanTime(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const jstTime = new Date(utc + (9 * 60 * 60000));
  return jstTime;
}

// 最も近い5分単位に丸める関数
function roundToNearest5Minutes(date: Date): Date {
  const minutes = date.getMinutes()
  const roundedMinutes = Math.round(minutes / 5) * 5
  
  const newDate = new Date(date)
  newDate.setMinutes(roundedMinutes)
  newDate.setSeconds(0)
  newDate.setMilliseconds(0)
  
  if (roundedMinutes === 60) {
    newDate.setMinutes(0)
    newDate.setHours(newDate.getHours() + 1)
  }
  
  return newDate
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { tableId, guestName, castName, timeStr, visitType } = req.body

    // 新規登録時もフロントエンドから時刻を送る
    const { error } = await supabase
      .from('table_status')
      .update({
        guest_name: guestName,
        cast_name: castName,
        entry_time: timeStr, // 常にフロントエンドから送られた時刻を使用
        visit_type: visitType
      })
      .eq('table_name', tableId)

    if (error) return res.status(500).json({ error: error.message })
    res.status(200).json({ success: true })
  }
}