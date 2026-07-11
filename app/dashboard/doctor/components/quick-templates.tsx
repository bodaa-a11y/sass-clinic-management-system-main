'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge-redesigned'
import { FileText, Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input-redesigned'

interface Template {
  id: string
  name: string
  category: 'exam' | 'prescription' | 'notes'
  content: string
  usageCount: number
}

interface QuickTemplatesProps {
  templates: Template[]
  onSelectTemplate: (template: Template) => void
  onCreateTemplate?: () => void
}

export function QuickTemplates({ templates, onSelectTemplate, onCreateTemplate }: QuickTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = [
    { value: 'all', label: 'الكل' },
    { value: 'exam', label: 'فحوصات' },
    { value: 'prescription', label: 'وصفات' },
    { value: 'notes', label: 'ملاحظات' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          القوالب السريعة
        </h3>
        {onCreateTemplate && (
          <Button size="sm" onClick={onCreateTemplate}>
            <Plus className="w-4 h-4 ml-1" />
            إنشاء قالب
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="ابحث في القوالب..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category.value}
            size="sm"
            variant={selectedCategory === category.value ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category.value)}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-gray-500">
            لا توجد قوالب مطابقة
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectTemplate(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {template.usageCount} استخدام
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 truncate">{template.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
