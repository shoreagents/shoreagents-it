"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useRef } from "react"
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  CameraIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  TicketIcon,
  UserCheckIcon,
} from "lucide-react"
import { ScanTextIcon } from "@/components/icons/scan-text-icon"
import { HistoryIcon } from "@/components/ui/history"
import { Badge } from "@/components/ui/badge"


import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
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
  navITRequest: [
    {
      title: "Tickets",
      url: "/tickets",
      icon: ScanTextIcon,
    },
    {
      title: "Records",
      url: "/past-tickets",
      icon: HistoryIcon,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: CameraIcon,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: FileTextIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: FileCodeIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: SettingsIcon,
    },
  ],
  documents: [],
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
          <SidebarGroup className="group-data-[collapsible=icon]:p-0">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden font-bold">DASHBOARD</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip="Dashboard"
                  className={`${pathname === "/" ? "bg-gray-200 dark:bg-teal-600/30 focus:bg-gray-200 dark:focus:bg-teal-600/30 active:bg-gray-200 dark:active:bg-teal-600/30 text-sidebar-accent-foreground dark:text-white hover:!bg-gray-200 dark:hover:!bg-teal-600/30" : "text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"} group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:hover:bg-sidebar-accent dark:group-data-[collapsible=icon]:hover:bg-sidebar-accent group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center`}
                >
                  <a href="/">
                    <LayoutDashboardIcon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          
          <SidebarGroup className="group-data-[collapsible=icon]:p-0">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden font-bold">SUPPORT</SidebarGroupLabel>
          <SidebarMenu>
            {data.navITRequest.map((item) => {
              const isActive = pathname === item.url || pathname === item.url + "/"
              const iconRef = useRef<any>(null)
              
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    className={`${isActive ? "bg-gray-200 dark:bg-teal-600/30 focus:bg-gray-200 dark:focus:bg-teal-600/30 active:bg-gray-200 dark:active:bg-teal-600/30 text-sidebar-accent-foreground dark:text-white hover:!bg-gray-200 dark:hover:!bg-teal-600/30" : "text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"} group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:hover:bg-sidebar-accent dark:group-data-[collapsible=icon]:hover:bg-sidebar-accent group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center`}
                    onMouseEnter={() => iconRef.current?.startAnimation?.()}
                    onMouseLeave={() => iconRef.current?.stopAnimation?.()}
                  >
                    <a href={item.url}>
                      {item.icon && <item.icon ref={iconRef} className="h-5 w-5" />}
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
        
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  )
}
