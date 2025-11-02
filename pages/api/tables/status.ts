import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // クエリパラメータから店舗IDを取得（デフォルトは1）
    const { storeId } = req.query
    const targetStoreId = storeId || '1'
    
    const { data, error } = await supabase
      .from('table_status')
      .select('*')
      .eq('store_id', targetStoreId)  // 店舗IDでフィルタ
      .order('table_name')

    if (error) return res.status(500).json({ error: error.message })

    // page_numberも含めて返すように修正
      const tableData = data.map(row => ({
        table: row.table_name,
        name: row.guest_name || "",
        oshi: row.cast_name || "",
        time: row.entry_time || "",
        visit: row.visit_type || "",
        elapsed: "",
        status: row.guest_name ? "occupied" : "empty",
        page_number: row.page_number || 1  // 追加
      }))

    res.status(200).json(tableData)
  }
}