import { ReceiptSettings } from './useReceiptSettingsData'

export const useReceiptTemplate = (
  settings: ReceiptSettings,
  setSettings: (settings: ReceiptSettings) => void
) => {
  // 但し書きテンプレートの追加
  const addTemplate = () => {
    setSettings({
      ...settings,
      receipt_templates: [
        ...settings.receipt_templates,
        { name: '', text: '', is_default: false }
      ]
    })
  }

  // 但し書きテンプレートの削除
  const removeTemplate = (index: number) => {
    const newTemplates = settings.receipt_templates.filter((_, i) => i !== index)
    setSettings({ ...settings, receipt_templates: newTemplates })
  }

  // 但し書きテンプレートの更新
  const updateTemplate = (index: number, field: 'name' | 'text' | 'is_default', value: string | boolean) => {
    const newTemplates = [...settings.receipt_templates]
    if (field === 'is_default' && value === true) {
      // 他のデフォルトを解除
      newTemplates.forEach((t, i) => {
        if (i !== index) t.is_default = false
      })
    }
    newTemplates[index] = { ...newTemplates[index], [field]: value }
    setSettings({ ...settings, receipt_templates: newTemplates })
  }

  return {
    addTemplate,
    removeTemplate,
    updateTemplate
  }
}
