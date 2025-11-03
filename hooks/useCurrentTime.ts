import { useState, useEffect } from 'react'

export const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const date = String(now.getDate()).padStart(2, '0')
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const seconds = now.getSeconds().toString().padStart(2, '0')
      setCurrentTime(`${year}/${month}/${date} ${hours}:${minutes}:${seconds}`)
    }

    updateTime()
    const timeInterval = setInterval(updateTime, 1000)

    return () => clearInterval(timeInterval)
  }, [])

  return currentTime
}
