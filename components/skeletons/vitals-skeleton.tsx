import { Skeleton } from '@/components/ui/skeleton'

export function VitalsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="p-3 bg-gray-50 rounded space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}
