import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // 特定テーブルの現在の注文を取得
    const { tableId } = req.query
    
    const { data, error } = await supabase
      .from('current_order_items')
      .select('*')
      .eq('table_id', tableId)
      .order('created_at', { ascending: true })
    
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    
    return res.status(200).json(data || [])
  }
  
  if (req.method === 'POST') {
    // 注文を保存/更新
    const { tableId, orderItems } = req.body
    
    try {
      // 既存の注文を削除
      await supabase
        .from('current_order_items')
        .delete()
        .eq('table_id', tableId)
      
      // 新しい注文を挿入
      if (orderItems && orderItems.length > 0) {
        const itemsToInsert = orderItems.map((item: any) => ({
          table_id: tableId,
          product_name: item.name,
          cast_name: item.cast || null,
          quantity: item.quantity,
          unit_price: item.price
        }))
        
        const { error } = await supabase
          .from('current_order_items')
          .insert(itemsToInsert)
        
        if (error) throw error
      }
      
      return res.status(200).json({ success: true })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }
  
  if (req.method === 'DELETE') {
    // 特定テーブルの注文をクリア
    const { tableId } = req.body
    
    const { error } = await supabase
      .from('current_order_items')
      .delete()
      .eq('table_id', tableId)
    
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    
    return res.status(200).json({ success: true })
  }
  
  return res.status(405).json({ error: 'Method not allowed' })
}