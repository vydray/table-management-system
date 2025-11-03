import { FC } from 'react'
import { NumberPad } from './NumberPad'

interface PaymentModalProps {
  isOpen: boolean
  currentTable: string
  layoutScale: number
  paymentData: {
    cash: number
    card: number
    other: number
    otherMethod: string
  }
  activePaymentInput: 'cash' | 'card' | 'other'
  subtotal: number
  serviceTax: number
  total: number
  roundedTotal: number
  roundingAdjustment: number
  formData: {
    castName: string
    guestName: string
  }
  cardFeeRate: number
  onNumberClick: (num: string) => void
  onQuickAmount: (amount: number) => void
  onDeleteNumber: () => void
  onClearNumber: () => void
  onChangeActiveInput: (input: 'cash' | 'card' | 'other') => void
  onChangeOtherMethod: (value: string) => void
  onCompleteCheckout: () => void
  onClose: () => void
}

export const PaymentModal: FC<PaymentModalProps> = ({
  isOpen,
  currentTable,
  layoutScale,
  paymentData,
  activePaymentInput,
  subtotal,  // eslint-disable-line @typescript-eslint/no-unused-vars
  serviceTax,  // eslint-disable-line @typescript-eslint/no-unused-vars
  total,
  roundedTotal,
  roundingAdjustment,
  formData,
  cardFeeRate,
  onNumberClick,
  onQuickAmount,
  onDeleteNumber,
  onClearNumber,
  onChangeActiveInput,
  onChangeOtherMethod,
  onCompleteCheckout,
  onClose
}) => {
  if (!isOpen) return null

  const totalPaid = paymentData.cash + paymentData.card + paymentData.other
  const change = totalPaid - roundedTotal
  const isShortage = totalPaid > 0 && totalPaid < roundedTotal

  // カード手数料の計算（カード金額のみに適用）
  const cardFee = paymentData.card > 0 && cardFeeRate > 0
    ? Math.floor(paymentData.card * (cardFeeRate / 100))
    : 0

  return (
    <>
      {/* 背景オーバーレイ */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998 
        }}
        onClick={onClose}
      />
      
      {/* モーダル本体 */}
      <div 
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 10001,
          width: window.innerWidth > 900 ? '900px' : '95%',
          maxWidth: '95%',
          maxHeight: '90vh',
          display: 'flex',
          overflow: 'hidden',
          fontSize: window.innerWidth > 900 ? '16px' : `${14 * layoutScale}px`
        }}
      >
        {/* 左側：支払い方法入力部分 */}
        <div style={{
          flex: 1,
          padding: `${30 * layoutScale}px`,
          overflowY: 'auto'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: `${20 * layoutScale}px`
          }}>
            <h3 style={{ margin: 0, fontSize: `${20 * layoutScale}px` }}>
              会計処理 - {currentTable}
            </h3>
          </div>
          
          {/* 合計金額表示 */}
          <div style={{
            marginBottom: `${25 * layoutScale}px`,
            padding: `${15 * layoutScale}px`,
            backgroundColor: '#f5f5f5',
            borderRadius: '5px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: `${15 * layoutScale}px`,
              paddingBottom: `${15 * layoutScale}px`,
              borderBottom: '2px solid #ccc'
            }}>
              <div>
                <strong style={{ fontSize: `${16 * layoutScale}px` }}>
                  小計：¥{total.toLocaleString()}
                </strong>
              </div>
              <div style={{
                display: 'flex',
                gap: `${30 * layoutScale}px`,
                fontSize: `${16 * layoutScale}px`
              }}>
                <div><strong>推し：</strong>{formData.castName || ''}</div>
                <div><strong>お客様：</strong>{formData.guestName || ''}</div>
              </div>
            </div>

            {cardFee > 0 && (
              <div style={{
                marginBottom: `${10 * layoutScale}px`,
                color: '#2196F3',
                fontSize: `${14 * layoutScale}px`
              }}>
                カード手数料 (+{cardFeeRate}%): +¥{cardFee.toLocaleString()}
              </div>
            )}

            {roundingAdjustment !== 0 && (
              <div style={{
                marginBottom: `${10 * layoutScale}px`,
                color: roundingAdjustment < 0 ? '#d32f2f' : '#388e3c',
                fontSize: `${14 * layoutScale}px`
              }}>
                端数調整: {roundingAdjustment < 0 ? '' : '+'}¥{roundingAdjustment.toLocaleString()}
              </div>
            )}

            <div style={{
              fontSize: `${24 * layoutScale}px`,
              fontWeight: 'bold',
              borderTop: '1px solid #ccc',
              paddingTop: `${10 * layoutScale}px`,
              textAlign: 'center'
            }}>
              合計金額: ¥{roundedTotal.toLocaleString()}
            </div>
          </div>

          {/* 支払い目安表示 */}
          {cardFeeRate > 0 && (
            <div style={{
              marginBottom: `${25 * layoutScale}px`,
              padding: `${15 * layoutScale}px`,
              backgroundColor: '#e3f2fd',
              borderRadius: '5px',
              border: '1px solid #2196F3'
            }}>
              <div style={{
                fontSize: `${14 * layoutScale}px`,
                fontWeight: 'bold',
                marginBottom: `${10 * layoutScale}px`,
                color: '#1976d2'
              }}>
                💡 支払い目安
              </div>

              {/* カード全額払いの場合 */}
              <div style={{
                marginBottom: `${10 * layoutScale}px`,
                padding: `${8 * layoutScale}px`,
                backgroundColor: 'white',
                borderRadius: '3px'
              }}>
                <div style={{
                  fontSize: `${12 * layoutScale}px`,
                  color: '#666',
                  marginBottom: `${5 * layoutScale}px`
                }}>
                  【カード全額】
                </div>
                <div style={{
                  fontSize: `${14 * layoutScale}px`,
                  fontWeight: 'bold'
                }}>
                  カード: ¥{Math.floor(roundedTotal + roundedTotal * (cardFeeRate / 100)).toLocaleString()}
                  <span style={{
                    fontSize: `${11 * layoutScale}px`,
                    color: '#2196F3',
                    marginLeft: '5px'
                  }}>
                    (手数料込み)
                  </span>
                </div>
              </div>

              {/* 現金併用の場合 */}
              <div style={{
                padding: `${8 * layoutScale}px`,
                backgroundColor: 'white',
                borderRadius: '3px'
              }}>
                <div style={{
                  fontSize: `${12 * layoutScale}px`,
                  color: '#666',
                  marginBottom: `${5 * layoutScale}px`
                }}>
                  【現金併用】
                </div>
                {(() => {
                  // 50/50, 30/70, 70/30の3パターンを表示
                  const scenarios = [
                    { cashRatio: 0.5, label: '50/50' },
                    { cashRatio: 0.3, label: '30/70' },
                    { cashRatio: 0.7, label: '70/30' }
                  ]

                  return scenarios.map(({ cashRatio }, index) => {
                    const cashAmount = Math.floor(roundedTotal * cashRatio / 1000) * 1000
                    const cardBase = roundedTotal - cashAmount
                    const cardWithFee = Math.floor(cardBase + cardBase * (cardFeeRate / 100))
                    const totalAmount = cashAmount + cardWithFee

                    return (
                      <div
                        key={index}
                        style={{
                          fontSize: `${13 * layoutScale}px`,
                          marginBottom: index < scenarios.length - 1 ? `${5 * layoutScale}px` : 0,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span>
                          現金 ¥{cashAmount.toLocaleString()} + カード ¥{cardWithFee.toLocaleString()}
                        </span>
                        <span style={{ fontWeight: 'bold' }}>
                          = ¥{totalAmount.toLocaleString()}
                        </span>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          )}

          {/* 支払い方法入力 */}
          <div style={{ marginBottom: `${20 * layoutScale}px` }}>
            <h4 style={{ marginBottom: `${15 * layoutScale}px`, fontSize: `${18 * layoutScale}px` }}>
              支払い金額:
            </h4>
            
            {/* 現金 */}
            <div style={{ marginBottom: `${15 * layoutScale}px` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: `${10 * layoutScale}px` }}>
                <label style={{ width: `${80 * layoutScale}px`, fontSize: `${14 * layoutScale}px` }}>
                  現金
                </label>
                <span style={{ fontSize: `${16 * layoutScale}px` }}>¥</span>
                <input
                  type="text"
                  value={paymentData.cash ? paymentData.cash.toLocaleString() : '0'}
                  onClick={() => onChangeActiveInput('cash')}
                  readOnly
                  style={{
                    flex: 1,
                    padding: `${8 * layoutScale}px`,
                    border: activePaymentInput === 'cash' ? '2px solid #ff9800' : '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: `${16 * layoutScale}px`,
                    cursor: 'pointer',
                    backgroundColor: activePaymentInput === 'cash' ? '#fff8e1' : 'white'
                  }}
                />
              </div>
            </div>
            
            {/* カード */}
            <div style={{ marginBottom: `${15 * layoutScale}px` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: `${10 * layoutScale}px` }}>
                <label style={{ width: `${80 * layoutScale}px`, fontSize: `${14 * layoutScale}px` }}>
                  カード
                  {cardFeeRate > 0 && (
                    <span style={{ fontSize: `${11 * layoutScale}px`, color: '#2196F3', marginLeft: '4px' }}>
                      (+{cardFeeRate}%)
                    </span>
                  )}
                </label>
                <span style={{ fontSize: `${16 * layoutScale}px` }}>¥</span>
                <input
                  type="text"
                  value={paymentData.card ? paymentData.card.toLocaleString() : '0'}
                  onClick={() => onChangeActiveInput('card')}
                  readOnly
                  style={{
                    flex: 1,
                    padding: `${8 * layoutScale}px`,
                    border: activePaymentInput === 'card' ? '2px solid #ff9800' : '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: `${16 * layoutScale}px`,
                    cursor: 'pointer',
                    backgroundColor: activePaymentInput === 'card' ? '#fff8e1' : 'white'
                  }}
                />
              </div>
            </div>
            
            {/* その他 */}
            <div style={{ marginBottom: `${10 * layoutScale}px` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: `${10 * layoutScale}px` }}>
                <label style={{ width: `${80 * layoutScale}px`, fontSize: `${14 * layoutScale}px` }}>
                  その他
                </label>
                <span style={{ fontSize: `${16 * layoutScale}px` }}>¥</span>
                <input
                  type="text"
                  value={paymentData.other ? paymentData.other.toLocaleString() : '0'}
                  onClick={() => onChangeActiveInput('other')}
                  readOnly
                  style={{
                    flex: 1,
                    padding: `${8 * layoutScale}px`,
                    border: activePaymentInput === 'other' ? '2px solid #ff9800' : '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: `${16 * layoutScale}px`,
                    cursor: 'pointer',
                    backgroundColor: activePaymentInput === 'other' ? '#fff8e1' : 'white'
                  }}
                />
              </div>
            </div>
            
            {/* その他支払い方法の詳細 */}
            {paymentData.other > 0 && (
              <div style={{ marginLeft: `${100 * layoutScale}px`, marginBottom: `${15 * layoutScale}px` }}>
                <input
                  type="text"
                  value={paymentData.otherMethod}
                  onChange={(e) => onChangeOtherMethod(e.target.value)}
                  placeholder="PayPay、LINE Pay等"
                  style={{
                    width: '100%',
                    padding: `${6 * layoutScale}px`,
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: `${14 * layoutScale}px`
                  }}
                />
              </div>
            )}
          </div>
          
          {/* 支払い合計とお釣り */}
          <div style={{ 
            marginBottom: `${20 * layoutScale}px`,
            padding: `${15 * layoutScale}px`,
            backgroundColor: '#f0f8ff',
            borderRadius: '5px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: `${10 * layoutScale}px`, fontSize: `${16 * layoutScale}px` }}>
              支払合計: ¥{totalPaid.toLocaleString()}
            </div>
            {totalPaid >= roundedTotal && (
              <div style={{ fontSize: `${20 * layoutScale}px`, color: '#4CAF50', fontWeight: 'bold' }}>
                おつり: ¥{change.toLocaleString()}
              </div>
            )}
            {isShortage && (
              <div style={{ color: '#f44336', fontSize: `${16 * layoutScale}px` }}>
                不足: ¥{(roundedTotal - totalPaid).toLocaleString()}
              </div>
            )}
          </div>
          
          {/* ボタン */}
          <div style={{ display: 'flex', gap: `${10 * layoutScale}px` }}>
            <button
              onClick={onCompleteCheckout}
              style={{
                flex: 1,
                padding: `${12 * layoutScale}px`,
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: `${16 * layoutScale}px`,
                cursor: 'pointer',
                fontWeight: 'bold',
                opacity: totalPaid < roundedTotal ? 0.6 : 1
              }}
              disabled={totalPaid < roundedTotal}
            >
              会計完了
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: `${12 * layoutScale}px`,
                backgroundColor: '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: `${16 * layoutScale}px`,
                cursor: 'pointer'
              }}
            >
              キャンセル
            </button>
          </div>
        </div>

        {/* 右側：数字パッド */}
        <NumberPad
          currentValue={paymentData[activePaymentInput]}
          layoutScale={layoutScale}
          onNumberClick={onNumberClick}
          onQuickAmount={onQuickAmount}
          onDeleteNumber={onDeleteNumber}
          onClearNumber={onClearNumber}
        />
      </div>
    </>
  )
}