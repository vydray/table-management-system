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

  try {
    // クエリパラメータから店舗IDを取得（デフォルトは1）
    const { storeId } = req.query
    const targetStoreId = storeId || '1'
    
    // カテゴリー取得（店舗でフィルタ）
    const { data: categories, error: catError } = await supabase
      .from('product_categories')
      .select('*')
      .eq('store_id', targetStoreId)
      .order('display_order')
    
    if (catError) throw catError
    
    // 商品取得（店舗でフィルタ）
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('store_id', targetStoreId)
      .order('display_order')
    
    if (prodError) throw prodError
    
    res.status(200).json({ categories, products })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
}