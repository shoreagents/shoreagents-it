"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

interface ChartData {
  date: string
  [key: string]: string | number
}

interface ResolverStats {
  chartData: ChartData[]
  chartConfig: ChartConfig
  resolvers: string[]
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [chartData, setChartData] = React.useState<ChartData[]>([])
  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({})
  const [resolvers, setResolvers] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)

  // Fetch resolver data
  React.useEffect(() => {
    const fetchResolverData = async () => {
      try {
        setLoading(true)
        let days = 30
        if (timeRange === "7d") {
          days = 7
        } else if (timeRange === "14d") {
          days = 14
        }
        const response = await fetch(`/api/tickets/stats/resolvers?days=${days}`)
        
        if (response.ok) {
          const data: ResolverStats = await response.json()
          setChartData(data.chartData)
          setChartConfig(data.chartConfig)
          setResolvers(data.resolvers)
        } else {
          console.error('Failed to fetch resolver data:', response.status)
        }
      } catch (error) {
        console.error('Error fetching resolver data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResolverData()
  }, [timeRange])

  // Generate gradient definitions dynamically
  const generateGradients = () => {
    return resolvers.map((resolver, index) => {
      const color = chartConfig[resolver]?.color || '#f97316'
      return (
        <linearGradient key={resolver} id={`fill${resolver.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="5%"
            stopColor={color}
            stopOpacity={0.8}
          />
          <stop
            offset="95%"
            stopColor={color}
            stopOpacity={0.1}
          />
        </linearGradient>
      )
    })
  }

  // Generate Area components dynamically
  const generateAreas = () => {
    return resolvers.map((resolver) => {
      const color = chartConfig[resolver]?.color || '#f97316'
      return (
        <Area
          key={resolver}
          dataKey={resolver}
          type="natural"
          fill={`url(#fill${resolver.replace(/\s+/g, '')})`}
          stroke={color}
          stackId="a"
        />
      )
    })
  }

  if (loading) {
    return (
      <div className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Tickets Overview</CardDescription>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Loading resolver data...
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[200px] w-full flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </div>
    )
  }

  return (
    <div className="@container/card">
      <CardHeader className="relative">
        <CardDescription>Team Performance</CardDescription>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Individual resolver metrics and trends
        </CardTitle>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              Last 30 Days
            </ToggleGroupItem>
            <ToggleGroupItem value="14d" className="h-8 px-2.5">
              Last 14 Days
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              Last 7 Days
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="@[767px]/card:hidden flex w-40"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 30 Days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="30d" className="rounded-lg">
                Last 30 Days
              </SelectItem>
              <SelectItem value="14d" className="rounded-lg">
                Last 14 Days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 Days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer
          config={chartConfig}
          className="h-[200px] w-full max-w-none overflow-visible"
        >
          <AreaChart data={chartData} width={800} height={250} margin={{ right: 0, left: 0 }}>
            <defs>
              {generateGradients()}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return (
                      <div className="text-center">
                        <div className="font-medium">
                          {date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </div>
                        <div className="h-px bg-border my-2"></div>
                      </div>
                    )
                  }}
                  indicator="dot"
                  className="min-w-[200px] max-w-[300px]"
                />
              }
            />
            {generateAreas()}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </div>
  )
}
