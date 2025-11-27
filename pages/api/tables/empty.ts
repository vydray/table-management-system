import { getSupabaseServerClient } from '@/lib/supabase'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = getSupabaseServerClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('table_status')
      .select('table_name')
      .is('guest_name', null)
      .order('table_name')

    if (error) return res.status(500).json({ error: error.message })
    
    const emptyTables = data.map(table => table.table_name)
    res.status(200).json(emptyTables)
  }
}