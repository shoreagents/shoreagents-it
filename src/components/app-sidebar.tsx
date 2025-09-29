"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useRef, useMemo } from "react"
import {
  UserCircleIcon,
  Building2Icon,
  UserPlusIcon,
  StarIcon,
  CalendarIcon,
} from "lucide-react"
import { ScanTextIcon } from "@/components/icons/scan-text-icon"
import { IconFileText } from "@tabler/icons-react"
import { HistoryIcon } from "@/components/ui/history"
import { UserIcon } from "@/components/icons/user-icon"
import { UsersIcon } from "@/components/icons/users-icon"
import { UserCheckIcon } from "@/components/icons/user-check-icon"
import { SettingsGearIcon } from "@/components/icons/settings-gear-icon"
import { FileTextIcon } from "@/components/icons/file-text-icon"
import { GripDashboardIcon } from "@/components/icons/grip-dashboard-icon"
import { IdCardIcon } from "@/components/icons/id-card-icon"
import { FilePenLineIcon } from "@/components/icons/file-pen-line-icon"
import { SparklesIcon } from "@/components/icons/sparkles-icon"
import { HomeIcon } from "@/components/icons/home-icon"
import { ClockIcon, BarChart3Icon, MegaphoneIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { useNewTicketsCount, useNewApplicantsCount, useTodayEventsCount, useActiveAnnouncementsCount } from "@/hooks/use-realtime-count"

import { NavMain } from "@/components/nav/nav-main"
import { NavMainWithSubgroups } from "@/components/nav/nav-main-with-subgroups"
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

export const AppSidebar = React.memo(function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const { newTicketsCount, error: ticketsError, isConnected } = useNewTicketsCount()
  const { newApplicantsCount, error: applicantsError, isConnected: applicantsIsConnected } = useNewApplicantsCount()
  const { todayEventsCount, error: eventsError, isConnected: eventsIsConnected } = useTodayEventsCount()
  const { activeAnnouncementsCount, error: announcementsError, isConnected: announcementsIsConnected } = useActiveAnnouncementsCount()

  const role = (user as any)?.roleName?.toLowerCase() || "it"
  const isAdmin = role === "admin"
  


  const navMain = useMemo(() => isAdmin
    ? [
        {
          title: "Dashboard",
          url: "/admin/dashboard",
          icon: GripDashboardIcon,
        },
      ]
    : [
        {
          title: "Dashboard",
          url: "/it/dashboard",
          icon: GripDashboardIcon,
        },
      ], [isAdmin])

  const navSupport = useMemo(() => isAdmin
    ? [
        {
          title: "Tickets",
          url: "/admin/tickets",
          icon: IdCardIcon,
          badge: newTicketsCount > 0 ? newTicketsCount : undefined,
        },
        {
          title: "Records",
          url: "/admin/past-tickets",
          icon: HistoryIcon,
        },
      ]
    : [
        {
          title: "Tickets",
          url: "/it/tickets",
          icon: IdCardIcon,
          badge: newTicketsCount > 0 ? newTicketsCount : undefined,
        },
        {
          title: "Records",
          url: "/it/past-tickets",
          icon: HistoryIcon,
        },
      ], [isAdmin, newTicketsCount])

  const navSecondary = useMemo(() => [
    {
      title: "Settings",
      url: "#",
      icon: SettingsGearIcon,
    },
  ], [])

  // Loading skeleton to avoid role flicker
  if (loading) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="data-[slot=sidebar-menu-button]:!p-1.5 flex items-center group-data-[collapsible=icon]:justify-center">
                <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                  <span className="text-base font-semibold">ShoreAgents</span>
                  <Badge className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-800 border-teal-200 shadow-none">&nbsp;</Badge>
                </div>
                <div className="hidden group-data-[collapsible=icon]:block">
                  <Badge className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-800 border-teal-200 shadow-none">&nbsp;</Badge>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="group-data-[collapsible=icon]:mt-8">
          <SidebarGroup className="p-0">
            <SidebarGroupLabel>MAIN</SidebarGroupLabel>
            <div className="flex flex-col gap-2 px-2 py-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-4/5 rounded-lg" />
            </div>
          </SidebarGroup>
          <SidebarGroup className="p-0">
            <SidebarGroupLabel>SUPPORT</SidebarGroupLabel>
            <div className="flex flex-col gap-2 px-2 py-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-3/5 rounded-lg" />
            </div>
          </SidebarGroup>
          <SidebarGroup className="p-0">
            <SidebarGroupLabel>TRACKING</SidebarGroupLabel>
            <div className="flex flex-col gap-2 px-2 py-2">
              <Skeleton className="h-8 w-4/5 rounded-lg" />
              <Skeleton className="h-8 w-3/5 rounded-lg" />
            </div>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="data-[slot=sidebar-menu-button]:!p-1.5 flex items-center group-data-[collapsible=icon]:justify-center">
              <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                <span className="text-base font-semibold">ShoreAgents</span>
                <Badge className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-800 border-teal-200 shadow-none">
                  {isAdmin ? "Admin" : "IT"}
                </Badge>
              </div>
              <div className="hidden group-data-[collapsible=icon]:block">
                <Badge className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-800 border-teal-200 shadow-none">
                  {isAdmin ? "Admin" : "IT"}
                </Badge>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="group-data-[collapsible=icon]:mt-8">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel>MAIN</SidebarGroupLabel>
          <NavMain items={navMain} />
        </SidebarGroup>
        {navSupport.length > 0 && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel>SUPPORT</SidebarGroupLabel>
            <NavMain items={navSupport} />
          </SidebarGroup>
        )}
        {isAdmin && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel>EMPLOYEES</SidebarGroupLabel>
            <NavMain
              items={[
                { title: "Internal", url: "/admin/internal", icon: UserIcon },
                { title: "Agents", url: "/admin/agents", icon: UsersIcon },
              ]}
            />
          </SidebarGroup>
        )}
        {isAdmin && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel>MEMBERS</SidebarGroupLabel>
            <NavMain
              items={[
                { title: "Companies", url: "/admin/company", icon: HomeIcon },
                { title: "Clients", url: "/admin/clients", icon: UserCheckIcon },
                { title: "Leads", url: "/admin/leads", icon: UserPlusIcon },
              ]}
            />
          </SidebarGroup>
        )}
        {isAdmin && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel>RECRUITMENT</SidebarGroupLabel>
            <NavMainWithSubgroups
              items={[
                { title: "Jobs", url: "/admin/jobs", icon: FilePenLineIcon },
                {
                  title: "Applicants",
                  icon: FileTextIcon,
                  items: [
                    { title: "BPOC", url: "/admin/bpoc-applicants", badge: newApplicantsCount > 0 ? newApplicantsCount : undefined },
                    { title: "Records", url: "/admin/applicants-records" },
                  ]
                },
                { title: "Talent Pool", url: "/admin/talent-pool", icon: SparklesIcon }
              ]}
            />
          </SidebarGroup>
        )}
        {isAdmin && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel>HAPPENINGS</SidebarGroupLabel>
            <NavMain
              items={[
                { title: "Announcements", url: "/admin/announcements", icon: MegaphoneIcon, badge: activeAnnouncementsCount > 0 ? activeAnnouncementsCount : undefined },
                { title: "Events & Activities", url: "/admin/events", icon: CalendarIcon, badge: todayEventsCount > 0 ? todayEventsCount : undefined },
              ]}
            />
          </SidebarGroup>
        )}
        {isAdmin && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel>TRACKING</SidebarGroupLabel>
            <NavMain
              items={[
                { title: "Breaks", url: "/admin/breaks", icon: ClockIcon },
                { title: "Activity", url: "/admin/activities", icon: BarChart3Icon },
              ]}
            />
          </SidebarGroup>
        )}

        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  )
})
