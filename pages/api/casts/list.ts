import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { storeId } = req.query
  const targetStoreId = storeId || 1

  try {
    // show_in_posがtrueのキャストのみ取得
    const { data: casts, error } = await supabase
      .from('casts')
      .select('name')
      .eq('store_id', targetStoreId)
      .eq('show_in_pos', true)  // POS表示フラグでフィルタリング
      .order('name')

    if (error) throw error

    // 名前のリストを返す
    const castNames = casts?.map(cast => cast.name) || []
    
    res.status(200).json(castNames)
  } catch (error) {
    console.error('Error fetching casts:', error)
    res.status(500).json({ error: 'Failed to fetch casts' })
  }
}