import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentStoreId } from '../utils/storeContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ReceiptSettings {
  store_name: string
  logo_url: string
  footer_message: string
  invoice_enabled: boolean
  invoice_number: string
  show_tax_breakdown: boolean
  current_receipt_number: number
  store_postal_code: string
  store_address: string
  store_phone: string
  store_email: string
  business_hours: string
  closed_days: string
  store_registration_number: string
  show_revenue_stamp: boolean
  revenue_stamp_threshold: number
  receipt_templates: Array<{
    name: string
    text: string
    is_default: boolean
  }>
}

export const useReceiptSettingsData = () => {
  const [settings, setSettings] = useState<ReceiptSettings>({
    store_name: '',
    logo_url: '',
    footer_message: 'またのご来店をお待ちしております',
    invoice_enabled: false,
    invoice_number: '',
    show_tax_breakdown: false,
    current_receipt_number: 1,
    store_postal_code: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    business_hours: '',
    closed_days: '',
    store_registration_number: '',
    show_revenue_stamp: true,
    revenue_stamp_threshold: 50000,
    receipt_templates: [
      { name: 'お品代', text: 'お品代として', is_default: true },
      { name: '飲食代', text: '飲食代として', is_default: false },
      { name: 'サービス料', text: 'サービス料として', is_default: false }
    ]
  })

  const [isLoading, setIsLoading] = useState(false)

  const loadSettings = async () => {
    try {
      const storeId = getCurrentStoreId()

      const { data: receiptSettings } = await supabase
        .from('receipt_settings')
        .select('*')
        .eq('store_id', storeId)
        .single()

      if (receiptSettings) {
        setSettings({
          store_name: receiptSettings.store_name || '',
          logo_url: receiptSettings.logo_url || '',
          footer_message: receiptSettings.footer_message || 'またのご来店をお待ちしております',
          invoice_enabled: receiptSettings.invoice_enabled || false,
          invoice_number: receiptSettings.invoice_number || '',
          show_tax_breakdown: receiptSettings.show_tax_breakdown || false,
          current_receipt_number: receiptSettings.current_receipt_number || 1,
          store_postal_code: receiptSettings.store_postal_code || '',
          store_address: receiptSettings.store_address || '',
          store_phone: receiptSettings.store_phone || '',
          store_email: receiptSettings.store_email || '',
          business_hours: receiptSettings.business_hours || '',
          closed_days: receiptSettings.closed_days || '',
          store_registration_number: receiptSettings.store_registration_number || '',
          show_revenue_stamp: receiptSettings.show_revenue_stamp ?? true,
          revenue_stamp_threshold: receiptSettings.revenue_stamp_threshold || 50000,
          receipt_templates: receiptSettings.receipt_templates || [
            { name: 'お品代', text: 'お品代として', is_default: true },
            { name: '飲食代', text: '飲食代として', is_default: false },
            { name: 'サービス料', text: 'サービス料として', is_default: false }
          ]
        })

        return receiptSettings.logo_url
      }
      return null
    } catch (error) {
      console.error('Error loading settings:', error)
      return null
    }
  }

  const saveSettings = async (logoUrl?: string) => {
    setIsLoading(true)
    try {
      const storeId = getCurrentStoreId()

      const { error } = await supabase
        .from('receipt_settings')
        .upsert({
          store_id: storeId,
          store_name: settings.store_name,
          logo_url: logoUrl || settings.logo_url,
          footer_message: settings.footer_message,
          invoice_enabled: settings.invoice_enabled,
          invoice_number: settings.invoice_number,
          show_tax_breakdown: settings.show_tax_breakdown,
          current_receipt_number: settings.current_receipt_number,
          store_postal_code: settings.store_postal_code,
          store_address: settings.store_address,
          store_phone: settings.store_phone,
          store_email: settings.store_email,
          business_hours: settings.business_hours,
          closed_days: settings.closed_days,
          store_registration_number: settings.store_registration_number,
          show_revenue_stamp: settings.show_revenue_stamp,
          revenue_stamp_threshold: settings.revenue_stamp_threshold,
          receipt_templates: settings.receipt_templates,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      await loadSettings()
      return true
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('設定の保存に失敗しました')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    settings,
    setSettings,
    isLoading,
    loadSettings,
    saveSettings
  }
}
