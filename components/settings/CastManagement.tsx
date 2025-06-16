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

  // ステータスの背景色を取得
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case '在籍':
        return '#e6f7e6'
      case '体験':
        return '#fff7e6'
      case '退店':
        return '#f0f0f0'
      case '削除済み':
        return '#ffe6e6'
      default:
        return '#ffffff'
    }
  }

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

  // キャストのステータスを更新
  const updateCastStatus = async (cast: Cast, newStatus: string) => {
    try {
      const storeId = getCurrentStoreId()
      
      // Supabaseを更新
      const { data, error } = await supabase
        .from('casts')
        .update({ 
          status: newStatus,
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
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'UPDATE',
            table: 'casts',
            record: {
              ...data,
              status: newStatus
            },
            old_record: {
              ...data,
              status: cast.status
            }
          })
        })
        
        console.log('Google Apps Script called successfully')
      } catch (gasError) {
        console.error('GAS sync error:', gasError)
      }
      
      // UIを更新
      setCasts(prev => prev.map(c => 
        c.id === cast.id ? { ...c, status: newStatus } : c
      ))
    } catch (error) {
      console.error('Error updating status:', error)
      alert('ステータス更新に失敗しました')
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
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // テーブルのスタイル（グローバルCSS対策）
  const tableStyles = {
    container: {
      backgroundColor: '#fff',
      borderRadius: '10px',
      padding: '20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    tableWrapper: {
      backgroundColor: '#f8f8f8',
      borderRadius: '8px',
      overflow: 'hidden'
    },
    tableScroll: {
      maxHeight: '600px',
      overflowY: 'auto' as const,
      overflowX: 'auto' as const
    },
    table: {
      width: '100% !important',
      minWidth: '800px',
      borderCollapse: 'collapse' as const,
      tableLayout: 'fixed' as const,
      backgroundColor: '#fff !important',
      border: 'none !important',
      borderRadius: '0 !important',
      height: 'auto !important',
      position: 'static !important' as any,
      display: 'table !important',
      flexDirection: 'unset !important' as any,
      alignItems: 'unset !important' as any,
      justifyContent: 'unset !important' as any,
      fontSize: 'inherit !important',
      cursor: 'default !important',
      padding: '0 !important',
      boxSizing: 'content-box !important' as any,
      transition: 'none !important'
    },
    thead: {
      position: 'sticky' as const,
      top: 0,
      zIndex: 10
    },
    headerRow: {
      backgroundColor: '#f0f0f0'
    },
    th: {
      padding: '12px 16px !important',
      textAlign: 'left' as const,
      fontSize: '14px !important',
      fontWeight: '600' as any,
      color: '#333 !important',
      backgroundColor: '#f0f0f0 !important',
      borderBottom: '2px solid #e0e0e0 !important',
      position: 'static !important' as any,
      width: 'auto !important',
      height: 'auto !important'
    },
    tr: {
      borderBottom: '1px solid #e5e5e7',
      backgroundColor: '#fff !important',
      transition: 'background-color 0.2s',
      width: 'auto !important',
      height: 'auto !important',
      display: 'table-row !important',
      position: 'static !important' as any
    },
    td: {
      padding: '12px 16px !important',
      fontSize: '14px !important',
      position: 'static !important' as any,
      width: 'auto !important',
      height: 'auto !important',
      backgroundColor: 'transparent !important',
      display: 'table-cell !important'
    }
  }

  return (
    <div style={tableStyles.container}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>キャスト管理</h2>

      {/* 検索バー */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="名前、属性、ステータスで検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px 15px',
            border: '1px solid #e5e5e7',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>

      {/* キャスト一覧テーブル */}
      <div style={tableStyles.tableWrapper}>
        <div style={tableStyles.tableScroll}>
          <table style={tableStyles.table}>
            <thead style={tableStyles.thead}>
              <tr style={tableStyles.headerRow}>
                <th style={{...tableStyles.th, width: '20%'}}>名前</th>
                <th style={{...tableStyles.th, width: '20%'}}>属性</th>
                <th style={{...tableStyles.th, width: '20%', minWidth: '120px'}}>ステータス</th>
                <th style={{...tableStyles.th, width: '20%', textAlign: 'center' as const}}>POS表示</th>
                <th style={{...tableStyles.th, width: '20%', textAlign: 'center' as const}}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCasts.map((cast) => (
                <tr key={cast.id} style={tableStyles.tr}>
                  <td style={tableStyles.td}>
                    {cast.name || '-'}
                  </td>
                  <td style={tableStyles.td}>
                    {cast.attributes || '-'}
                  </td>
                  <td style={tableStyles.td}>
                    <select
                      value={cast.status || '在籍'}
                      onChange={(e) => updateCastStatus(cast, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '1px solid #e5e5e7',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: getStatusColor(cast.status),
                        color: '#000',
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#007aff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e5e7'
                      }}
                    >
                      <option value="在籍">在籍</option>
                      <option value="体験">体験</option>
                      <option value="退店">退店</option>
                      <option value="削除済み">削除済み</option>
                    </select>
                  </td>
                  <td style={{...tableStyles.td, textAlign: 'center' as const}}>
                    <button
                      onClick={() => toggleCastShowInPos(cast)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: cast.show_in_pos ? '#34c759' : '#e5e5e7',
                        color: cast.show_in_pos ? '#fff' : '#666'
                      }}
                    >
                      {cast.show_in_pos ? 'ON' : 'OFF'}
                    </button>
                  </td>
                  <td style={{...tableStyles.td, textAlign: 'center' as const}}>
                    <button
                      onClick={() => {
                        setEditingCast(cast)
                        setShowCastModal(true)
                      }}
                      style={{
                        padding: '6px 16px',
                        backgroundColor: '#007aff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#0051d5'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#007aff'
                      }}
                    >
                      編集
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 編集モーダル */}
      {showCastModal && editingCast && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              marginBottom: '20px' 
            }}>
              キャスト編集
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '4px' 
                }}>
                  名前
                </label>
                <input
                  type="text"
                  value={editingCast.name || ''}
                  onChange={(e) => setEditingCast({...editingCast, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '4px' 
                }}>
                  Twitter
                </label>
                <input
                  type="text"
                  value={editingCast.twitter || ''}
                  onChange={(e) => setEditingCast({...editingCast, twitter: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '4px' 
                }}>
                  Instagram
                </label>
                <input
                  type="text"
                  value={editingCast.instagram || ''}
                  onChange={(e) => setEditingCast({...editingCast, instagram: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '4px' 
                }}>
                  属性
                </label>
                <input
                  type="text"
                  value={editingCast.attributes || ''}
                  onChange={(e) => setEditingCast({...editingCast, attributes: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '4px' 
                }}>
                  ステータス
                </label>
                <select
                  value={editingCast.status || '在籍'}
                  onChange={(e) => setEditingCast({...editingCast, status: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="在籍">在籍</option>
                  <option value="体験">体験</option>
                  <option value="退店">退店</option>
                  <option value="削除済み">削除済み</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingCast.show_in_pos ?? true}
                    onChange={(e) => setEditingCast({...editingCast, show_in_pos: e.target.checked})}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '14px' }}>POS表示</span>
                </label>
              </div>
            </div>

            <div style={{ 
              marginTop: '24px', 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px' 
            }}>
              <button
                onClick={() => {
                  setShowCastModal(false)
                  setEditingCast(null)
                }}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={updateCast}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#007aff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
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