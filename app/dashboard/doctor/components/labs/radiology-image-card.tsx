'use client'

import { Card, CardContent } from '@/components/ui/card-redesigned'
import { Badge } from '@/components/ui/badge-redesigned'
import { Image as ImageIcon } from 'lucide-react'

interface RadiologyImage {
  id: string
  imageUrl: string
  title: string
  type: string
  studyDate: string
  description?: string
}

interface RadiologyImageCardProps {
  image: RadiologyImage
  onClick: (image: RadiologyImage) => void
}

export function RadiologyImageCard({ image, onClick }: RadiologyImageCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onClick(image)}
    >
      <CardContent className="p-4">
        <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          <img
            src={image.imageUrl}
            alt={image.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm line-clamp-1">{image.title}</h4>
            <Badge variant="secondary" className="text-xs">
              {image.type}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">{new Date(image.studyDate).toLocaleDateString('ar-SA')}</p>
        </div>
      </CardContent>
    </Card>
  )
}
