"use client"

import { useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IconSearch, IconMail, IconPhone, IconArrowUp, IconArrowDown } from "@tabler/icons-react"
import { AgentsDetailModal } from "@/components/modals/agents-detail-modal"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator, SelectGroup, SelectLabel } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { useTheme } from "next-themes"
import { useRealtimeCompanies } from "@/hooks/use-realtime-companies"
import { ReloadButton } from "@/components/ui/reload-button"

interface AgentRecord {
  user_id: number
  email: string
  user_type: string
  // Personal Info fields
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  nickname: string | null
  profile_picture: string | null
  phone: string | null
  birthday: string | null
  city: string | null
  address: string | null
  gender: string | null
  // Job Info fields
  employee_id: string | null
  job_title: string | null
  work_email: string | null
  shift_period: string | null
  shift_schedule: string | null
  shift_time: string | null
  work_setup: string | null
  employment_status: string | null
  hire_type: string | null
  staff_source: string | null
  start_date: string | null
  exit_date: string | null
  // Agent specific fields
  company_id: number | null
  company_name: string | null
  company_badge_color: string | null
  department_id: number | null
  department_name: string | null
  station_id: string | null
}

export default function AgentsPage() {
  const { theme } = useTheme()
  function withAlpha(hex: string, alpha: number): string {
    const clean = hex?.trim() || ''
    const match = /^#([A-Fa-f0-9]{6})$/.exec(clean)
    if (!match) return hex || 'transparent'
    const r = parseInt(clean.slice(1, 3), 16)
    const g = parseInt(clean.slice(3, 5), 16)
    const b = parseInt(clean.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 40
  const [companyId, setCompanyId] = useState<string>('all')
  const [companyOptions, setCompanyOptions] = useState<{ id: number; company: string }[]>([])
  const [sortField, setSortField] = useState<string>('first_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedAgent, setSelectedAgent] = useState<AgentRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [reloading, setReloading] = useState(false)

  // Real-time updates for all agent changes
  const { isConnected: isRealtimeConnected } = useRealtimeCompanies({
    onAgentCompanyChanged: (updatedAgent, oldAgent, notificationData) => {
      console.log('🔄 Real-time: Agent company update received in agents page:', { 
        updatedAgent, 
        oldAgent, 
        currentAgentsCount: agents.length
      })
      
      // Update the agents list with the new data
      setAgents(prevAgents => {
        const agentIndex = prevAgents.findIndex(agent => agent.user_id === updatedAgent.user_id)
        
        if (agentIndex !== -1) {
          console.log('🔄 Updating agent company in list:', updatedAgent.user_id)
          
          // Create updated agent with new company information
          const updatedAgentInList = {
            ...prevAgents[agentIndex],
            company_id: updatedAgent.company_id
          }
          
          // If company_id changed, fetch the updated company information
          if (updatedAgent.company_id !== oldAgent?.company_id) {
            // Use setTimeout to avoid async issues in the callback
            setTimeout(async () => {
              try {
                console.log('🔄 Fetching updated company information for agent:', updatedAgent.user_id)
                const response = await fetch(`/api/agents/${updatedAgent.user_id}`)
                if (response.ok) {
                  const responseData = await response.json()
                  const freshAgentData = responseData.agent
                  
                  // Update with complete company information
                  setAgents(prevAgents => {
                    const agentIndex = prevAgents.findIndex(agent => agent.user_id === updatedAgent.user_id)
                    if (agentIndex !== -1) {
                      const newAgents = [...prevAgents]
                      newAgents[agentIndex] = {
                        ...newAgents[agentIndex],
                        company_name: freshAgentData.company_name,
                        company_badge_color: freshAgentData.company_badge_color
                      }
                      return newAgents
                    }
                    return prevAgents
                  })
                  
                  console.log('🔄 Updated agent with company info:', {
                    company_id: updatedAgent.company_id,
                    company_name: freshAgentData.company_name,
                    company_badge_color: freshAgentData.company_badge_color
                  })
                }
              } catch (error) {
                console.error('❌ Failed to fetch updated agent data:', error)
              }
            }, 0)
          }
          
          // Create new array with updated agent
          const newAgents = [...prevAgents]
          newAgents[agentIndex] = updatedAgentInList
          return newAgents
        }
        
        return prevAgents
      })
      
    },
    onPersonalInfoChanged: (personalInfo, oldPersonalInfo, notificationData) => {
      console.log('🔄 Real-time: Personal info update received in agents page:', { 
        personalInfo, 
        oldPersonalInfo, 
        currentAgentsCount: agents.length
      })
      
      // Update the agents list with new personal info
      setAgents(prevAgents => {
        const agentIndex = prevAgents.findIndex(agent => agent.user_id === personalInfo.user_id)
        
        if (agentIndex !== -1) {
          console.log('🔄 Updating agent personal info in list:', personalInfo.user_id)
          
          // Create updated agent with new personal info
          const updatedAgentInList = {
            ...prevAgents[agentIndex],
            first_name: personalInfo.first_name,
            middle_name: personalInfo.middle_name,
            last_name: personalInfo.last_name,
            nickname: personalInfo.nickname,
            phone: personalInfo.phone,
            address: personalInfo.address,
            city: personalInfo.city,
            gender: personalInfo.gender,
            birthday: personalInfo.birthday
          }
          
          // Create new array with updated agent
          const newAgents = [...prevAgents]
          newAgents[agentIndex] = updatedAgentInList
          return newAgents
        }
        
        return prevAgents
      })
      
    },
    onJobInfoChanged: (jobInfo, oldJobInfo, notificationData) => {
      console.log('🔄 Real-time: Job info update received in agents page:', { 
        jobInfo, 
        oldJobInfo, 
        currentAgentsCount: agents.length
      })
      
      // Update the agents list with new job info
      setAgents(prevAgents => {
        const agentIndex = prevAgents.findIndex(agent => agent.user_id === jobInfo.user_id)
        
        if (agentIndex !== -1) {
          console.log('🔄 Updating agent job info in list:', jobInfo.user_id)
          
          // Create updated agent with new job info
          const updatedAgentInList = {
            ...prevAgents[agentIndex],
            employee_id: jobInfo.employee_id,
            job_title: jobInfo.job_title,
            shift_period: jobInfo.shift_period,
            shift_schedule: jobInfo.shift_schedule,
            shift_time: jobInfo.shift_time,
            work_setup: jobInfo.work_setup,
            employment_status: jobInfo.employment_status,
            hire_type: jobInfo.hire_type,
            staff_source: jobInfo.staff_source,
            start_date: jobInfo.start_date,
            exit_date: jobInfo.exit_date,
            work_email: jobInfo.work_email
          }
          
          // Create new array with updated agent
          const newAgents = [...prevAgents]
          newAgents[agentIndex] = updatedAgentInList
          return newAgents
        }
        
        return prevAgents
      })
      
    }
  })

  const handleRowClick = async (agent: AgentRecord) => {
    // 🚀 INSTANT: Open modal immediately with basic data (12 fields)
    setSelectedAgent(agent)
    setIsModalOpen(true)
    
    // 🔄 BACKGROUND: Fetch additional data (21 fields) and update
    try {
      console.log('🔄 Fetching additional agent details in background...')
      const response = await fetch(`/api/agents/${agent.user_id}/details`)
      if (response.ok) {
        const data = await response.json()
        // Merge existing 12 fields with 21 new fields
        setSelectedAgent({ ...agent, ...data.agent })
        console.log('✅ Additional agent details loaded successfully')
      } else {
        console.warn('⚠️ Failed to fetch additional details, using basic data')
      }
    } catch (error) {
      console.error('❌ Failed to fetch agent details:', error)
      // Modal stays open with basic data - no user impact
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAgent(null)
  }

  const fetchAgents = async () => {
    try {
      setLoading(true)
      setError(null)
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(PAGE_SIZE),
          sortField,
          sortDirection,
        })
      if (search.trim()) params.append('search', search.trim())
      if (companyId !== 'all') params.append('companyId', companyId)
      const res = await fetch(`/api/agents?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to fetch agents")
      }
      const data = await res.json()
      if (data?.agents && data?.pagination) {
        setAgents(data.agents)
        setTotalCount(data.pagination.totalCount || 0)
        setTotalPages(data.pagination.totalPages || 1)
      } else {
        setAgents(Array.isArray(data) ? data : [])
        const fallbackCount = Array.isArray(data) ? data.length : 0
        setTotalCount(fallbackCount)
        setTotalPages(Math.max(1, Math.ceil(fallbackCount / PAGE_SIZE)))
      }
    } catch (e: any) {
      setError(e?.message || "Failed to fetch agents")
    } finally {
      setLoading(false)
    }
  }

  // Reload function
  const handleReload = async () => {
    setReloading(true)
    try {
      // Don't set loading to true during reload to keep the UI visible
      setError(null)
      
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        sortField,
        sortDirection,
      })
      if (search.trim()) params.append('search', search.trim())
      if (companyId !== 'all') params.append('companyId', companyId)
      const res = await fetch(`/api/agents?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to fetch agents")
      }
      const data = await res.json()
      if (data?.agents && data?.pagination) {
        setAgents(data.agents)
        setTotalCount(data.pagination.totalCount || 0)
        setTotalPages(data.pagination.totalPages || 1)
      } else {
        setAgents(Array.isArray(data) ? data : [])
        const fallbackCount = Array.isArray(data) ? data.length : 0
        setTotalCount(fallbackCount)
        setTotalPages(Math.max(1, Math.ceil(fallbackCount / PAGE_SIZE)))
      }
      setError(null) // Clear any previous errors
      
    } catch (err) {
      console.error('❌ Reload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to reload agents')
    } finally {
      setReloading(false)
    }
  }

  useEffect(() => { fetchAgents() }, [])

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/agents', { method: 'OPTIONS' })
        const data = await res.json()
        setCompanyOptions(data.companies || [])
      } catch (e) {
        setCompanyOptions([])
      }
    }
    fetchCompanies()
  }, [])

  // Reset to page 1 when search changes
  useEffect(() => { setCurrentPage(1) }, [search])

  // Debounce fetch on search/page changes
  useEffect(() => {
    const timer = setTimeout(() => { fetchAgents() }, 300)
    return () => clearTimeout(timer)
  }, [currentPage, search, companyId, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  // no custom page list; mirror past tickets pagination (full page numbers)

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Agents</h1>
                    <p className="text-sm text-muted-foreground">Directory of employees with company assignments and contact details</p>
                  </div>
                  <div className="flex gap-2">
                    <ReloadButton onReload={handleReload} loading={reloading} className="flex-1" />
                  </div>
                </div>
              </div>
              <div className="px-4 lg:px-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, employee ID, job title, company, phone, or email..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                                    <div className="w-56">
                    <Select value={companyId} onValueChange={(v: string) => { setCompanyId(v); setCurrentPage(1) }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by company" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Agents</SelectItem>
                        <SelectItem value="none">No Assigned Companies</SelectItem>
                        <SelectSeparator className="bg-border mx-2" />
                        <SelectGroup>
                          <SelectLabel className="text-muted-foreground">Companies</SelectLabel>
                          {companyOptions.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>{m.company}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : error ? (
                  <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
                ) : (
                  <div>
                  <Card>
                                          <CardContent className="px-0 pt-0 pb-0">
                      <div className="rounded-xl overflow-hidden">
                                                  <Table className="table-fixed w-full">
                          <colgroup>
                            <col className="w-[16rem]" />
                            <col className="w-80" />
                            <col className="w-72" />
                            <col className="w-[22rem]" />
                          </colgroup>
                          <TableHeader>
                            <TableRow variant="no-hover">
                            <TableHead onClick={() => handleSort('first_name')} className={`cursor-pointer ${sortField === 'first_name' ? 'text-primary font-medium bg-accent/50' : ''}`}>
                              <div className="flex items-center gap-1">
                                Name <span className="w-4 h-4">{sortField === 'first_name' && (sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4 text-primary" /> : <IconArrowDown className="h-4 w-4 text-primary" />)}</span>
                              </div>
                            </TableHead>
                            <TableHead onClick={() => handleSort('job_title')} className={`cursor-pointer ${sortField === 'job_title' ? 'text-primary font-medium bg-accent/50' : ''}`}>
                              <div className="flex items-center gap-1">
                                Job Title <span className="w-4 h-4">{sortField === 'job_title' && (sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4 text-primary" /> : <IconArrowDown className="h-4 w-4 text-primary" />)}</span>
                              </div>
                            </TableHead>
                            <TableHead onClick={() => handleSort('company_name')} className={`cursor-pointer ${sortField === 'company_name' ? 'text-primary font-medium bg-accent/50' : ''}`}>
                              <div className="flex items-center gap-1">
                                Company <span className="w-4 h-4">{sortField === 'company_name' && (sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4 text-primary" /> : <IconArrowDown className="h-4 w-4 text-primary" />)}</span>
                              </div>
                            </TableHead>
                            <TableHead onClick={() => handleSort('work_email')} className={`cursor-pointer ${sortField === 'work_email' ? 'text-primary font-medium bg-accent/50' : ''}`}>
                              <div className="flex items-center gap-1">
                                Contact <span className="w-4 h-4">{sortField === 'work_email' && (sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4 text-primary" /> : <IconArrowDown className="h-4 w-4 text-primary" />)}</span>
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                        {agents.map((a) => (
                          <TableRow 
                            key={a.user_id} 
                            className="cursor-pointer hover:bg-muted/50 hover:shadow-sm transition-all duration-200 group"
                            onClick={() => handleRowClick(a)}
                          >
                            <TableCell className="whitespace-nowrap group-hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={a.profile_picture ?? undefined} alt={(a.first_name || "") + (a.last_name ? ` ${a.last_name}` : "")} />
                                  <AvatarFallback>
                                    {((a.first_name || "").charAt(0) + (a.last_name || "").charAt(0) || "A").toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate block max-w-[9rem]">{(a.first_name || "") + (a.last_name ? ` ${a.last_name}` : "")}</span>
                                {a.employee_id && (
                                  <Badge
                                    variant="outline"
                                    className="border"
                                    style={
                                      theme === 'dark'
                                        ? {
                                            backgroundColor: '#44464880',
                                            borderColor: '#444648',
                                            color: '#ffffff',
                                          }
                                        : {
                                            backgroundColor: '#44464814',
                                            borderColor: '#a5a5a540',
                                            color: '#444648',
                                          }
                                    }
                                  >
                                    {a.employee_id}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap group-hover:bg-muted/30 transition-colors"><span className="truncate block max-w-[18rem]">{a.job_title || "-"}</span></TableCell>
                            <TableCell className="whitespace-nowrap group-hover:bg-muted/30 transition-colors">
                              {a.company_name ? (
                                <Badge
                                  variant="outline"
                                  className="border"
                                  style={{
                                    backgroundColor: withAlpha(a.company_badge_color || '#999999', 0.2),
                                    borderColor: withAlpha(a.company_badge_color || '#999999', 0.4),
                                    color: theme === 'dark' ? '#ffffff' : (a.company_badge_color || '#6B7280'),
                                  }}
                                >
                                  <span className="truncate inline-block max-w-[16rem] align-bottom">{a.company_name}</span>
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap group-hover:bg-muted/30 transition-colors">
                              <div className="flex flex-col gap-0.5 leading-tight">
                                <div className="flex items-center gap-1.5">
                                  <IconMail className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="truncate block max-w-[18rem]">{a.work_email || a.email}</span>
                                </div>
                                {a.phone && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <IconPhone className="h-3.5 w-3.5" />
                                  <span className="truncate">{a.phone}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        {totalCount > 0
                          ? <>Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} Agents</>
                          : <>Showing 0 to 0 of 0 Agents</>
                        }
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage((p) => Math.max(1, p - 1))
                              }}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setCurrentPage(page)
                                }}
                                isActive={currentPage === page}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage((p) => Math.min(totalPages, p + 1))
                              }}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Agents Detail Modal */}
      <AgentsDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        agentId={selectedAgent?.user_id?.toString()}
        agentData={selectedAgent || undefined}
      />
    </>
  )
}


