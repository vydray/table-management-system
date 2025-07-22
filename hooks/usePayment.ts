import { useState } from 'react'

export const usePayment = () => {
  const [paymentData, setPaymentData] = useState({
    cash: 0,
    card: 0,
    other: 0,
    otherMethod: ''
  })
  const [activePaymentInput, setActivePaymentInput] = useState<'cash' | 'card' | 'other'>('cash')

  const handleNumberClick = (num: string) => {
    setPaymentData(prev => {
      const currentValue = prev[activePaymentInput]
      const newValue = currentValue === 0 ? parseInt(num) : parseInt(currentValue.toString() + num)
      return {
        ...prev,
        [activePaymentInput]: newValue
      }
    })
  }

  const handleQuickAmount = (amount: number) => {
    setPaymentData(prev => ({
      ...prev,
      [activePaymentInput]: amount
    }))
  }

  const handleDeleteNumber = () => {
    setPaymentData(prev => {
      const currentValue = prev[activePaymentInput].toString()
      if (currentValue.length > 1) {
        return {
          ...prev,
          [activePaymentInput]: parseInt(currentValue.slice(0, -1))
        }
      } else {
        return {
          ...prev,
          [activePaymentInput]: 0
        }
      }
    })
  }

  const handleClearNumber = () => {
    setPaymentData(prev => ({
      ...prev,
      [activePaymentInput]: 0
    }))
  }

  const resetPaymentData = () => {
    setPaymentData({
      cash: 0,
      card: 0,
      other: 0,
      otherMethod: ''
    })
    setActivePaymentInput('cash')
  }

  const setOtherMethod = (method: string) => {
    setPaymentData(prev => ({
      ...prev,
      otherMethod: method
    }))
  }

  return {
    paymentData,
    activePaymentInput,
    setActivePaymentInput,
    handleNumberClick,
    handleQuickAmount,
    handleDeleteNumber,
    handleClearNumber,
    resetPaymentData,
    setOtherMethod
  }
}