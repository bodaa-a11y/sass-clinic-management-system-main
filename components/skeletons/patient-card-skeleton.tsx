import { Skeleton } from '@/components/ui/skeleton'

export function PatientCardSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-300 rounded-lg gap-3">
      <div className="flex-1 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-full sm:w-auto">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-4 w-20 mt-2" />
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  )
}
