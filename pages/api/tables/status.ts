import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('table_status_jst')
      .select('*')
      .order('table_name')

    if (error) return res.status(500).json({ error: error.message })

    const tableData = data.map(row => {
      const now = new Date()
      const elapsedMin = row.entry_time 
        ? Math.floor((now.getTime() - new Date(row.entry_time).getTime()) / 60000) 
        : null

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