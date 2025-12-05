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
      .order('table_name')
      .order('page_number, table_name')

    if (error) return res.status(500).json({ error: error.message })

    res.status(200).json(data)
  }
}