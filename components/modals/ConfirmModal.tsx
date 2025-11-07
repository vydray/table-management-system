import { FC } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
}

export const ConfirmModal: FC<ConfirmModalProps> = ({ 
  isOpen, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'はい',
  cancelText = 'いいえ'
}) => {
  if (!isOpen) return null

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          maxWidth: '400px',
          width: '90%'
        }}
      >
        <p style={{
          margin: '0 0 30px 0',
          fontSize: '18px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {message}
        </p>
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 30px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '12px 30px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}