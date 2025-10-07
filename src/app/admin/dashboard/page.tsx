"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Users, 
  Ticket, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Calendar,
  MessageSquare,
  UserPlus,
  Building2,
  UserCheck,
  FileText,
  Sparkles,
  Trophy,
  Megaphone,
  History,
  Briefcase,
  User,
  Home,
  Activity,
  ArrowRight,
  Eye
} from "lucide-react"
import { useRoleBasedTicketsCount, useRoleBasedApplicantsCount, useRoleBasedEventsCount, useRoleBasedAnnouncementsCount } from "@/hooks/use-realtime-count"

export default function AdminDashboard() {
  const router = useRouter()
  const { newTicketsCount, error: ticketsError, isConnected } = useRoleBasedTicketsCount()
  const { newApplicantsCount, error: applicantsError, isConnected: applicantsIsConnected } = useRoleBasedApplicantsCount()
  const { todayEventsCount, error: eventsError, isConnected: eventsIsConnected } = useRoleBasedEventsCount()
  const { activeAnnouncementsCount, error: announcementsError, isConnected: announcementsIsConnected } = useRoleBasedAnnouncementsCount()

  const adminSections = [
    {
      title: "Support Management",
      description: "Manage tickets and support requests",
      sections: [
        {
          title: "Tickets",
          description: "Active support tickets",
          icon: Ticket,
          url: "/admin/tickets",
          badge: newTicketsCount > 0 ? newTicketsCount : undefined,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200"
        },
        {
          title: "Past Tickets",
          description: "Historical ticket records",
          icon: History,
          url: "/admin/past-tickets",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200"
        }
      ]
    },
    {
      title: "Employee Management",
      description: "Manage internal staff and agents",
      sections: [
        {
          title: "Internal Staff",
          description: "Internal team members",
          icon: User,
          url: "/admin/internal",
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200"
        },
        {
          title: "Agents",
          description: "Customer service agents",
          icon: Users,
          url: "/admin/agents",
          color: "text-indigo-600",
          bgColor: "bg-indigo-50",
          borderColor: "border-indigo-200"
        },
        {
          title: "Onboarding",
          description: "New employee onboarding",
          icon: UserPlus,
          url: "/admin/onboarding",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200"
        }
      ]
    },
    {
      title: "Member Management",
      description: "Manage companies, clients, and leads",
      sections: [
        {
          title: "Companies",
          description: "Company profiles and information",
          icon: Building2,
          url: "/admin/company",
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200"
        },
        {
          title: "Clients",
          description: "Client management",
          icon: UserCheck,
          url: "/admin/clients",
          color: "text-teal-600",
          bgColor: "bg-teal-50",
          borderColor: "border-teal-200"
        },
        {
          title: "Leads",
          description: "Lead generation and tracking",
          icon: UserPlus,
          url: "/admin/leads",
          color: "text-cyan-600",
          bgColor: "bg-cyan-50",
          borderColor: "border-cyan-200"
        }
      ]
    },
    {
      title: "Tracking & Analytics",
      description: "Monitor performance and activities",
      sections: [
        {
          title: "Breaks",
          description: "Employee break tracking",
          icon: Clock,
          url: "/admin/breaks",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200"
        },
        {
          title: "Activity",
          description: "System activity monitoring",
          icon: Activity,
          url: "/admin/activities",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200"
        }
      ]
    },
    {
      title: "Recruitment",
      description: "Manage job postings and applicants",
      sections: [
        {
          title: "Jobs",
          description: "Job postings and requirements",
          icon: Briefcase,
          url: "/admin/jobs",
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200"
        },
        {
          title: "BPOC Applicants",
          description: "BPOC application management",
          icon: FileText,
          url: "/admin/bpoc-applicants",
          badge: newApplicantsCount > 0 ? newApplicantsCount : undefined,
          color: "text-violet-600",
          bgColor: "bg-violet-50",
          borderColor: "border-violet-200"
        },
        {
          title: "Applicant Records",
          description: "Historical applicant data",
          icon: FileText,
          url: "/admin/applicants-records",
          color: "text-slate-600",
          bgColor: "bg-slate-50",
          borderColor: "border-slate-200"
        },
        {
          title: "Talent Pool",
          description: "Talent management system",
          icon: Sparkles,
          url: "/admin/talent-pool",
          color: "text-pink-600",
          bgColor: "bg-pink-50",
          borderColor: "border-pink-200"
        }
      ]
    },
    {
      title: "Events & Communication",
      description: "Manage events, announcements, and recognition",
      sections: [
        {
          title: "Leaderboard",
          description: "Performance rankings",
          icon: Trophy,
          url: "/admin/leaderboard",
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200"
        },
        {
          title: "Announcements",
          description: "Company announcements",
          icon: Megaphone,
          url: "/admin/announcements",
          badge: activeAnnouncementsCount > 0 ? activeAnnouncementsCount : undefined,
          color: "text-lime-600",
          bgColor: "bg-lime-50",
          borderColor: "border-lime-200"
        },
        {
          title: "Events & Activities",
          description: "Event management",
          icon: Calendar,
          url: "/admin/events",
          badge: todayEventsCount > 0 ? todayEventsCount : undefined,
          color: "text-sky-600",
          bgColor: "bg-sky-50",
          borderColor: "border-sky-200"
        }
      ]
    },
    {
      title: "System Logs",
      description: "System monitoring and logs",
      sections: [
        {
          title: "Visits",
          description: "System visit logs",
          icon: Eye,
          url: "/admin/visits",
          color: "text-neutral-600",
          bgColor: "bg-neutral-50",
          borderColor: "border-neutral-200"
        }
      ]
    }
  ]

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
                    <p className="text-sm text-muted-foreground">Comprehensive management overview of all admin sections</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{newTicketsCount || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {isConnected ? "Live updates" : "Offline"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New Applicants</CardTitle>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{newApplicantsCount || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {applicantsIsConnected ? "Live updates" : "Offline"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{todayEventsCount || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {eventsIsConnected ? "Live updates" : "Offline"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Announcements</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeAnnouncementsCount || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {announcementsIsConnected ? "Live updates" : "Offline"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Sections */}
              <div className="px-4 lg:px-6">
                <div className="space-y-8">
                  {adminSections.map((section, sectionIndex) => (
                    <div key={sectionIndex}>
                      <div className="mb-4">
                        <h2 className="text-xl font-semibold">{section.title}</h2>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {section.sections.map((item, itemIndex) => (
                          <Card 
                            key={itemIndex} 
                            className={`cursor-pointer transition-all hover:shadow-md hover:scale-105 ${item.borderColor} border-2`}
                            onClick={() => router.push(item.url)}
                          >
                            <CardHeader className={`${item.bgColor} pb-3`}>
                              <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                                  <item.icon className={`h-6 w-6 ${item.color}`} />
                                </div>
                                {item.badge && (
                                  <Badge variant="destructive" className="text-xs">
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="pt-3">
                              <CardTitle className="text-base mb-1">{item.title}</CardTitle>
                              <CardDescription className="text-sm mb-3">
                                {item.description}
                              </CardDescription>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full justify-between group"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(item.url)
                                }}
                              >
                                <span>View Details</span>
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}
