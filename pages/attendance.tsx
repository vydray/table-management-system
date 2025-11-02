import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

// カスタムフック
import { useAttendanceData } from '../hooks/useAttendanceData'
import { useAttendanceRows } from '../hooks/useAttendanceRows'

// 型定義
interface AttendanceRow {
  id: string
  cast_name: string
  check_in_time: string
  check_out_time: string
  status: string
  late_minutes: number
  break_minutes: number
  daily_payment: number
}

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

  // 行追加ハンドラー
  const addRow = () => {
    addRowHelper(attendanceRows, setAttendanceRows)
  }

  // 行削除ハンドラー
  const deleteRow = async (index: number) => {
    await deleteRowFromDB(index, selectedDate)
  }

  // 行更新ハンドラー（金額フォーマット対応）
  const updateRow = (index: number, field: keyof AttendanceRow, value: string | number) => {
    // 日払い金額の場合は数値変換
    if (field === 'daily_payment') {
      const numericValue = parseInt(value.toString().replace(/[^\d]/g, '') || '0')
      updateRowHelper(index, field, numericValue, attendanceRows, setAttendanceRows)
    } else {
      updateRowHelper(index, field, value, attendanceRows, setAttendanceRows)
    }
  }

  // キャスト選択ハンドラー
  const selectCast = (index: number, castName: string) => {
    // 空の選択の場合はそのまま許可
    if (!castName) {
      updateRow(index, 'cast_name', castName)
      return
    }

    // 同じ名前が既に選択されているかチェック
    const isDuplicate = attendanceRows.some((row, i) =>
      i !== index && row.cast_name === castName
    )

    if (isDuplicate) {
      alert(`${castName}さんは既に選択されています`)
      return
    }

    selectCastHelper(index, castName, attendanceRows[index].id, attendanceRows, setAttendanceRows)
  }

  // 金額をフォーマット（¥とカンマ付き）
  const formatCurrency = (value: number): string => {
    if (!value) return ''
    return `¥${value.toLocaleString()}`
  }

  // 金額入力をハンドル
  const handleCurrencyInput = (index: number, value: string) => {
    // ¥とカンマを除去して数値のみ抽出
    const numericValue = value.replace(/[¥,]/g, '')
    updateRow(index, 'daily_payment', numericValue)
  }

  // 保存ハンドラー
  const handleSave = async () => {
    await saveAttendance(selectedDate)
  }


  useEffect(() => {
    loadCasts()
  }, [])

useEffect(() => {
    loadAttendance(selectedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  // クリックイベントの処理（ドロップダウンを閉じる）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.cast-name-container')) {
        setShowDropdowns({})
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  // 時間の選択肢を生成（10:00〜29:00）
  const generateTimeOptions = () => {
    const options = ['']
    for (let hour = 10; hour <= 29; hour++) {
      const displayHour = hour > 24 ? hour - 24 : hour
      for (const minute of ['00', '30']) {
        options.push(`${displayHour.toString().padStart(2, '0')}:${minute}`)
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

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

      <div className="attendance-page" style={{
        width: '100%',
        maxWidth: '1280px',
        height: '100vh',
        maxHeight: '800px',
        margin: '0 auto',
        backgroundColor: '#f2f2f7',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* ヘッダー */}
        <div style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0e0e0',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px',
                color: '#007AFF',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ← 戻る
            </button>
            <h1 style={{ 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: '600',
              color: '#000'
            }}>
              勤怠登録
            </h1>
          </div>

          <div style={{ 
            fontSize: '18px', 
            fontWeight: '500',
            color: '#000'
          }}>
            {new Date(selectedDate).toLocaleDateString('ja-JP', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'short'
            })}
          </div>
        </div>

        {/* 日付選択 */}
        <div style={{
          backgroundColor: '#fff',
          padding: '16px 20px',
          borderBottom: '1px solid #e0e0e0',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontSize: '16px',
              color: '#000',
              fontWeight: '500'
            }}>
              日付:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '8px 16px',
                fontSize: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                outline: 'none',
                cursor: 'pointer',
                backgroundColor: '#f8f8f8',
                color: '#000',
                fontWeight: '500',
                WebkitAppearance: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#007AFF'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
            />
          </div>
        </div>

        {/* テーブル */}
        <div style={{
          flex: 1,
          backgroundColor: '#fff',
          margin: '0 16px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
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
              padding: '14px 28px',
              backgroundColor: '#f0f0f0',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              color: '#007AFF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <span style={{ fontSize: '20px' }}>+</span> 行を追加
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '14px 48px',
              backgroundColor: saving ? '#c0c0c0' : '#007AFF',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.2s',
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 2px 8px rgba(0,122,255,0.3)'
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = '#0051D5'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,122,255,0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = '#007AFF'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,122,255,0.3)'
              }
            }}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </>
  )
}