"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"

interface Ticket {
  id: number
  status: string
  created_at: string
  resolved_at: string | null
  resolved_by: number | null
}

interface TicketStats {
  daily: {
    current: number
    previous: number
    change: number
  }
  weekly: {
    current: number
    previous: number
    change: number
  }
  monthly: {
    current: number
    previous: number
    change: number
  }
}

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tickets
        const ticketsResponse = await fetch('/api/tickets')
        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json()
          setTickets(ticketsData)
        }

        // Fetch stats if user is available
        if (user?.id) {
          const statsResponse = await fetch(`/api/tickets/stats?userId=${user.id}`)
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            setStats(statsData)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])
  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Overview of your IT support system and metrics.</p>
                  </div>
                </div>
              </div>
              {loading ? (
                <DashboardSkeleton />
              ) : (
                <SectionCards tickets={tickets} currentUserId={user?.id} stats={stats} />
              )}
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}
