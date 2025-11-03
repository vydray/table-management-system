import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

// カスタムフック
import { useAttendanceData } from '../hooks/useAttendanceData'
import { useAttendanceRows } from '../hooks/useAttendanceRows'
import { useAttendanceHandlers } from '../hooks/useAttendanceHandlers'

// スタイル
import {
  containerStyle,
  headerStyle,
  backButtonStyle,
  headerTitleStyle,
  contentAreaStyle
} from '../styles/settingsStyles'

export default function Attendance() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // カスタムフック - 勤怠データ管理
  const {
    attendanceRows,
    setAttendanceRows,
    casts,
    loading,
    saving,
    loadCasts,
    loadAttendance,
    saveAttendance,
    deleteRow: deleteRowFromDB
  } = useAttendanceData()

  // カスタムフック - 行管理
  const {
    showDropdowns,
    setShowDropdowns,
    addRow: addRowHelper,
    updateRow: updateRowHelper,
    toggleDropdown,
    selectCast: selectCastHelper
  } = useAttendanceRows()

  // カスタムフック - ハンドラー
  const {
    addRow,
    deleteRow,
    updateRow,
    selectCast,
    formatCurrency,
    handleCurrencyInput,
    handleSave,
    timeOptions
  } = useAttendanceHandlers(
    attendanceRows,
    setAttendanceRows,
    setShowDropdowns,
    addRowHelper,
    updateRowHelper,
    selectCastHelper,
    deleteRowFromDB,
    saveAttendance,
    selectedDate
  )

  useEffect(() => {
    loadCasts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadAttendance(selectedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  return (
    <>
      <Head>
        <title>👥 勤怠登録 - テーブル管理システム</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <style jsx global>{`
        /* 勤怠登録ページ専用のスタイル */
        body {
          overflow: auto !important;
          position: static !important;
        }
        
        /* テーブルのフォントサイズを強制 */
        .attendance-page table {
          font-size: 14px !important;
        }
        
        .attendance-page td,
        .attendance-page th {
          font-size: 14px !important;
        }
        
        .attendance-page select,
        .attendance-page input {
          font-size: 14px !important;
        }
        
        /* スクロールバーのスタイル */
        .attendance-page ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .attendance-page ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .attendance-page ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        .attendance-page ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>

      <div style={containerStyle}>
        {/* ヘッダー */}
        <div style={headerStyle}>
          <button onClick={() => router.push('/')} style={backButtonStyle}>
            ←
          </button>
          <h1 style={headerTitleStyle}>
            👥 勤怠登録
          </h1>
        </div>

        {/* コンテンツエリア */}
        <div className="attendance-page" style={{
          ...contentAreaStyle,
          padding: '20px',
          height: 'calc(100vh - 54px)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 日付選択 */}
          <div style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{
              fontSize: '16px',
              color: '#333',
              fontWeight: '500'
            }}>
              日付:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '10px 16px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                outline: 'none',
                cursor: 'pointer',
                backgroundColor: 'white',
                color: '#333'
              }}
            />
          </div>

          {/* テーブル */}
          <div style={{
            flex: 1,
            backgroundColor: '#fff',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
          {loading ? (
            <div style={{ 
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8e8e93',
              fontSize: '18px'
            }}>
              読み込み中...
            </div>
          ) : (
            <div style={{ 
              flex: 1,
              overflowX: 'auto',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                fontSize: '14px'
              }}>
                <thead style={{ 
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#f8f8f8',
                  zIndex: 10
                }}>
                  <tr>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'left', 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0',
                      backgroundColor: '#f8f8f8',
                      width: '140px'
                    }}>
                      名前
                    </th>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'center', 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0',
                      backgroundColor: '#f8f8f8',
                      width: '100px'
                    }}>
                      出勤
                    </th>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'center', 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0',
                      backgroundColor: '#f8f8f8',
                      width: '100px'
                    }}>
                      退勤
                    </th>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'center', 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0',
                      backgroundColor: '#f8f8f8',
                      width: '100px'
                    }}>
                      状況
                    </th>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'center', 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0',
                      backgroundColor: '#f8f8f8',
                      width: '90px'
                    }}>
                      遅刻
                    </th>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'center', 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0',
                      backgroundColor: '#f8f8f8',
                      width: '90px'
                    }}>
                      休憩
                    </th>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'center', 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0',
                      backgroundColor: '#f8f8f8',
                      width: '110px'
                    }}>
                      日払
                    </th>
                    <th style={{ 
                      padding: '12px 8px', 
                      textAlign: 'center', 
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      borderBottom: '2px solid #e0e0e0',
                      backgroundColor: '#f8f8f8',
                      width: '50px'
                    }}>
                      削除
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRows.map((row, index) => (
                    <tr key={row.id} style={{ 
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '8px', position: 'relative' }}>
                        <div className="cast-name-container" style={{ position: 'relative' }}>
                          <div
                            onClick={() => toggleDropdown(row.id)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              paddingRight: '30px',
                              border: '1px solid #d0d0d0',
                              borderRadius: '6px',
                              fontSize: '14px',
                              backgroundColor: '#fff',
                              color: row.cast_name ? '#000' : '#999',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxSizing: 'border-box',
                              userSelect: 'none',
                              WebkitUserSelect: 'none'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#007AFF'
                              e.currentTarget.style.backgroundColor = '#f8f8f8'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#d0d0d0'
                              e.currentTarget.style.backgroundColor = '#fff'
                            }}
                          >
                            {row.cast_name || 'キャストを選択'}
                          </div>
                          
                          {/* ドロップダウン矢印 */}
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
                          
                          {/* ドロップダウンリスト */}
                          {showDropdowns[row.id] && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              maxHeight: '300px',
                              overflowY: 'auto',
                              backgroundColor: '#fff',
                              border: '1px solid #007AFF',
                              borderRadius: '6px',
                              marginTop: '2px',
                              zIndex: 1000,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}>
{casts.length === 0 ? (
                                <div style={{
                                  padding: '10px 12px',
                                  fontSize: '14px',
                                  color: '#888',
                                  textAlign: 'center'
                                }}>
                                  キャストが登録されていません
                                </div>
                              ) : (
                                <>
                                  {/* 未選択オプション */}
                                  <div
                                    onClick={() => selectCast(index, '')}
                                    style={{
                                      padding: '10px 12px',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      borderBottom: '1px solid #f0f0f0',
                                      transition: 'background-color 0.2s',
                                      color: '#999'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    -- 未選択 --
                                  </div>
                                  {casts.map(cast => {
                                    // 既に選択されているかチェック
                                    const isAlreadySelected = attendanceRows.some((row, i) => 
                                      i !== index && row.cast_name === cast.name
                                    )
                                    
                                    return (
                                      <div
                                        key={cast.id}
                                        onClick={() => selectCast(index, cast.name)}
                                        style={{
                                          padding: '10px 12px',
                                          cursor: isAlreadySelected ? 'not-allowed' : 'pointer',
                                          fontSize: '14px',
                                          borderBottom: '1px solid #f0f0f0',
                                          transition: 'background-color 0.2s',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          opacity: isAlreadySelected ? 0.5 : 1,
                                          backgroundColor: isAlreadySelected ? '#f5f5f5' : 'transparent'
                                        }}
                                        onMouseEnter={(e) => !isAlreadySelected && (e.currentTarget.style.backgroundColor = '#f0f8ff')}
                                        onMouseLeave={(e) => !isAlreadySelected && (e.currentTarget.style.backgroundColor = 'transparent')}
                                      >
                                        <span style={{
                                          textDecoration: isAlreadySelected ? 'line-through' : 'none'
                                        }}>
                                          {cast.name}
                                        </span>
                                        <span style={{
                                          fontSize: '12px',
                                          color: '#888',
                                          marginLeft: '8px'
                                        }}>
                                          {cast.status === '体験' && '(体験)'}
                                          {isAlreadySelected && '(選択済み)'}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select
                          value={row.check_in_time}
                          onChange={(e) => updateRow(index, 'check_in_time', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: '1px solid #d0d0d0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: '#fff',
                            color: '#000',
                            outline: 'none',
                            textAlign: 'center',
                            WebkitAppearance: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#007AFF'
                            e.currentTarget.style.backgroundColor = '#f8f8f8'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d0d0d0'
                            e.currentTarget.style.backgroundColor = '#fff'
                          }}
                        >
                          {timeOptions.map(time => (
                            <option key={time} value={time}>{time || '--:--'}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select
                          value={row.check_out_time}
                          onChange={(e) => updateRow(index, 'check_out_time', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: '1px solid #d0d0d0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: '#fff',
                            color: '#000',
                            outline: 'none',
                            textAlign: 'center',
                            WebkitAppearance: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#007AFF'
                            e.currentTarget.style.backgroundColor = '#f8f8f8'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d0d0d0'
                            e.currentTarget.style.backgroundColor = '#fff'
                          }}
                        >
                          {timeOptions.map(time => (
                            <option key={time} value={time}>{time || '--:--'}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select
                          value={row.status}
                          onChange={(e) => updateRow(index, 'status', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: '1px solid #d0d0d0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: row.status === '出勤' ? '#e6f7e6' : 
                                           row.status === '当欠' ? '#ffe6e6' : 
                                           row.status === '無欠' ? '#ffe6e6' : 
                                           row.status === '遅刻' ? '#fff7e6' : 
                                           row.status === '早退' ? '#fff7e6' : 
                                           row.status === '公欠' ? '#e6e6ff' : 
                                           row.status === '事前欠' ? '#f0e6ff' : '#fff',
                            color: '#000',
                            outline: 'none',
                            textAlign: 'center',
                            fontWeight: '600',
                            WebkitAppearance: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#007AFF'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#d0d0d0'}
                        >
                          <option value="未設定">未設定</option>
                          <option value="出勤">出勤</option>
                          <option value="当欠">当欠</option>
                          <option value="無欠">無欠</option>
                          <option value="遅刻">遅刻</option>
                          <option value="早退">早退</option>
                          <option value="公欠">公欠</option>
                          <option value="事前欠">事前欠</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select
                          value={row.late_minutes}
                          onChange={(e) => updateRow(index, 'late_minutes', Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: '1px solid #d0d0d0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: '#fff',
                            color: '#000',
                            outline: 'none',
                            textAlign: 'center',
                            WebkitAppearance: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#007AFF'
                            e.currentTarget.style.backgroundColor = '#f8f8f8'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d0d0d0'
                            e.currentTarget.style.backgroundColor = '#fff'
                          }}
                        >
                          <option value={0}>0分</option>
                          <option value={15}>15分</option>
                          <option value={30}>30分</option>
                          <option value={45}>45分</option>
                          <option value={60}>60分</option>
                          <option value={90}>90分</option>
                          <option value={120}>120分</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select
                          value={row.break_minutes}
                          onChange={(e) => updateRow(index, 'break_minutes', Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: '1px solid #d0d0d0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: '#fff',
                            color: '#000',
                            outline: 'none',
                            textAlign: 'center',
                            WebkitAppearance: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#007AFF'
                            e.currentTarget.style.backgroundColor = '#f8f8f8'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d0d0d0'
                            e.currentTarget.style.backgroundColor = '#fff'
                          }}
                        >
                          <option value={0}>0分</option>
                          <option value={30}>30分</option>
                          <option value={60}>60分</option>
                          <option value={90}>90分</option>
                          <option value={120}>120分</option>
                          <option value={150}>150分</option>
                          <option value={180}>180分</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="text"
                          value={formatCurrency(row.daily_payment)}
                          onChange={(e) => handleCurrencyInput(index, e.target.value)}
                          placeholder="¥0"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: '1px solid #d0d0d0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            textAlign: 'right',
                            backgroundColor: '#fff',
                            color: '#000',
                            outline: 'none',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#007AFF'
                            e.currentTarget.style.backgroundColor = '#f8f8f8'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d0d0d0'
                            e.currentTarget.style.backgroundColor = '#fff'
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          onClick={() => deleteRow(index)}
                          style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            margin: '0 auto'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#ff0000'
                            e.currentTarget.style.transform = 'scale(1.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ff4444'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ボタンエリア */}
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 -1px 3px rgba(0,0,0,0.05)'
        }}>
          <button
            onClick={addRow}
            style={{
              padding: '12px 28px',
              backgroundColor: 'white',
              border: '2px solid #FF9800',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#FF9800',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FFF3E0'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white'
            }}
          >
            <span style={{ fontSize: '20px' }}>+</span> 行を追加
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 40px',
              backgroundColor: saving ? '#c0c0c0' : '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              opacity: saving ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = '#F57C00'
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = '#FF9800'
              }
            }}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
        </div>
      </div>
    </>
  )
}