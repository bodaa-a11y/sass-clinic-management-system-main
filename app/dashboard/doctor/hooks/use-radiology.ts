import { useState, useCallback } from 'react'
import { useDoctorStore } from '../stores/doctor-store'
import { toast } from 'sonner'

interface RadiologyImage {
  id: string
  imageUrl: string
  title: string
  type: string
  studyDate: string
  description?: string
}

export const useRadiology = () => {
  const { clinicId } = useDoctorStore()
  const [images, setImages] = useState<RadiologyImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<RadiologyImage | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const fetchRadiologyImages = useCallback(async (patientId: string) => {
    if (!clinicId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/clinics/${clinicId}/patients/${patientId}/radiology-images`)
      const data = await response.json()
      setImages(data)
    } catch (error) {
      console.error('Failed to fetch radiology images:', error)
      toast.error('فشل جلب صور الأشعة')
    } finally {
      setIsLoading(false)
    }
  }, [clinicId])

  const handleImageClick = (image: RadiologyImage) => {
    setSelectedImage(image)
    setIsLightboxOpen(true)
  }

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false)
    setSelectedImage(null)
  }

  const uploadRadiologyImage = async (
    patientId: string,
    file: File,
    metadata: { title: string; type: string; description?: string }
  ) => {
    if (!clinicId) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', metadata.title)
      formData.append('type', metadata.type)
      if (metadata.description) {
        formData.append('description', metadata.description)
      }

      const response = await fetch(
        `/api/clinics/${clinicId}/patients/${patientId}/radiology-images/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      await fetchRadiologyImages(patientId) // Refresh list
      return data
    } catch (error) {
      console.error('Failed to upload image:', error)
      toast.error('فشل رفع الصورة')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    images,
    isLoading,
    selectedImage,
    isLightboxOpen,
    fetchRadiologyImages,
    handleImageClick,
    handleCloseLightbox,
    uploadRadiologyImage,
  }
}
