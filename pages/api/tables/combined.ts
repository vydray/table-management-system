import { getSupabaseServerClient } from '@/lib/supabase'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = getSupabaseServerClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { storeId } = req.query

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required' })
    }

    const { data, error } = await supabase
      .from('table_status')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_visible', true)
      .order('page_number, table_name')

    if (error) return res.status(500).json({ error: error.message })

    // レイアウト情報（list APIの代替）
    const layouts = data

    // ステータス情報（status APIの代替）
    const tableData = data.map(row => ({
      table: row.table_name,
      name: row.guest_name || "",
      oshi: row.cast_name || "",
      time: row.entry_time || "",
      visit: row.visit_type || "",
      elapsed: "",
      status: row.guest_name ? "occupied" : "empty",
      page_number: row.page_number || 1
    }))

    res.status(200).json({ layouts, tableData })
  }
}
