import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentStoreId } from '../utils/storeContext'

export const useLogoUpload = () => {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null

    try {
      const storeId = getCurrentStoreId()
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${storeId}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(`logos/${fileName}`, logoFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(`logos/${fileName}`)

      return publicUrl
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('ロゴのアップロードに失敗しました')
      return null
    }
  }

  return {
    logoFile,
    logoPreview,
    setLogoPreview,
    handleLogoChange,
    uploadLogo
  }
}
