import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id, storeId, ...updateData } = req.body

    if (!id || !storeId) {
      return res.status(400).json({ error: 'ID and storeId are required' })
    }

    // キャストデータを更新
    const { data, error } = await supabase
      .from('casts')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('store_id', storeId)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Error updating cast:', error)
    res.status(500).json({ error: 'Failed to update cast' })
  }
}