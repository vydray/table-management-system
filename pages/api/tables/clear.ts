import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { tableId } = req.body

    const { error } = await supabase
      .from('table_status')
      .update({
        guest_name: null,
        cast_name: null,
        entry_time: null,
        visit_type: null
      })
      .eq('table_name', tableId)

    if (error) return res.status(500).json({ error: error.message })
    res.status(200).json({ success: true })
  }
}