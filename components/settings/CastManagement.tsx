import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 型定義を追加
interface Cast {
  id: number
  line_number?: string
  name?: string
  twitter?: string
  instagram?: string
  attributes?: string
  status?: string
  show_in_pos?: boolean
  hire_date?: string
  birthday?: string
  password?: string
  password2?: string
  attendance_certificate?: boolean
  residence_record?: boolean
  contract_documents?: boolean
  submission_contract?: string
  employee_name?: string
  sales_previous_day?: number
  experience_date?: string
  resignation_date?: string
  created_at?: string
  updated_at?: string
  store_id?: number
}

// CastManagementPropsインターフェースを削除し、直接エクスポート
export const CastManagement = () => {
  const [casts, setCasts] = useState<Cast[]>([])
  const [castSearchQuery, setCastSearchQuery] = useState('')
  const [editingCast, setEditingCast] = useState<Cast | null>(null)
  const [showCastModal, setShowCastModal] = useState(false)

  // キャストデータを取得する関数
  const loadCasts = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data, error } = await supabase
        .from('casts')
        .select('*')
        .eq('store_id', storeId)
        .order('name')

      if (error) throw error
      setCasts(data || [])
    } catch (error) {
      console.error('Failed to fetch casts:', error)
    }
  }

  // キャストのPOS表示を切り替える関数
  const toggleCastShowInPos = async (cast: Cast) => {
    try {
      const storeId = getCurrentStoreId()
      const newValue = !cast.show_in_pos
      
      const { error } = await supabase
        .from('casts')
        .update({ show_in_pos: newValue })
        .eq('id', cast.id)
        .eq('store_id', storeId)
      
      if (error) throw error
      
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
    if (!editingCast) return

    try {
      const storeId = getCurrentStoreId()
      const { error } = await supabase
        .from('casts')
        .update({
          name: editingCast.name,
          twitter: editingCast.twitter,
          instagram: editingCast.instagram,
          attributes: editingCast.attributes,
          status: editingCast.status,
          show_in_pos: editingCast.show_in_pos,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCast.id)
        .eq('store_id', storeId)

      if (error) throw error
      
      alert('キャスト情報を更新しました')
      loadCasts()
      setShowCastModal(false)
      setEditingCast(null)
    } catch (error) {
      console.error('Failed to update cast:', error)
      alert('更新に失敗しました')
    }
  }

  useEffect(() => {
    loadCasts()
  }, [])

  // 検索フィルター
  const filteredCasts = casts.filter(cast => {
    const query = castSearchQuery.toLowerCase()
    return (
      cast.name?.toLowerCase().includes(query) ||
      cast.twitter?.toLowerCase().includes(query) ||
      cast.instagram?.toLowerCase().includes(query) ||
      cast.attributes?.toLowerCase().includes(query)
    )
  })

  return (
    <>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0 }}>キャスト管理</h2>
        
        {/* 検索バー */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="キャストを検索（名前、Twitter、Instagram、属性）"
            value={castSearchQuery}
            onChange={(e) => setCastSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>

        {/* キャスト一覧（テーブル形式） */}
        <div style={{ marginBottom: '20px' }}>
          {filteredCasts.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              color: '#999'
            }}>
              {castSearchQuery ? 'キャストが見つかりません' : 'キャストデータがありません'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left', width: '35%' }}>源氏名</th>
                  <th style={{ padding: '10px', textAlign: 'left', width: '25%' }}>属性</th>
                  <th style={{ padding: '10px', textAlign: 'center', width: '20%' }}>ステータス</th>
                  <th style={{ padding: '10px', textAlign: 'center', width: '20%' }}>POS表示</th>
                </tr>
              </thead>
              <tbody>
                {filteredCasts.map((cast) => (
                  <tr 
                    key={cast.id} 
                    style={{ 
                      borderBottom: '1px solid #eee',
                      backgroundColor: cast.status === '退店' ? '#f5f5f5' : 'white',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      // トグルをクリックした場合は編集モーダルを開かない
                      if ((e.target as HTMLElement).closest('.toggle-wrapper')) {
                        return;
                      }
                      setEditingCast(cast)
                      setShowCastModal(true)
                    }}
                  >
                    <td style={{ padding: '10px' }}>
                      <strong>{cast.name || '名前なし'}</strong>
                    </td>
                    <td style={{ padding: '10px' }}>
                      {cast.attributes || '-'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: 
                          cast.status === '在籍' ? '#4CAF50' :
                          cast.status === '退店' ? '#f44336' :
                          '#FF9800',
                        color: 'white'
                      }}>
                        {cast.status || '未定'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <div className="toggle-wrapper" style={{ display: 'inline-block' }}>
                        <label style={{
                          position: 'relative',
                          display: 'inline-block',
                          width: '50px',
                          height: '24px',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={cast.show_in_pos !== false}
                            onChange={() => toggleCastShowInPos(cast)}
                            style={{ display: 'none' }}
                          />
                          <span style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: cast.show_in_pos !== false ? '#4CAF50' : '#ccc',
                            borderRadius: '24px',
                            transition: 'all 0.3s'
                          }}>
                            <span style={{
                              position: 'absolute',
                              top: '2px',
                              left: cast.show_in_pos !== false ? '26px' : '2px',
                              width: '20px',
                              height: '20px',
                              backgroundColor: 'white',
                              borderRadius: '50%',
                              transition: 'all 0.3s'
                            }}></span>
                          </span>
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 同期ボタン */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={() => {
              if (confirm('Google スプレッドシートから最新のキャストデータを同期しますか？')) {
                alert('Google Apps Script側から手動で同期を実行してください')
              }
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            <span style={{ marginRight: '8px' }}>🔄</span>
            スプレッドシートから同期
          </button>
        </div>
      </div>

      {/* キャスト編集モーダル */}
      {showCastModal && editingCast && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => {
              setShowCastModal(false)
              setEditingCast(null)
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '30px',
                width: '500px',
                maxWidth: '90%',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowCastModal(false)
                  setEditingCast(null)
                }}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>

              <h2 style={{ marginTop: 0, marginBottom: '25px' }}>キャスト情報編集</h2>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    源氏名
                  </label>
                  <input
                    type="text"
                    value={editingCast.name || ''}
                    onChange={(e) => setEditingCast({ ...editingCast, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    Twitter
                  </label>
                  <input
                    type="text"
                    value={editingCast.twitter || ''}
                    onChange={(e) => setEditingCast({ ...editingCast, twitter: e.target.value })}
                    placeholder="@なしで入力"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={editingCast.instagram || ''}
                    onChange={(e) => setEditingCast({ ...editingCast, instagram: e.target.value })}
                    placeholder="@なしで入力"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    属性
                  </label>
                  <input
                    type="text"
                    value={editingCast.attributes || ''}
                    onChange={(e) => setEditingCast({ ...editingCast, attributes: e.target.value })}
                    placeholder="例: キャスト、幹部、スタッフ"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    ステータス
                  </label>
                  <select
                    value={editingCast.status || ''}
                    onChange={(e) => setEditingCast({ ...editingCast, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">-- 選択 --</option>
                    <option value="在籍">在籍</option>
                    <option value="退店">退店</option>
                    <option value="未定">未定</option>
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    POS表示設定
                  </label>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}>
                    <input
                      type="checkbox"
                      checked={editingCast.show_in_pos !== false}
                      onChange={(e) => setEditingCast({ ...editingCast, show_in_pos: e.target.checked })}
                      style={{ 
                        width: '20px', 
                        height: '20px',
                        cursor: 'pointer'
                      }}
                    />
                    POSレジの推し選択に表示する
                  </label>
                  <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                    オフにするとPOSレジの推し選択リストに表示されません
                  </small>
                </div>

                {/* 読み取り専用情報 */}
                <div style={{ 
                  padding: '15px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>LINE ID:</strong> {editingCast.line_number || 'なし'}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>入店日:</strong> {editingCast.hire_date || 'なし'}
                  </div>
                  <div>
                    <strong>誕生日:</strong> {editingCast.birthday || 'なし'}
                  </div>
                </div>

                {/* ボタン */}
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginTop: '20px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => {
                      setShowCastModal(false)
                      setEditingCast(null)
                    }}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#f5f5f5',
                      color: '#333',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={updateCast}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#4CAF50',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}