import React from 'react'

interface CustomerInfoFormProps {
  guestName: string
  castName: string
  visitType: string
  castList: string[]
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
  onUpdateFormData
}) => {
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
          flex: 1
        }}>
          <span style={{
            minWidth: '80px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>推し：</span>
          <select
            value={castName}
            onChange={(e) => onUpdateFormData({ castName: e.target.value })}
            size={typeof window !== 'undefined' && window.innerWidth <= 1024 ? Math.min(10, castList.length + 1) : 1}
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
            {castList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
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
