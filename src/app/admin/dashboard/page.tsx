"use client"

import * as React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Overview of administrative metrics and team performance.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6">
                <Card className="@container/card h-full">
                  <CardContent className="p-0">
                    <ChartAreaInteractive />
                  </CardContent>
                  <CardHeader className="pt-0">
                    <CardTitle>Team Performance</CardTitle>
                    <CardDescription>Resolver trends and daily throughput</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}
