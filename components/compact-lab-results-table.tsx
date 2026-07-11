'use client'

import { Badge } from '@/components/ui/badge-redesigned'
import { isResultAbnormal, getResultSeverity, formatLabResult } from '@/app/dashboard/doctor/utils/lab-result-parser'

interface LabResult {
  id: string
  testName: string
  testType: string
  result: string
  normalRange?: string
  status: 'completed' | 'pending'
  testDate: string
}

interface CompactLabResultsTableProps {
  results: LabResult[]
  onAddResult?: () => void
}

export function CompactLabResultsTable({ results, onAddResult }: CompactLabResultsTableProps) {

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">نتائج المختبرات</h3>
        {onAddResult && (
          <button
            onClick={onAddResult}
            className="px-3 py-1.5 text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
          >
            + إضافة نتيجة
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          لا توجد نتائج مختبرات
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right py-2 px-3 font-medium text-gray-700">الفحص</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">النوع</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">النتيجة</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">النطاق الطبيعي</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => {
                const severity = getResultSeverity(result.result, result.normalRange)
                const { value, isAbnormal } = formatLabResult(result.result, result.normalRange)
                
                const severityColors = {
                  critical: 'text-red-600 bg-red-50',
                  warning: 'text-orange-600 bg-orange-50',
                  normal: 'text-gray-900',
                }

                return (
                  <tr key={result.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{result.testName}</td>
                    <td className="py-2 px-3 text-gray-600">{result.testType}</td>
                    <td className={`py-2 px-3 font-medium px-4 py-2 rounded ${severityColors[severity]}`}>
                      {value}
                      {isAbnormal && ' ⚠️'}
                    </td>
                    <td className="py-2 px-3 text-gray-600">{result.normalRange || '-'}</td>
                    <td className="py-2 px-3">
                      <Badge
                        variant={result.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {result.status === 'completed' ? 'مكتمل' : 'قيد المراجعة'}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
