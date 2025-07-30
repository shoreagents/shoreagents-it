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
  HistoryIcon,
} from "lucide-react"
import { LaptopMinimalCheckIcon } from "@/components/icons/laptop-minimal-check-icon"
import { GripIcon } from "@/components/icons/grip-icon"
import { ScanTextIcon } from "@/components/icons/scan-text-icon"

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
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: GripIcon,
    },
  ],
  navITRequest: [
    {
      title: "Tickets",
      url: "/tickets",
      icon: ScanTextIcon,
    },
    {
      title: "Onboarding & Offboarding",
      url: "/onboarding",
      icon: LaptopMinimalCheckIcon,
    },
  ],
  navRecords: [
    {
      title: "Past Tickets",
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
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold group-data-[collapsible=icon]:hidden">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        
        <SidebarGroup>
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
                    className={isActive ? "bg-gray-200 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-200 focus:bg-gray-200 dark:focus:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-800 text-sidebar-accent-foreground" : "text-sidebar-accent-foreground hover:text-sidebar-accent-foreground"}
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
        
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden font-bold">RECORDS</SidebarGroupLabel>
          <SidebarMenu>
            {data.navRecords.map((item) => {
              const isActive = pathname === item.url || pathname === item.url + "/"
              const iconRef = useRef<any>(null)
              
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    className={isActive ? "bg-gray-200 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-200 focus:bg-gray-200 dark:focus:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-800 text-sidebar-accent-foreground" : "text-sidebar-accent-foreground hover:text-sidebar-accent-foreground"}
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
