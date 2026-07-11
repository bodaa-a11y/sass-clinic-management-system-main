'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, User, Calendar, FileText, DollarSign } from 'lucide-react'

interface SearchResult {
  id: string
  type: 'patient' | 'appointment' | 'invoice'
  title: string
  subtitle: string
  url: string
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (search.length < 2) {
      setResults([])
      return
    }

    const debounceTimer = setTimeout(() => {
      performSearch(search)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [search])

  const performSearch = async (query: string) => {
    setIsLoading(true)
    try {
      // In a real app, you would call an API here
      // For now, we'll simulate search results
      const mockResults: SearchResult[] = []
      
      // Simulate patient search
      if (query.includes('patient') || query.includes('مريض')) {
        mockResults.push({
          id: '1',
          type: 'patient',
          title: 'أحمد محمد',
          subtitle: '0501234567',
          url: '/dashboard/patients/1'
        })
      }

      // Simulate appointment search
      if (query.includes('appointment') || query.includes('موعد')) {
        mockResults.push({
          id: '2',
          type: 'appointment',
          title: 'موعد مع الدكتور علي',
          subtitle: 'اليوم، 10:00 ص',
          url: '/dashboard/appointments'
        })
      }

      // Simulate invoice search
      if (query.includes('invoice') || query.includes('فاتورة')) {
        mockResults.push({
          id: '3',
          type: 'invoice',
          title: 'فاتورة #INV-001',
          subtitle: '500 ر.س - مدفوعة',
          url: '/dashboard/billing'
        })
      }

      setResults(mockResults)
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (result: SearchResult) => {
    setOpen(false)
    setSearch('')
    setResults([])
    router.push(result.url)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'patient':
        return <User className="w-4 h-4" />
      case 'appointment':
        return <Calendar className="w-4 h-4" />
      case 'invoice':
        return <FileText className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'patient':
        return 'مريض'
      case 'appointment':
        return 'موعد'
      case 'invoice':
        return 'فاتورة'
      default:
        return ''
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-right">بحث...</span>
        <kbd className="px-2 py-0.5 text-xs text-gray-500 bg-gray-200 rounded">
          Ctrl K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-2xl" dir="rtl">
          <div className="flex flex-col">
            <div className="flex items-center border-b px-4 py-3">
              <Search className="w-4 h-4 mr-2 text-gray-500" />
              <Input
                placeholder="ابحث عن مريض، موعد، أو فاتورة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-11 w-full border-0 bg-transparent text-sm outline-none placeholder:text-gray-500"
                autoFocus
              />
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  جاري البحث...
                </div>
              ) : results.length > 0 ? (
                <div className="p-2">
                  <div className="text-xs text-gray-500 px-2 py-2 mb-1">النتائج</div>
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className="flex items-center gap-3 w-full px-4 py-3 cursor-pointer hover:bg-gray-100 rounded-md transition-colors text-right"
                    >
                      {getIcon(result.type)}
                      <div className="flex-1">
                        <div className="font-medium">{result.title}</div>
                        <div className="text-sm text-gray-500">{result.subtitle}</div>
                      </div>
                      <span className="text-xs text-gray-400">{getTypeLabel(result.type)}</span>
                    </button>
                  ))}
                </div>
              ) : search.length >= 2 ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  لم يتم العثور على نتائج
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-gray-500">
                  ابدأ الكتابة للبحث
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
