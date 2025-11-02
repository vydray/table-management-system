import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface Bills {
  tenThousand: number
  fiveThousand: number
  twoThousand: number
  thousand: number
}

export interface Coins {
  fiveHundred: number
  hundred: number
  fifty: number
  ten: number
  five: number
  one: number
}

export const useCashCount = (businessDate: string, isOpen: boolean) => {
  const [bills, setBills] = useState<Bills>({
    tenThousand: 0,
    fiveThousand: 0,
    twoThousand: 0,
    thousand: 0
  })

  const [coins, setCoins] = useState<Coins>({
    fiveHundred: 0,
    hundred: 0,
    fifty: 0,
    ten: 0,
    five: 0,
    one: 0
  })

  const [isSaving, setIsSaving] = useState(false)

  // 保存された現金計算データを読み込む
  const loadCashCount = async () => {
    try {
      const storeId = getCurrentStoreId()
      const { data } = await supabase
        .from('cash_counts')
        .select('*')
        .eq('store_id', storeId)
        .eq('business_date', businessDate)
        .single()

      if (data) {
        setBills({
          tenThousand: data.bill_10000,
          fiveThousand: data.bill_5000,
          twoThousand: data.bill_2000,
          thousand: data.bill_1000
        })
        setCoins({
          fiveHundred: data.coin_500,
          hundred: data.coin_100,
          fifty: data.coin_50,
          ten: data.coin_10,
          five: data.coin_5,
          one: data.coin_1
        })
      }
    } catch (error) {
      console.error('Error loading cash count:', error)
    }
  }

  // モーダルが開いた時にデータを読み込む
  useEffect(() => {
    if (isOpen && businessDate) {
      loadCashCount()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, businessDate])

  // 計算結果
  const calculateTotal = () => {
    const billTotal =
      bills.tenThousand * 10000 +
      bills.fiveThousand * 5000 +
      bills.twoThousand * 2000 +
      bills.thousand * 1000

    const coinTotal =
      coins.fiveHundred * 500 +
      coins.hundred * 100 +
      coins.fifty * 50 +
      coins.ten * 10 +
      coins.five * 5 +
      coins.one * 1

    return billTotal + coinTotal
  }

  // リセット
  const resetCount = () => {
    setBills({
      tenThousand: 0,
      fiveThousand: 0,
      twoThousand: 0,
      thousand: 0
    })
    setCoins({
      fiveHundred: 0,
      hundred: 0,
      fifty: 0,
      ten: 0,
      five: 0,
      one: 0
    })
  }

  // 保存処理
  const saveCashCount = async (registerAmount: number): Promise<number | null> => {
    setIsSaving(true)
    try {
      const storeId = getCurrentStoreId()
      const totalAmount = calculateTotal()
      const cashCollection = totalAmount - registerAmount

      const { error } = await supabase
        .from('cash_counts')
        .upsert({
          store_id: storeId,
          business_date: businessDate,
          bill_10000: bills.tenThousand,
          bill_5000: bills.fiveThousand,
          bill_2000: bills.twoThousand,
          bill_1000: bills.thousand,
          coin_500: coins.fiveHundred,
          coin_100: coins.hundred,
          coin_50: coins.fifty,
          coin_10: coins.ten,
          coin_5: coins.five,
          coin_1: coins.one,
          total_amount: totalAmount,
          register_amount: registerAmount,
          cash_collection: cashCollection
        }, {
          onConflict: 'store_id,business_date'
        })

      if (error) throw error
      return cashCollection
    } catch (error) {
      console.error('Error saving cash count:', error)
      alert('保存に失敗しました')
      return null
    } finally {
      setIsSaving(false)
    }
  }

  return {
    bills,
    setBills,
    coins,
    setCoins,
    isSaving,
    calculateTotal,
    resetCount,
    saveCashCount
  }
}
