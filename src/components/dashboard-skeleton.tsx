import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardSkeleton() {
  return (
    <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      {/* Active Tickets Card */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>
            <Skeleton className="h-4 w-20" />
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-8 w-12" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium mb-2">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex flex-wrap gap-1">
            <Skeleton className="h-6 w-16 rounded-xl" />
            <Skeleton className="h-6 w-20 rounded-xl" />
            <Skeleton className="h-6 w-14 rounded-xl" />
          </div>
        </CardFooter>
      </Card>

      {/* Closed Tickets Card */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>
            <Skeleton className="h-4 w-24" />
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-8 w-12" />
            </div>
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="text-muted-foreground">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-1 bg-sidebar/20 rounded-lg p-1">
              <Skeleton className="h-6 w-12 rounded-lg" />
              <Skeleton className="h-6 w-16 rounded-lg" />
              <Skeleton className="h-6 w-16 rounded-lg" />
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Active Accounts Card */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>
            <Skeleton className="h-4 w-24" />
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            <Skeleton className="h-8 w-20" />
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="text-muted-foreground">
            <Skeleton className="h-4 w-28" />
          </div>
        </CardFooter>
      </Card>

      {/* Growth Rate Card */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>
            <Skeleton className="h-4 w-20" />
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            <Skeleton className="h-8 w-12" />
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="text-muted-foreground">
            <Skeleton className="h-4 w-32" />
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 