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
      // 日本時間として保存されているentry_timeを使用
      let elapsedMin = null
      
      if (row.entry_time) {
        // entry_timeは "YYYY-MM-DD HH:mm:ss" 形式で保存されている
        // これを日本時間のDateオブジェクトとして扱う
        const entryTime = new Date(row.entry_time + ' GMT+0900') // 日本時間として解釈
        
        // 現在の日本時間を取得
        const nowJapan = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }))
        
        // 経過時間を計算
        elapsedMin = Math.floor((nowJapan.getTime() - entryTime.getTime()) / 60000)
      }

      return {
        table: row.table_name,
        name: row.guest_name || "",
        oshi: row.cast_name || "",
        time: row.entry_time || "",
        visit: row.visit_type || "",
        elapsed: elapsedMin !== null && elapsedMin >= 0 ? elapsedMin + "分" : "",
        status: row.guest_name ? "occupied" : "empty"
      }
    })

    res.status(200).json(tableData)
  }
}