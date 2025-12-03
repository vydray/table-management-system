import { useEffect } from 'react'
import { useAttendanceStatusData } from '../../hooks/useAttendanceStatusData'
import { useAttendanceStatusModal } from '../../hooks/useAttendanceStatusModal'

export default function AttendanceStatus() {
  const {
    attendanceStatuses,
    loadAttendanceStatuses,
    addAttendanceStatus: addStatus,
    updateStatus: updateStatusInDB,
    toggleStatusActive,
    deleteStatus
  } = useAttendanceStatusData()

  const {
    showAddStatus,
    showEditStatus,
    editingStatus,
    newStatusName,
    setNewStatusName,
    newStatusColor,
    setNewStatusColor,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal
  } = useAttendanceStatusModal()

  const statusColorPresets = [
    '#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0',
    '#00BCD4', '#8BC34A', '#FFC107', '#795548', '#607D8B'
  ]

  // 追加処理のラッパー
  const handleAddStatus = async () => {
    const success = await addStatus(newStatusName, newStatusColor, attendanceStatuses)
    if (success) {
      closeAddModal()
    }
  }

  // 更新処理のラッパー
  const handleUpdateStatus = async () => {
    if (!editingStatus) return
    const success = await updateStatusInDB(editingStatus.id, newStatusName, newStatusColor, attendanceStatuses)
    if (success) {
      closeEditModal()
    }
  }

  useEffect(() => {
    loadAttendanceStatuses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
  <div style={{
    position: 'relative',
    paddingBottom: '100px'
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    }}>
      <h2 style={{ margin: 0, fontSize: '20px' }}>勤怠ステータス管理</h2>
      <button
        onClick={openAddModal}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4A90E2',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        + ステータス追加
      </button>
    </div>
    
      <div style={{
        backgroundColor: '#e8f5e9',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '20px',
        fontSize: '14px',
        color: '#2e7d32'
      }}>
        <strong>💡 ヒント:</strong> 有効にしたステータスは業務日報の人数集計で「出勤」として扱われます
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {/* ヘッダー行 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '50px 1fr 100px 60px 60px',
          gap: '10px',
          padding: '12px 20px',
          backgroundColor: '#f5f5f5',
          borderBottom: '2px solid #e0e0e0',
          fontWeight: 'bold',
          fontSize: '14px',
          color: '#666'
        }}>
          <div style={{ textAlign: 'center' }}>色</div>
          <div>項目</div>
          <div style={{ textAlign: 'center' }}>出勤扱い</div>
          <div style={{ textAlign: 'center' }}>編集</div>
          <div style={{ textAlign: 'center' }}>削除</div>
        </div>
        {/* データ行 */}
        {attendanceStatuses.map((status, index) => (
          <div
            key={status.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 100px 60px 60px',
              gap: '10px',
              padding: '12px 20px',
              borderBottom: index < attendanceStatuses.length - 1 ? '1px solid #eee' : 'none',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '5px',
                  backgroundColor: status.color
                }}
              />
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>{status.name}</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <input
                type="checkbox"
                checked={status.is_active}
                onChange={() => toggleStatusActive(status.id, status.is_active)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: '#4CAF50'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => openEditModal(status)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                編集
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => deleteStatus(status.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ステータス追加モーダル */}
      {showAddStatus && (
        <div
          onClick={closeAddModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '30px',
              width: '90%',
              maxWidth: '400px'
            }}
          >
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>ステータス追加</h3>

            <input
              type="text"
              inputMode="text"
              lang="ja"
              placeholder="ステータス名"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                marginBottom: '15px'
              }}
            />

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                カラー選択
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {statusColorPresets.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewStatusColor(color)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '5px',
                      backgroundColor: color,
                      border: newStatusColor === color ? '3px solid #333' : '1px solid #ddd',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeAddModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleAddStatus}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4A90E2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ステータス編集モーダル */}
      {showEditStatus && (
        <div
          onClick={closeEditModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '30px',
              width: '90%',
              maxWidth: '400px'
            }}
          >
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>ステータス編集</h3>

            <input
              type="text"
              inputMode="text"
              lang="ja"
              placeholder="ステータス名"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                marginBottom: '15px'
              }}
            />

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                カラー選択
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {statusColorPresets.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewStatusColor(color)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '5px',
                      backgroundColor: color,
                      border: newStatusColor === color ? '3px solid #333' : '1px solid #ddd',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeEditModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleUpdateStatus}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}