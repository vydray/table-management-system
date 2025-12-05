import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentStoreId } from '../utils/storeContext'

export interface ReceiptSettings {
  store_name: string
  logo_url: string
  footer_message: string
  store_postal_code: string
  store_address: string
  store_phone: string
  store_email: string
  business_hours: string
  closed_days: string
  store_registration_number: string
  revenue_stamp_threshold: number
  invoice_enabled: boolean
  invoice_number: string
  show_tax_breakdown: boolean
  current_receipt_number: number
  show_revenue_stamp: boolean
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
    store_postal_code: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    business_hours: '',
    closed_days: '',
    store_registration_number: '',
    revenue_stamp_threshold: 50000,
    invoice_enabled: false,
    invoice_number: '',
    show_tax_breakdown: false,
    current_receipt_number: 1,
    show_revenue_stamp: true,
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

      const { data: storeSettings } = await supabase
        .from('receipt_settings')
        .select('*')
        .eq('store_id', storeId)
        .single()

      if (storeSettings) {
        setSettings({
          store_name: storeSettings.store_name || '',
          logo_url: storeSettings.logo_url || '',
          footer_message: storeSettings.footer_message || 'またのご来店をお待ちしております',
          store_postal_code: storeSettings.store_postal_code || '',
          store_address: storeSettings.store_address || '',
          store_phone: storeSettings.store_phone || '',
          store_email: storeSettings.store_email || '',
          business_hours: storeSettings.business_hours || '',
          closed_days: storeSettings.closed_days || '',
          store_registration_number: storeSettings.store_registration_number || '',
          revenue_stamp_threshold: storeSettings.revenue_stamp_threshold ?? 50000,
          invoice_enabled: storeSettings.invoice_enabled || false,
          invoice_number: storeSettings.invoice_number || '',
          show_tax_breakdown: storeSettings.show_tax_breakdown || false,
          current_receipt_number: storeSettings.current_receipt_number || 1,
          show_revenue_stamp: storeSettings.show_revenue_stamp ?? true,
          receipt_templates: storeSettings.receipt_templates || [
            { name: 'お品代', text: 'お品代として', is_default: true },
            { name: '飲食代', text: '飲食代として', is_default: false },
            { name: 'サービス料', text: 'サービス料として', is_default: false }
          ]
        })

        return storeSettings.logo_url
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
          store_postal_code: settings.store_postal_code,
          store_address: settings.store_address,
          store_phone: settings.store_phone,
          store_email: settings.store_email,
          business_hours: settings.business_hours,
          closed_days: settings.closed_days,
          store_registration_number: settings.store_registration_number,
          revenue_stamp_threshold: settings.revenue_stamp_threshold,
          invoice_enabled: settings.invoice_enabled,
          invoice_number: settings.invoice_number,
          show_tax_breakdown: settings.show_tax_breakdown,
          current_receipt_number: settings.current_receipt_number,
          show_revenue_stamp: settings.show_revenue_stamp,
          receipt_templates: settings.receipt_templates,
          updated_at: new Date().toISOString()
        }, { onConflict: 'store_id' })

      if (error) {
        console.error('Supabase upsert error:', error)
        throw error
      }

      await loadSettings()
      alert('設定を保存しました')
      return true
    } catch (error: any) {
      console.error('Error saving settings:', error)
      const errorMessage = error?.message || error?.toString() || '不明なエラー'
      alert(`設定の保存に失敗しました\n${errorMessage}`)
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
