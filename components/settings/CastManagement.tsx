import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../../utils/storeContext'

// Supabaseクライアントの初期化を確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// キャストの型定義
interface Cast {
  id: number
  store_id: number
  name: string | null
  line_user_id: string | null
  password: string | null
  twitter: string | null
  instagram: string | null
  photo: string | null
  attributes: string | null
  is_writer: boolean | null
  submission_date: string | null
  back_number: string | null
  status: string | null
  sales_previous_day: boolean | null
  cast_point: number | null
  show_in_pos: boolean | null
  created_at: string | null
  updated_at: string | null
}

export default function CastManagement() {
  const [casts, setCasts] = useState<Cast[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCasts, setFilteredCasts] = useState<Cast[]>([])
  const [showCastModal, setShowCastModal] = useState(false)
  const [editingCast, setEditingCast] = useState<Cast | null>(null)

  // Google Apps ScriptのURL
  const gasUrl = 'https://script.google.com/macros/s/AKfycbwp10byL5IEGbEJAKOxVAQ1dSdjQ3UNJTGJnJOZ6jp6JOCWiiFURaQiqfqyfo390NvgZg/exec'

  // キャスト一覧を読み込む
  const loadCasts = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('casts')
        .select('*')
        .eq('store_id', storeId)
        .order('id')

      if (error) throw error
      setCasts(data || [])
    } catch (error) {
      console.error('Failed to load casts:', error)
    }
  }

  // キャストのPOS表示を切り替える関数（修正版）
  const toggleCastShowInPos = async (cast: Cast) => {
    try {
      const storeId = getCurrentStoreId()
      const newValue = !cast.show_in_pos
      
      // Supabaseを更新
      const { data, error } = await supabase
        .from('casts')
        .update({ 
          show_in_pos: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', cast.id)
        .eq('store_id', storeId)
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      // 成功したらGoogle Apps Scriptに直接送信
      try {
        const gasResponse = await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors', // CORSエラーを回避
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'UPDATE',
            table: 'casts',
            record: {
              ...data,
              show_in_pos: newValue
            },
            old_record: {
              ...data,
              show_in_pos: cast.show_in_pos
            }
          })
        })
        
        console.log('Google Apps Script called successfully')
      } catch (gasError) {
        console.error('GAS sync error:', gasError)
        // GASのエラーは無視（Supabaseの更新は成功しているので）
      }
      
      // UIを更新
      setCasts(prev => prev.map(c => 
        c.id === cast.id ? { ...c, show_in_pos: newValue } : c
      ))
    } catch (error) {
      console.error('Error toggling show_in_pos:', error)
      alert('更新に失敗しました')
    }
  }

  // キャスト情報を更新する関数（修正版）
  const updateCast = async () => {
    if (!editingCast) return

    try {
      const storeId = getCurrentStoreId()
      const oldCast = casts.find(c => c.id === editingCast.id)
      
      const { data, error } = await supabase
        .from('casts')
        .update({
          name: editingCast.name || '',
          twitter: editingCast.twitter || '',
          instagram: editingCast.instagram || '',
          attributes: editingCast.attributes || '',
          status: editingCast.status || '',
          show_in_pos: editingCast.show_in_pos ?? true,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCast.id)
        .eq('store_id', storeId)
        .select()
        .single()

      if (error) throw error
      
      // 成功したらGoogle Apps Scriptに直接送信
      try {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'UPDATE',
            table: 'casts',
            record: data,
            old_record: oldCast
          })
        })
        
        console.log('Google Apps Script called successfully')
      } catch (gasError) {
        console.error('GAS sync error:', gasError)
      }
      
      alert('キャスト情報を更新しました')
      await loadCasts()
      setShowCastModal(false)
      setEditingCast(null)
    } catch (error) {
      console.error('Failed to update cast:', error)
      alert('更新に失敗しました')
    }
  }

  // 初回読み込み
  useEffect(() => {
    loadCasts()
  }, [])

  // 検索処理
  useEffect(() => {
    const filtered = casts.filter(cast => {
      const name = cast.name || ''
      const attributes = cast.attributes || ''
      const status = cast.status || ''
      const searchLower = searchTerm.toLowerCase()
      
      return name.toLowerCase().includes(searchLower) ||
             attributes.toLowerCase().includes(searchLower) ||
             status.toLowerCase().includes(searchLower)
    })
    setFilteredCasts(filtered)
  }, [casts, searchTerm])

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">キャスト管理</h2>

      {/* 検索バー */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="名前、属性、ステータスで検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      {/* キャスト一覧 */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">名前</th>
              <th className="px-4 py-2 text-left">属性</th>
              <th className="px-4 py-2 text-left">ステータス</th>
              <th className="px-4 py-2 text-center">POS表示</th>
              <th className="px-4 py-2 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredCasts.map((cast) => (
              <tr key={cast.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{cast.name || '-'}</td>
                <td className="px-4 py-2">{cast.attributes || '-'}</td>
                <td className="px-4 py-2">{cast.status || '-'}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => toggleCastShowInPos(cast)}
                    className={`px-3 py-1 rounded ${
                      cast.show_in_pos 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {cast.show_in_pos ? 'ON' : 'OFF'}
                  </button>
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => {
                      setEditingCast(cast)
                      setShowCastModal(true)
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    編集
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 編集モーダル */}
      {showCastModal && editingCast && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">キャスト編集</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">名前</label>
                <input
                  type="text"
                  value={editingCast.name || ''}
                  onChange={(e) => setEditingCast({...editingCast, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Twitter</label>
                <input
                  type="text"
                  value={editingCast.twitter || ''}
                  onChange={(e) => setEditingCast({...editingCast, twitter: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Instagram</label>
                <input
                  type="text"
                  value={editingCast.instagram || ''}
                  onChange={(e) => setEditingCast({...editingCast, instagram: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">属性</label>
                <input
                  type="text"
                  value={editingCast.attributes || ''}
                  onChange={(e) => setEditingCast({...editingCast, attributes: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ステータス</label>
                <input
                  type="text"
                  value={editingCast.status || ''}
                  onChange={(e) => setEditingCast({...editingCast, status: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingCast.show_in_pos ?? true}
                    onChange={(e) => setEditingCast({...editingCast, show_in_pos: e.target.checked})}
                    className="mr-2"
                  />
                  POS表示
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCastModal(false)
                  setEditingCast(null)
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                キャンセル
              </button>
              <button
                onClick={updateCast}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}