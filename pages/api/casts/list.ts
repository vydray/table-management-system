import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('casts')
      .select('name')
      .eq('active', true)
      .order('name')

    if (error) return res.status(500).json({ error: error.message })
    
    const castNames = data.map(cast => cast.name)
    res.status(200).json(castNames)
  }
}