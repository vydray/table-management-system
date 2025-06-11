// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// 環境変数から取得
const GOOGLE_APPS_SCRIPT_URL = Deno.env.get('GOOGLE_APPS_SCRIPT_URL') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Supabaseクライアントを初期化
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req: Request) => {
  try {
    // CORSヘッダー
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/json',
    }

    // OPTIONS リクエストの処理
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers })
    }

    // Webhookのペイロードを取得
    const payload = await req.json()
    console.log('Webhook received:', JSON.stringify(payload, null, 2))

    // payloadの構造を確認
    const { type, table, record, old_record } = payload

    // castsテーブルの変更のみ処理
    if (table !== 'casts') {
      return new Response(
        JSON.stringify({ message: 'Not a casts table update' }),
        { headers }
      )
    }

    // 変更内容をログ出力
    console.log(`Operation: ${type}`)
    if (type === 'UPDATE') {
      console.log('Changed fields:')
      if (old_record && record) {
        Object.keys(record).forEach(key => {
          if (record[key] !== old_record[key]) {
            console.log(`  ${key}: ${old_record[key]} → ${record[key]}`)
          }
        })
      }
    }

    // Google Apps Scriptに転送
    console.log('Forwarding to Google Apps Script...')
    const gasResponse = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        table,
        record,
        old_record
      })
    })

    if (!gasResponse.ok) {
      throw new Error(`GAS request failed: ${gasResponse.status} ${gasResponse.statusText}`)
    }

    const gasResult = await gasResponse.text()
    console.log('GAS response:', gasResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Synced to Google Sheets',
        operation: type,
        castName: record?.name || 'Unknown',
        gasResponse: gasResult
      }),
      { headers }
    )
  } catch (error) {
    console.error('Error in Edge Function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        stack: errorStack
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
})