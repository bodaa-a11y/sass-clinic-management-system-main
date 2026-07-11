'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button-redesigned'
import { ZoomIn, ZoomOut, RotateCw, X } from 'lucide-react'

interface RadiologyLightboxProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  imageTitle?: string
  imageDate?: string
  imageType?: string
}

export function RadiologyLightbox({
  open,
  onOpenChange,
  imageUrl,
  imageTitle,
  imageDate,
  imageType,
}: RadiologyLightboxProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
  }

  const handleClose = () => {
    handleReset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0 overflow-hidden bg-black/95 backdrop-blur-sm">
        <DialogHeader className="sr-only">
          <DialogTitle>معاينة صورة الأشعة</DialogTitle>
        </DialogHeader>
        {/* Image Container */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <img
            src={imageUrl}
            alt={imageTitle || 'صورة أشعة'}
            className="max-w-full max-h-full object-contain transition-transform duration-300"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          />

          {/* Controls Overlay */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="text-white hover:bg-white/20"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            <span className="text-white text-sm font-medium w-16 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="text-white hover:bg-white/20"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            <div className="w-px h-6 bg-white/30 mx-2" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="text-white hover:bg-white/20"
            >
              <RotateCw className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="text-white hover:bg-white/20 text-xs"
            >
              إعادة
            </Button>
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white hover:bg-black/80 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Image Info */}
          {(imageTitle || imageDate || imageType) && (
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-lg px-4 py-2 text-white">
              {imageTitle && <div className="font-medium">{imageTitle}</div>}
              {imageType && <div className="text-sm text-gray-300">{imageType}</div>}
              {imageDate && <div className="text-sm text-gray-300">{imageDate}</div>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
