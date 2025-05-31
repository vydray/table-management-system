import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('table_status')
      .select('*')
      .order('table_name')

    if (error) return res.status(500).json({ error: error.message })

    const tableData = data.map(row => {
      let elapsedMin = null
      
      if (row.entry_time) {
        // entry_timeは "YYYY-MM-DD HH:mm:ss" 形式
        // 直接Dateオブジェクトに変換（ブラウザが日本時間として解釈）
        const entryTime = new Date(row.entry_time)
        const now = new Date()
        
        // 経過時間を計算
        elapsedMin = Math.floor((now.getTime() - entryTime.getTime()) / 60000)
        
        // 負の値の場合は0にする
        if (elapsedMin < 0) elapsedMin = 0
      }

      return {
        table: row.table_name,
        name: row.guest_name || "",
        oshi: row.cast_name || "",
        time: row.entry_time || "",
        visit: row.visit_type || "",
        elapsed: elapsedMin !== null ? elapsedMin + "分" : "",
        status: row.guest_name ? "occupied" : "empty"
      }
    })

    res.status(200).json(tableData)
  }
}