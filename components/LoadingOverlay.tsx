import { FC } from 'react'

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
}

export const LoadingOverlay: FC<LoadingOverlayProps> = ({ isLoading, message }) => {
  if (!isLoading) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9998
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          margin: '0 auto 20px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #FF9800',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{
          margin: 0,
          fontSize: '16px',
          color: '#666'
        }}>
          {message || '処理中...'}
        </p>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}