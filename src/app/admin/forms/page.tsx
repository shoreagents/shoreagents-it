"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card } from "@/components/ui/card"

export default function FormsPage() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <AppHeader />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Forms</h1>
              <p className="text-muted-foreground">Manage application forms and templates</p>
            </div>
            
            <Card className="p-6">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-xl font-semibold mb-2">Forms Management</h2>
                <p className="text-muted-foreground">
                  This section will contain form management functionality.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Coming soon...
                </p>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
