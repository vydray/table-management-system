import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { tableId } = req.body

    try {
      // 1. 現在の注文をクリア（重要：正しいテーブル名を使用）
      const { error: deleteOrderError } = await supabase
        .from('current_order_items')
        .delete()
        .eq('table_id', tableId)
      
      if (deleteOrderError) {
        console.error('Failed to delete order items:', deleteOrderError)
        throw deleteOrderError
      }

      // 2. テーブル状態をクリア
      const { error } = await supabase
        .from('table_status')
        .update({
          guest_name: null,
          cast_name: null,
          entry_time: null,
          visit_type: null
        })
        .eq('table_name', tableId)

      if (error) throw error

      res.status(200).json({ success: true })
    } catch (error) {
      console.error('Clear table error:', error)
      res.status(500).json({ error: 'Clear table failed' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}