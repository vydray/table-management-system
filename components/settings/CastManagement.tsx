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
      console.log('Loaded casts:', data) // デバッグ用
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

  // 売上表の有無を切り替える関数
  const toggleSalesPreviousDay = async (cast: Cast) => {
    try {
      const storeId = getCurrentStoreId()
      const newValue = cast.sales_previous_day === '有' ? '無' : '有'
      
      // Supabaseを更新
      const { error } = await supabase
        .from('casts')
        .update({ 
          sales_previous_day: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', cast.id)
        .eq('store_id', storeId)
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      // Google Apps Scriptに通知
      try {
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.name = 'hidden-iframe-' + Date.now()
        document.body.appendChild(iframe)
        
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = gasUrl
        form.target = iframe.name
        
        form.innerHTML = `
          <input name="action" value="updateSalesPreviousDay" />
          <input name="name" value="${cast.name || ''}" />
          <input name="salesPreviousDay" value="${newValue}" />
        `
        
        document.body.appendChild(form)
        form.submit()
        
        setTimeout(() => {
          document.body.removeChild(form)
          document.body.removeChild(iframe)
        }, 1000)
      } catch (gasError) {
        console.error('GAS sync error:', gasError)
      }
      
      // UIを更新
      setCasts(prev => prev.map(c => 
        c.id === cast.id ? { ...c, sales_previous_day: newValue } : c
      ))
    } catch (error) {
      console.error('Error toggling sales_previous_day:', error)
      alert('更新に失敗しました')
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
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>キャスト管理</h2>
        <button
          onClick={() => {
            setEditingCast(getDefaultCast())
            setIsNewCast(true)
            setShowCastModal(true)
          }}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          新規追加
        </button>
      </div>

      {/* 検索バー */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="名前、属性、ステータスで検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px'
          }}
        />
      </div>

      {/* キャスト一覧 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 'bold' }}>名前</th>
              <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 'bold' }}>ステータス</th>
              <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 'bold' }}>属性</th>
              <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 'bold' }}>入店日</th>
              <th style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 'bold' }}>売上表</th>
              <th style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 'bold' }}>POS表示</th>
              <th style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 'bold' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredCasts.map((cast) => (
              <tr key={cast.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px 16px' }}>{cast.name || '-'}</td>
                <td style={{ padding: '8px 16px' }}>{cast.status || '-'}</td>
                <td style={{ padding: '8px 16px' }}>{cast.attributes || '-'}</td>
                <td style={{ padding: '8px 16px' }}>{cast.hire_date || '-'}</td>
                <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => toggleSalesPreviousDay(cast)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: cast.sales_previous_day === '有' ? '#10b981' : '#d1d5db',
                      color: cast.sales_previous_day === '有' ? 'white' : '#374151'
                    }}
                  >
                    {cast.sales_previous_day === '有' ? 'ON' : 'OFF'}
                  </button>
                </td>
                <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => toggleCastShowInPos(cast)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: cast.show_in_pos ? '#10b981' : '#d1d5db',
                      color: cast.show_in_pos ? 'white' : '#374151'
                    }}
                  >
                    {cast.show_in_pos ? 'ON' : 'OFF'}
                  </button>
                </td>
                <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => {
                      setEditingCast(cast)
                      setIsNewCast(false)
                      setShowCastModal(true)
                    }}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
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
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              {isNewCast ? 'キャスト新規追加' : 'キャスト編集'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>名前 *</label>
                <input
                  type="text"
                  value={editingCast.name || ''}
                  onChange={(e) => setEditingCast({...editingCast, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                  placeholder="必須"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Twitter</label>
                <input
                  type="text"
                  value={editingCast.twitter || ''}
                  onChange={(e) => setEditingCast({...editingCast, twitter: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                  placeholder="@なしで入力"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Instagram</label>
                <input
                  type="text"
                  value={editingCast.instagram || ''}
                  onChange={(e) => setEditingCast({...editingCast, instagram: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                  placeholder="@なしで入力"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>属性</label>
                <input
                  type="text"
                  value={editingCast.attributes || ''}
                  onChange={(e) => setEditingCast({...editingCast, attributes: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                  placeholder="例: キャスト、店長、体験入店"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>ステータス</label>
                <select
                  value={editingCast.status || '在籍'}
                  onChange={(e) => setEditingCast({...editingCast, status: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                >
                  <option value="在籍">在籍</option>
                  <option value="体験">体験</option>
                  <option value="退店">退店</option>
                  <option value="削除済み">削除済み</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>売上表の有無</label>
                <select
                  value={editingCast.sales_previous_day || '無'}
                  onChange={(e) => setEditingCast({...editingCast, sales_previous_day: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                >
                  <option value="有">有</option>
                  <option value="無">無</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>体験入店日</label>
                <input
                  type="date"
                  value={editingCast.experience_date || ''}
                  onChange={(e) => setEditingCast({...editingCast, experience_date: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>本入店日</label>
                <input
                  type="date"
                  value={editingCast.hire_date || ''}
                  onChange={(e) => setEditingCast({...editingCast, hire_date: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={editingCast.show_in_pos ?? true}
                    onChange={(e) => setEditingCast({...editingCast, show_in_pos: e.target.checked})}
                    style={{ marginRight: '8px' }}
                  />
                  POS表示
                </label>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => {
                  setShowCastModal(false)
                  setEditingCast(null)
                  setIsNewCast(false)
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#d1d5db',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#9ca3af'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#d1d5db'}
              >
                キャンセル
              </button>
              <button
                onClick={isNewCast ? addNewCast : updateCast}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
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