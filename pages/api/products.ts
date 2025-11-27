import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServerClient } from '@/lib/supabase'

const supabase = getSupabaseServerClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // storeIdをクエリパラメータから取得（ない場合はデフォルト値1）
    const storeId = req.query.storeId ? parseInt(req.query.storeId as string) : 1
    
    // カテゴリー取得（推し優先表示フラグも含む）
    const { data: categories, error: catError } = await supabase
      .from('product_categories')
      .select('*')
      .eq('store_id', storeId)
      .order('display_order')

    if (catError) {
      console.error('カテゴリー取得エラー:', catError)
      throw catError
    }

    // 商品取得
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('store_id', storeId)
      .order('display_order')

    if (prodError) {
      console.error('商品取得エラー:', prodError)
      throw prodError
    }

    res.status(200).json({ 
      categories: categories || [], 
      products: products || [] 
    })
  } catch (error) {
    console.error('商品データ取得エラー:', error)
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}