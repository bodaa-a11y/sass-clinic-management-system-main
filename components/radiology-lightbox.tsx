'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react'

interface RadiologyImage {
  id: string
  url: string
  title: string
  date: string
}

interface RadiologyLightboxProps {
  images: RadiologyImage[]
  initialIndex?: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RadiologyLightbox({ images, initialIndex = 0, open, onOpenChange }: RadiologyLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleDownload = () => {
    const image = images[currentIndex]
    const link = document.createElement('a')
    link.href = image.url
    link.download = image.title
    link.click()
  }

  const currentImage = images[currentIndex]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-white border-b">
            <h3 className="font-semibold text-lg">{currentImage?.title}</h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                <ZoomOut className="w-5 h-5" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 3}>
                <ZoomIn className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDownload}>
                <Download className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Image Container */}
          <div className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center p-4">
            <div
              className="relative transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            >
              {currentImage && (
                <img
                  src={currentImage.url}
                  alt={currentImage.title}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 bg-white border-t">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={images.length <= 1}
            >
              ← السابق
            </Button>
            <span className="text-sm text-gray-600">
              {currentIndex + 1} / {images.length}
            </span>
            <Button
              variant="ghost"
              onClick={handleNext}
              disabled={images.length <= 1}
            >
              التالي →
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
