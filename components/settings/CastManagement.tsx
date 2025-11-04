import { useEffect } from 'react'
import { useCastData } from '../../hooks/useCastData'
import { useCastModal } from '../../hooks/useCastModal'
import { useCastSearch } from '../../hooks/useCastSearch'
import { usePositionData } from '../../hooks/usePositionData'
import { useCastHandlers } from '../../hooks/useCastHandlers'

export default function CastManagement() {
  // フックを使用
  const {
    casts,
    setCasts,
    loadCasts,
    addNewCast,
    updateCast,
    deleteCast,
    updateCastPosition,
    updateCastStatus,
    retireCast,
    toggleCastShowInPos
  } = useCastData()

  const {
    positions,
    loadPositions,
    addPosition: addPositionData,
    deletePosition: deletePositionData
  } = usePositionData()

  const {
    showCastModal,
    editingCast,
    setEditingCast,
    isNewCast,
    showPositionModal,
    newPositionName,
    setNewPositionName,
    showRetirementModal,
    retirementDate,
    setRetirementDate,
    retirementCast,
    openEditModal,
    openNewCastModal,
    closeCastModal,
    openPositionModal,
    closePositionModal,
    openRetirementModal,
    closeRetirementModal
  } = useCastModal()

  const {
    searchTerm,
    setSearchTerm,
    filteredCasts
  } = useCastSearch(casts)

  const {
    getStatusColor,
    addPosition,
    handleAddNewCast,
    handleUpdateCast,
    handleDeleteCast,
    handleUpdateCastStatus,
    confirmRetirement,
    handleUpdateCastPosition,
    handleToggleCastShowInPos
  } = useCastHandlers(
    addNewCast,
    updateCast,
    deleteCast,
    updateCastStatus,
    retireCast,
    updateCastPosition,
    toggleCastShowInPos,
    addPositionData,
    setCasts,
    closeCastModal,
    closePositionModal,
    closeRetirementModal,
    openRetirementModal,
    setNewPositionName
  )

  // 初回読み込み
  useEffect(() => {
    loadCasts()
    loadPositions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
  <div style={{
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    height: '100%',
    overflowY: 'auto',
    paddingBottom: '100px', // 下部に余裕を持たせる
    WebkitOverflowScrolling: 'touch', // iOSスムーズスクロール
    msOverflowStyle: '-ms-autohiding-scrollbar', // IE/Edge
    position: 'relative' // Androidでの位置固定問題対策
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>キャスト管理</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => openNewCastModal({
              id: 0,
              store_id: 0,
              name: '',
              line_number: null,
              twitter: null,
              password: null,
              instagram: null,
              password2: null,
              photo: null,
              attributes: null,
              is_writer: null,
              submission_date: null,
              back_number: null,
              status: '体験',
              sales_previous_day: null,
              cast_point: null,
              show_in_pos: false,
              birthday: null,
              created_at: null,
              updated_at: null,
              resignation_date: null,
              attendance_certificate: null,
              residence_record: null,
              contract_documents: null,
              submission_contract: null,
              employee_name: null,
              experience_date: null,
              hire_date: null
            })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            新規追加
          </button>
          <button
            onClick={openPositionModal}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            役職管理
          </button>
        </div>
      </div>

      {/* 検索バー */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          inputMode="text"
          lang="ja"
          placeholder="名前、役職、ステータスで検索..."
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
      <div style={{ 
      backgroundColor: '#f8f8f8',
      borderRadius: '8px',
      padding: '1px'
    }}>
      <div style={{ 
        // maxHeight: '600px', を削除
        // overflowY: 'auto' を削除
      }}>
        <table data-cast-table style={{ 
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#fff'
        }}>
            <thead style={{ 
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  backgroundColor: '#f0f0f0',
                  borderBottom: '2px solid #e0e0e0'
                }}>名前</th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  backgroundColor: '#f0f0f0',
                  borderBottom: '2px solid #e0e0e0'
                }}>役職</th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  backgroundColor: '#f0f0f0',
                  borderBottom: '2px solid #e0e0e0'
                }}>ステータス</th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  backgroundColor: '#f0f0f0',
                  borderBottom: '2px solid #e0e0e0'
                }}>POS表示</th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  backgroundColor: '#f0f0f0',
                  borderBottom: '2px solid #e0e0e0'
                }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCasts.map((cast) => (
                <tr key={cast.id} style={{ 
                  borderBottom: '1px solid #e5e5e7',
                  backgroundColor: '#fff'
                }}>
                  <td style={{ 
                    padding: '12px 16px',
                    fontSize: '14px'
                  }}>
                    {cast.name || '-'}
                    {cast.resignation_date && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        ({new Date(cast.resignation_date).toLocaleDateString('ja-JP')}退店)
                      </span>
                    )}
                  </td>
                  <td style={{ 
                    padding: '12px 16px'
                  }}>
                    <select
                      value={cast.attributes || ''}
                      onChange={(e) => handleUpdateCastPosition(cast, e.target.value)}
                      style={{
                        width: '100%',
                        maxWidth: '150px',
                        padding: '6px 10px',
                        border: '1px solid #e5e5e7',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: '#fff',
                        color: '#000',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">未設定</option>
                      {positions.map(pos => (
                        <option key={pos.id} value={pos.name}>{pos.name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{
                    padding: '12px 16px'
                  }}>
                    <select
                      value={cast.status || '在籍'}
                      onChange={(e) => handleUpdateCastStatus(cast, e.target.value)}
                      style={{
                        width: '100%',
                        maxWidth: '120px',
                        padding: '6px 10px',
                        border: '1px solid #e5e5e7',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: getStatusColor(cast.status),
                        color: '#000',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="在籍">在籍</option>
                      <option value="体験">体験</option>
                      <option value="退店">退店</option>
                    </select>
                  </td>
                  <td style={{ 
                    padding: '12px 16px',
                    textAlign: 'center'
                  }}>
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '51px',
                      height: '31px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={cast.show_in_pos || false}
                        onChange={() => handleToggleCastShowInPos(cast)}
                        style={{
                          opacity: 0,
                          width: 0,
                          height: 0
                        }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: cast.show_in_pos ? '#34c759' : '#e5e5e7',
                        borderRadius: '34px',
                        transition: 'background-color 0.3s',
                        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: '27px',
                          width: '27px',
                          left: cast.show_in_pos ? '22px' : '2px',
                          bottom: '2px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: 'left 0.3s',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}></span>
                      </span>
                    </label>
                  </td>
                  <td style={{ 
                    padding: '12px 16px',
                    textAlign: 'center'
                  }}>
                    <button
                      onClick={() => openEditModal(cast)}
                      style={{
                        padding: '6px 16px',
                        backgroundColor: '#007aff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
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

      {/* 退店日設定モーダル */}
      {showRetirementModal && retirementCast && (
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
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              marginBottom: '20px' 
            }}>
              退店日の設定
            </h3>
            
            <p style={{ marginBottom: '20px', color: '#666' }}>
              {retirementCast.name}さんの退店日を設定してください
            </p>
            
            <input
              type="date"
              value={retirementDate}
              onChange={(e) => setRetirementDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e5e7',
                borderRadius: '6px',
                fontSize: '16px',
                marginBottom: '20px'
              }}
            />
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px' 
            }}>
              <button
                onClick={closeRetirementModal}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={() => confirmRetirement(retirementCast, retirementDate)}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#ff4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                退店処理
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 役職管理モーダル */}
      {showPositionModal && (
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
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              marginBottom: '20px' 
            }}>
              役職管理
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="text"
                  inputMode="text"
                  lang="ja"
                  value={newPositionName}
                  onChange={(e) => setNewPositionName(e.target.value)}
                  placeholder="新しい役職名"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={() => addPosition(newPositionName)}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#4CAF50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  追加
                </button>
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {positions.map((pos) => (
                  <div key={pos.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    borderBottom: '1px solid #e5e5e7'
                  }}>
                    <span>{pos.name}</span>
                    <button
                      onClick={() => deletePositionData(pos.id)}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#ff4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ 
              marginTop: '24px', 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px' 
            }}>
              <button
                onClick={closePositionModal}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

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
            overflowY: 'auto'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              marginBottom: '20px' 
            }}>
              {isNewCast ? '新規キャスト追加' : 'キャスト編集'}
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
                  inputMode="text"
                  lang="ja"
                  value={editingCast.name || ''}
                  onChange={(e) => setEditingCast({...editingCast, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px'
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
                  inputMode="text"
                  lang="ja"
                  value={editingCast.twitter || ''}
                  onChange={(e) => setEditingCast({...editingCast, twitter: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px'
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
                  inputMode="text"
                  lang="ja"
                  value={editingCast.instagram || ''}
                  onChange={(e) => setEditingCast({...editingCast, instagram: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px'
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
                  誕生日（4桁: 例 0401）
                </label>
                <input
                  type="text"
                  inputMode="text"
                  lang="ja"
                  value={editingCast.birthday || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setEditingCast({...editingCast, birthday: value})
                  }}
                  placeholder="0401"
                  maxLength={4}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px'
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
                  体験入店日
                </label>
                <input
                  type="date"
                  value={editingCast.experience_date || ''}
                  onChange={(e) => setEditingCast({...editingCast, experience_date: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px'
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
                  本入店日
                </label>
                <input
                  type="date"
                  value={editingCast.hire_date || ''}
                  onChange={(e) => setEditingCast({...editingCast, hire_date: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px'
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
                  役職
                </label>
                <select
                  value={editingCast.attributes || ''}
                  onChange={(e) => setEditingCast({...editingCast, attributes: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e5e7',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    WebkitAppearance: 'menulist',
                    appearance: 'auto',
                    touchAction: 'manipulation',
                    position: 'relative',
                    zIndex: 9999,
                    pointerEvents: 'auto'
                  }}
                >
                  <option value="">未設定</option>
                  {positions.map(pos => (
                    <option key={pos.id} value={pos.name}>{pos.name}</option>
                  ))}
                </select>
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
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    WebkitAppearance: 'menulist',
                    appearance: 'auto',
                    touchAction: 'manipulation',
                    position: 'relative',
                    zIndex: 9999,
                    pointerEvents: 'auto'
                  }}
                >
                  <option value="在籍">在籍</option>
                  <option value="体験">体験</option>
                  <option value="退店">退店</option>
                </select>
              </div>

              {editingCast.status === '退店' && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '4px' 
                  }}>
                    退店日
                  </label>
                  <input
                    type="date"
                    value={editingCast.resignation_date || ''}
                    onChange={(e) => setEditingCast({...editingCast, resignation_date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e5e5e7',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}

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
              justifyContent: 'space-between', 
              gap: '12px' 
            }}>
              <div>
                {!isNewCast && editingCast?.id && (
                  <button
                    onClick={() => handleDeleteCast(editingCast)}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: '#ff4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    削除
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={closeCastModal}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#f0f0f0',
                    color: '#333',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  キャンセル
                </button>
                <button
                  onClick={isNewCast ? () => handleAddNewCast(editingCast) : () => handleUpdateCast(editingCast)}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#007aff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {isNewCast ? '追加' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}