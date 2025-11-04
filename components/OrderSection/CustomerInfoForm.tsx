import React, { useState, useEffect } from 'react'

interface CustomerInfoFormProps {
  guestName: string
  castName: string
  visitType: string
  castList: string[]
  attendingCasts: string[]
  onUpdateFormData: (updates: Partial<{
    guestName: string
    castName: string
    visitType: string
  }>) => void
}

export const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({
  guestName,
  castName,
  visitType,
  castList,
  attendingCasts,
  onUpdateFormData
}) => {
  const [showCastDropdown, setShowCastDropdown] = useState(false)
  const [castFilter, setCastFilter] = useState<'all' | 'attending'>('all')

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.cast-dropdown-container')) {
        setShowCastDropdown(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  return (
    <div style={{
      padding: '15px',
      backgroundColor: '#f5f5f5',
      borderBottom: '1px solid #ddd',
      marginBottom: '10px'
    }}>
      {/* お客様の行 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <span style={{
          minWidth: '80px',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>お客様：</span>
        <input
          type="text"
          inputMode="text"
                  lang="ja"
          value={guestName}
          onChange={(e) => onUpdateFormData({ guestName: e.target.value })}
          placeholder="お客様名を入力"
          style={{
            flex: 1,
            padding: '6px 10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        />
      </div>

      {/* 推しと来店種別の行 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* 推し */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1.5,
          position: 'relative'
        }}>
          <span style={{
            minWidth: '50px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>推し：</span>
          <div className="cast-dropdown-container" style={{ flex: 1, position: 'relative' }}>
            <div
              onClick={() => setShowCastDropdown(!showCastDropdown)}
              style={{
                width: '100%',
                padding: '6px 10px',
                paddingRight: '30px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'white',
                color: castName ? '#000' : '#999',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              {castName || '-- 選択 --'}
            </div>

            <span style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#666',
              fontSize: '12px'
            }}>
              ▼
            </span>

            {showCastDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                border: '1px solid #007AFF',
                borderRadius: '4px',
                marginTop: '2px',
                zIndex: 10000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                {/* フィルターボタン */}
                <div style={{
                  display: 'flex',
                  gap: '5px',
                  padding: '8px',
                  backgroundColor: '#f5f5f5',
                  borderBottom: '1px solid #ddd'
                }}>
                  <button
                    type="button"
                    onClick={() => setCastFilter('all')}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      backgroundColor: castFilter === 'all' ? '#007AFF' : 'white',
                      color: castFilter === 'all' ? 'white' : '#333',
                      border: '2px solid #007AFF',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    全
                  </button>
                  <button
                    type="button"
                    onClick={() => setCastFilter('attending')}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      backgroundColor: castFilter === 'attending' ? '#007AFF' : 'white',
                      color: castFilter === 'attending' ? 'white' : '#333',
                      border: '2px solid #007AFF',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    出勤
                  </button>
                </div>

                {/* キャストリスト */}
                <div style={{
                  maxHeight: '250px',
                  overflowY: 'auto'
                }}>
                  <div
                    onClick={() => {
                      onUpdateFormData({ castName: '' })
                      setShowCastDropdown(false)
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background-color 0.2s',
                      color: '#999'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    -- 選択 --
                  </div>
                  {(castFilter === 'all' ? castList : attendingCasts).map(name => (
                    <div
                      key={name}
                      onClick={() => {
                        onUpdateFormData({ castName: name })
                        setShowCastDropdown(false)
                      }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 来店種別 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1
        }}>
          <span style={{
            minWidth: '80px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>来店種別：</span>
          <select
            value={visitType}
            onChange={(e) => onUpdateFormData({ visitType: e.target.value })}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white',
              WebkitAppearance: 'menulist',
              appearance: 'auto',
              touchAction: 'manipulation',
              position: 'relative',
              zIndex: 9999,
              pointerEvents: 'auto'
            }}
          >
            <option value="">-- 選択 --</option>
            <option value="初回">初回</option>
            <option value="再訪">再訪</option>
            <option value="常連">常連</option>
          </select>
        </div>
      </div>
    </div>
  )
}
