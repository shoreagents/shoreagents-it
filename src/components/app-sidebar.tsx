"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useRef } from "react"
import {
  LayoutDashboardIcon,
  SettingsIcon,
} from "lucide-react"
import { ScanTextIcon } from "@/components/icons/scan-text-icon"
import { HistoryIcon } from "@/components/ui/history"
import { Badge } from "@/components/ui/badge"


import { NavMain } from "@/components/nav/nav-main"
import { NavSecondary } from "@/components/nav/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.svg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/it/dashboard",
      icon: LayoutDashboardIcon,
    },
  ],
  navSupport: [
    {
      title: "Tickets",
      url: "/it/tickets",
      icon: ScanTextIcon,
    },
    {
      title: "Records",
      url: "/it/past-tickets",
      icon: HistoryIcon,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: SettingsIcon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  
  return (
    <Sidebar 
      collapsible="icon" 
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
                        <div className="data-[slot=sidebar-menu-button]:!p-1.5 flex items-center group-data-[collapsible=icon]:justify-center">
              <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                <span className="text-base font-semibold">ShoreAgents</span>
                <Badge className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-800 border-teal-200 shadow-none">IT</Badge>
              </div>
              <div className="hidden group-data-[collapsible=icon]:block">
                <Badge className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-800 border-teal-200 shadow-none">IT</Badge>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
              <SidebarContent className="group-data-[collapsible=icon]:mt-8">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel>MAIN</SidebarGroupLabel>
          <NavMain items={data.navMain} />
        </SidebarGroup>
        <SidebarGroup className="p-0">
          <SidebarGroupLabel>SUPPORT</SidebarGroupLabel>
          <NavMain items={data.navSupport} />
        </SidebarGroup>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  )
}
