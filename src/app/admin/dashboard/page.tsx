"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from "recharts"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardDescription,
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
  Users, 
  Ticket, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Calendar,
  MessageSquare
} from "lucide-react"

// Static data for the dashboard
const staticChartData = [
  { date: "2024-01-01", tickets: 45, resolved: 42, pending: 3 },
  { date: "2024-01-02", tickets: 52, resolved: 48, pending: 4 },
  { date: "2024-01-03", tickets: 38, resolved: 35, pending: 3 },
  { date: "2024-01-04", tickets: 61, resolved: 58, pending: 3 },
  { date: "2024-01-05", tickets: 47, resolved: 44, pending: 3 },
  { date: "2024-01-06", tickets: 39, resolved: 36, pending: 3 },
  { date: "2024-01-07", tickets: 55, resolved: 52, pending: 3 },
]

const teamPerformanceData = [
  { name: "John Smith", tickets: 24, resolved: 22, efficiency: 92 },
  { name: "Sarah Johnson", tickets: 18, resolved: 17, efficiency: 94 },
  { name: "Mike Wilson", tickets: 31, resolved: 29, efficiency: 94 },
  { name: "Emily Davis", tickets: 22, resolved: 20, efficiency: 91 },
  { name: "David Brown", tickets: 27, resolved: 25, efficiency: 93 },
]

const departmentData = [
  { name: "IT Support", value: 35, color: "#8884d8" },
  { name: "HR", value: 20, color: "#82ca9d" },
  { name: "Finance", value: 15, color: "#ffc658" },
  { name: "Operations", value: 30, color: "#ff7c7c" },
]

const monthlyTrends = [
  { month: "Jan", tickets: 1200, resolved: 1150 },
  { month: "Feb", tickets: 1350, resolved: 1280 },
  { month: "Mar", tickets: 1100, resolved: 1050 },
  { month: "Apr", tickets: 1450, resolved: 1380 },
  { month: "May", tickets: 1300, resolved: 1250 },
  { month: "Jun", tickets: 1400, resolved: 1320 },
]

const chartConfig = {
  tickets: {
    label: "Total Tickets",
    color: "hsl(var(--chart-1))",
  },
  resolved: {
    label: "Resolved",
    color: "hsl(var(--chart-2))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-3))",
  },
}

export default function AdminDashboard() {
  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Comprehensive overview of system metrics and team performance</p>
                  </div>
                </div>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,247</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">+12%</span> from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,189</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">+8%</span> resolution rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-blue-600">5</span> currently online
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2.4h</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">-15%</span> improvement
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 lg:px-6">
                {/* Ticket Trends Chart */}
                <Card className="@container/card">
                  <CardHeader>
                    <CardTitle>Ticket Trends</CardTitle>
                    <CardDescription>Daily ticket volume and resolution rates</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <AreaChart data={staticChartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                        <defs>
                          <linearGradient id="fillTickets" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-tickets)" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="var(--color-tickets)" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="fillResolved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-resolved)" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="var(--color-resolved)" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent />}
                        />
                        <Area
                          dataKey="tickets"
                          type="natural"
                          fill="url(#fillTickets)"
                          stroke="var(--color-tickets)"
                          stackId="a"
                        />
                        <Area
                          dataKey="resolved"
                          type="natural"
                          fill="url(#fillResolved)"
                          stroke="var(--color-resolved)"
                          stackId="a"
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Team Performance Chart */}
                <Card className="@container/card">
                  <CardHeader>
                    <CardTitle>Team Performance</CardTitle>
                    <CardDescription>Individual agent ticket resolution metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <BarChart data={teamPerformanceData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(value) => value.split(' ')[0]}
                        />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent />}
                        />
                        <Bar dataKey="tickets" fill="var(--color-tickets)" radius={4} />
                        <Bar dataKey="resolved" fill="var(--color-resolved)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 lg:px-6">
                {/* Department Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Department Distribution</CardTitle>
                    <CardDescription>Tickets by department</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                      <PieChart>
                        <Pie
                          data={departmentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {departmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Monthly Trends */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Monthly Trends</CardTitle>
                    <CardDescription>6-month ticket volume comparison</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                      <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis 
                          dataKey="month" 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent />}
                        />
                        <Line 
                          dataKey="tickets" 
                          stroke="var(--color-tickets)" 
                          strokeWidth={2}
                          dot={{ fill: "var(--color-tickets)", strokeWidth: 2, r: 4 }}
                        />
                        <Line 
                          dataKey="resolved" 
                          stroke="var(--color-resolved)" 
                          strokeWidth={2}
                          dot={{ fill: "var(--color-resolved)", strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 lg:px-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Tickets</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">58</div>
                    <p className="text-xs text-muted-foreground">
                      Requires immediate attention
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <p className="text-xs text-muted-foreground">
                      Scheduled activities
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Announcements</CardTitle>
                    <MessageSquare className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">7</div>
                    <p className="text-xs text-muted-foreground">
                      Current notifications
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}
