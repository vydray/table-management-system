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
  line_number: string | null  // LINE IDではなくLINE番号として扱う
  password: string | null
  twitter: string | null
  instagram: string | null
  photo: string | null
  attributes: string | null
  status: string | null
  sales_previous_day: string | null  // 文字列型（'有' or '無'）
  experience_date: string | null  // 日付のみ
  hire_date: string | null  // 日付のみ
  show_in_pos: boolean | null
  created_at: string | null
  updated_at: string | null
}

// 新規キャストのデフォルト値
const getDefaultCast = (): Partial<Cast> => ({
  name: '',
  twitter: '',
  instagram: '',
  attributes: '',
  status: '在籍',
  sales_previous_day: '無',
  experience_date: '',
  hire_date: new Date().toISOString().split('T')[0], // 今日の日付
  show_in_pos: true,
})

export default function CastManagement() {
  const [casts, setCasts] = useState<Cast[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCasts, setFilteredCasts] = useState<Cast[]>([])
  const [showCastModal, setShowCastModal] = useState(false)
  const [editingCast, setEditingCast] = useState<Partial<Cast> | null>(null)
  const [isNewCast, setIsNewCast] = useState(false)

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

  // 新規キャスト追加
  const addNewCast = async () => {
    if (!editingCast || !editingCast.name) {
      alert('名前を入力してください')
      return
    }

    try {
      const storeId = getCurrentStoreId()
      
      const newCastData = {
        ...editingCast,
        store_id: storeId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: insertedCast, error } = await supabase
        .from('casts')
        .insert([newCastData])
        .select()
        .single()

      if (error) throw error

      // Google Apps Scriptに通知
      try {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'INSERT',
            table: 'casts',
            record: insertedCast
          })
        })
      } catch (gasError) {
        console.error('GAS sync error:', gasError)
      }

      alert('キャストを追加しました')
      await loadCasts()
      setShowCastModal(false)
      setEditingCast(null)
      setIsNewCast(false)
    } catch (error) {
      console.error('Failed to add cast:', error)
      alert('追加に失敗しました')
    }
  }

  // キャストのPOS表示を切り替える関数
  const toggleCastShowInPos = async (cast: Cast) => {
    try {
      const storeId = getCurrentStoreId()
      const newValue = !cast.show_in_pos
      
      // Supabaseを更新
      const { error } = await supabase
        .from('casts')
        .update({ 
          show_in_pos: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', cast.id)
        .eq('store_id', storeId)
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      // 成功したらGoogle Apps Scriptに直接送信（即時反映）
      try {
        // フォームデータとして送信（CORSを回避）
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.name = 'hidden-iframe-' + Date.now()
        document.body.appendChild(iframe)
        
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = gasUrl
        form.target = iframe.name
        
        // フォームにデータを追加
        form.innerHTML = `
          <input name="action" value="updateShowInPos" />
          <input name="name" value="${cast.name || ''}" />
          <input name="showInPos" value="${newValue}" />
        `
        
        document.body.appendChild(form)
        form.submit()
        
        // クリーンアップ（1秒後）
        setTimeout(() => {
          document.body.removeChild(form)
          document.body.removeChild(iframe)
        }, 1000)
        
        console.log('Google Apps Script called successfully')
      } catch (gasError) {
        console.error('GAS sync error:', gasError)
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

  // キャスト情報を更新する関数
  const updateCast = async () => {
    if (!editingCast || !editingCast.id) return

    try {
      const storeId = getCurrentStoreId()
      const oldCast = casts.find(c => c.id === editingCast.id)
      
      const updateData = {
        name: editingCast.name || '',
        twitter: editingCast.twitter || '',
        instagram: editingCast.instagram || '',
        attributes: editingCast.attributes || '',
        status: editingCast.status || '',
        sales_previous_day: editingCast.sales_previous_day || '無',
        experience_date: editingCast.experience_date || null,
        hire_date: editingCast.hire_date || null,
        show_in_pos: editingCast.show_in_pos ?? true,
        updated_at: new Date().toISOString()
      }

      const { data: updatedCastData, error } = await supabase
        .from('casts')
        .update(updateData)
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
            record: updatedCastData,
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">キャスト管理</h2>
        <button
          onClick={() => {
            setEditingCast(getDefaultCast())
            setIsNewCast(true)
            setShowCastModal(true)
          }}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          新規追加
        </button>
      </div>

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
              <th className="px-4 py-2 text-left">入店日</th>
              <th className="px-4 py-2 text-center">売上前</th>
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
                <td className="px-4 py-2">{cast.hire_date || '-'}</td>
                <td className="px-4 py-2 text-center">{cast.sales_previous_day || '無'}</td>
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
                      setIsNewCast(false)
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

      {/* 編集/追加モーダル */}
      {showCastModal && editingCast && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {isNewCast ? 'キャスト新規追加' : 'キャスト編集'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">名前 *</label>
                <input
                  type="text"
                  value={editingCast.name || ''}
                  onChange={(e) => setEditingCast({...editingCast, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="必須"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Twitter</label>
                <input
                  type="text"
                  value={editingCast.twitter || ''}
                  onChange={(e) => setEditingCast({...editingCast, twitter: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="@なしで入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Instagram</label>
                <input
                  type="text"
                  value={editingCast.instagram || ''}
                  onChange={(e) => setEditingCast({...editingCast, instagram: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="@なしで入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">属性</label>
                <input
                  type="text"
                  value={editingCast.attributes || ''}
                  onChange={(e) => setEditingCast({...editingCast, attributes: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="例: お姉さん、可愛い系"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ステータス</label>
                <select
                  value={editingCast.status || '在籍'}
                  onChange={(e) => setEditingCast({...editingCast, status: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="在籍">在籍</option>
                  <option value="体験">体験</option>
                  <option value="退店">退店</option>
                  <option value="削除済み">削除済み</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">売上前の有無</label>
                <select
                  value={editingCast.sales_previous_day || '無'}
                  onChange={(e) => setEditingCast({...editingCast, sales_previous_day: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="有">有</option>
                  <option value="無">無</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">体験入店日</label>
                <input
                  type="date"
                  value={editingCast.experience_date || ''}
                  onChange={(e) => setEditingCast({...editingCast, experience_date: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">本入店日</label>
                <input
                  type="date"
                  value={editingCast.hire_date || ''}
                  onChange={(e) => setEditingCast({...editingCast, hire_date: e.target.value})}
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
                  setIsNewCast(false)
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                キャンセル
              </button>
              <button
                onClick={isNewCast ? addNewCast : updateCast}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {isNewCast ? '追加' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}