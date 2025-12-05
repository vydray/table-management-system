import { getSupabaseServerClient } from '@/lib/supabase'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = getSupabaseServerClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { tableId, storeId } = req.body

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required' })
    }

    try {
      // 1. 現在の注文をクリア（店舗IDでフィルタ）
      const { error: deleteOrderError } = await supabase
        .from('current_order_items')
        .delete()
        .eq('table_id', tableId)
        .eq('store_id', storeId)
      
      if (deleteOrderError) {
        console.error('Failed to delete order items:', deleteOrderError)
        throw deleteOrderError
      }

      // 2. テーブル状態をクリア（店舗IDでフィルタ）
      const { error } = await supabase
        .from('table_status')
        .update({
          guest_name: null,
          cast_name: null,
          entry_time: null,
          visit_type: null
        })
        .eq('table_name', tableId)
        .eq('store_id', storeId)

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