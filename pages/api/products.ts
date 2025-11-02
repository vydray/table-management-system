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
    // storeIdをクエリパラメータから取得（ない場合はデフォルト値1）
    const storeId = req.query.storeId ? parseInt(req.query.storeId as string) : 1
    
    console.log('商品API呼び出し - 店舗ID:', storeId)

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

    console.log(`取得結果 - カテゴリー: ${categories?.length || 0}件, 商品: ${products?.length || 0}件`)

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