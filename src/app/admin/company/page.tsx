"use client"

/**
 * Companies Page with Real-time Updates
 * 
 * This page displays all companies and automatically updates in real-time when:
 * - New companies are created
 * - Existing companies are updated
 * - Companies are deleted
 * - Agents are assigned/unassigned from companies
 * - Clients are assigned/unassigned from companies
 * 
 * Real-time updates are powered by PostgreSQL NOTIFY/LISTEN and WebSocket connections.
 * The modal (AddCompanyModal) uses Redis for temporary work storage.
 */

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ReloadButton } from "@/components/ui/reload-button"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { IconSearch, IconChevronUp, IconChevronDown, IconLink, IconPhone, IconMapPin, IconPlus } from "@tabler/icons-react"
import { LinkPreview } from "@/components/ui/link-preview"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { useTheme } from "next-themes"
import { AddCompanyModal } from "@/components/modals/companies-detail-modal"
import { useRealtimeCompanies } from "@/hooks/use-realtime-companies"
import { UserTooltip } from "@/components/ui/user-tooltip"

interface CompanyRecord {
  id: number
  company: string
  address: string | null
  phone: string | null
  logo: string | null
  service: string | null
  status: string | null
  badge_color: string | null
  country: string | null
  website: string[] | null
  shift: string | null
  company_id: string
  created_at: string
  updated_at: string
  employee_count?: number
  client_count?: number
}

// Type for the modal that extends CompanyData
interface CompanyModalData {
  id: number
  company: string
  address: string | null
  phone: string | null
  logo: File | null
  logoUrl: string | null
  service: string | null
  status: string | null
  badge_color?: string
  country: string | null
  website: string | null
  shift: string | null
  originalAgentIds: number[]
  originalClientIds: number[]
  selectedAgentIds: number[]
  selectedClientIds: number[]
  selectedAgentsData: any[]
  selectedClientsData: any[]
}

export default function CompaniesPage() {
  const { theme } = useTheme()
  
  // Realtime updates hook
  const { isConnected } = useRealtimeCompanies({
    onCompanyCreated: (newCompany) => {
      console.log('🆕 New company created:', newCompany)
      // Add new company to the list if it matches current search/filters
      if (!search.trim() || 
          newCompany.company?.toLowerCase().includes(search.toLowerCase()) ||
          newCompany.service?.toLowerCase().includes(search.toLowerCase()) ||
          newCompany.country?.toLowerCase().includes(search.toLowerCase())) {
        setCompanies(prev => [newCompany, ...prev])
        setTotalCount(prev => prev + 1)
      }
    },
    onCompanyUpdated: (updatedCompany) => {
      console.log('📝 Company updated:', updatedCompany)
      // Update company in the list, preserving existing counts if not provided
      setCompanies(prev => prev.map(c => {
        if (c.id === updatedCompany.id) {
          return {
            ...updatedCompany,
            // Preserve existing counts if the update doesn't include them
            employee_count: updatedCompany.employee_count ?? c.employee_count,
            client_count: updatedCompany.client_count ?? c.client_count
          }
        }
        return c
      }))
      // Clear cache for this company's users since assignments might have changed
      setCompanyUsersCache(prev => {
        const newCache = { ...prev }
        delete newCache[`agents:${updatedCompany.id}`]
        delete newCache[`clients:${updatedCompany.id}`]
        return newCache
      })
    },
    onCompanyDeleted: (deletedCompany) => {
      console.log('🗑️ Company deleted:', deletedCompany)
      
      // Handle null or undefined deletedCompany
      if (!deletedCompany || !deletedCompany.id) {
        console.warn('⚠️ Received null/undefined deletedCompany in onCompanyDeleted')
        return
      }
      
      // Remove company from the list
      setCompanies(prev => prev.filter(c => c.id !== deletedCompany.id))
      setTotalCount(prev => Math.max(0, prev - 1))
      // Clear cache for this company's users
      setCompanyUsersCache(prev => {
        const newCache = { ...prev }
        delete newCache[`agents:${deletedCompany.id}`]
        delete newCache[`clients:${deletedCompany.id}`]
        return newCache
      })
    },
    onAgentCompanyChanged: (agent, oldAgent, notificationData) => {
      console.log('👤 Agent moved from company', oldAgent?.company_id, 'to', agent?.company_id)
      console.log('📊 Real-time count updates:', notificationData?.count_updates)
      
      // Handle null or undefined parameters
      if (!agent || !oldAgent) {
        console.warn('⚠️ Received null/undefined agent or oldAgent in onAgentCompanyChanged')
        return
      }
      
      // Clear cache for both old and new companies since agent assignments changed
      setCompanyUsersCache(prev => {
        const newCache = { ...prev }
        if (oldAgent.company_id) delete newCache[`agents:${oldAgent.company_id}`]
        if (agent.company_id) delete newCache[`agents:${agent.company_id}`]
        return newCache
      })
      
      // Update employee counts using real-time data from enhanced database triggers
      console.log('🔍 Full notification data:', notificationData)
      
      if (notificationData?.count_updates) {
        console.log('✅ Using real-time count updates:', notificationData.count_updates)
        const { old_company_id, old_employee_count, new_company_id, new_employee_count } = notificationData.count_updates
        
        setCompanies(prev => prev.map(m => {
          if (m.id === old_company_id) {
            return { ...m, employee_count: old_employee_count || 0 }
          }
          if (m.id === new_company_id) {
            return { ...m, employee_count: new_employee_count || 0 }
          }
          return m
        }))
      }
      // No fallback - only real-time counts from database triggers
    },
    onClientCompanyChanged: (client, oldClient, notificationData) => {
      console.log('🏢 Client moved from company', oldClient?.company_id, 'to', client?.company_id)
      console.log('📊 Real-time count updates:', notificationData?.count_updates)
      
      // Handle null or undefined parameters
      if (!client || !oldClient) {
        console.warn('⚠️ Received null/undefined client or oldClient in onClientCompanyChanged')
        return
      }
      
      // Clear cache for both old and new companies since client assignments changed
      setCompanyUsersCache(prev => {
        const newCache = { ...prev }
        if (oldClient.company_id) delete newCache[`clients:${oldClient.company_id}`]
        if (client.company_id) delete newCache[`clients:${client.company_id}`]
        return newCache
      })
      
      // Update client counts using real-time data from enhanced database triggers
      console.log('🔍 Full notification data for client:', notificationData)
      
      if (notificationData?.count_updates) {
        console.log('✅ Using real-time client count updates:', notificationData.count_updates)
        const { old_company_id, old_client_count, new_company_id, new_client_count } = notificationData.count_updates
        
        setCompanies(prev => prev.map(m => {
          if (m.id === old_company_id) {
            return { ...m, client_count: old_client_count || 0 }
          }
          if (m.id === new_company_id) {
            return { ...m, client_count: new_client_count || 0 }
          }
          return m
        }))
      }
      // No fallback - only real-time counts from database triggers
    }
  })

  const getServiceBadgeClass = (service: string | null): string => {
    const s = (service || '').toLowerCase()
    if (s === 'workforce') {
      return 'text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20'
    }
    if (s === 'one agent') {
      return 'text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20'
    }
    if (s === 'team') {
      return 'text-yellow-700 dark:text-white border-yellow-600/20 bg-yellow-50 dark:bg-yellow-600/20'
    }
    return 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20'
  }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companies, setCompanies] = useState<CompanyRecord[]>([])
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 40
  const [sortField, setSortField] = useState<string>('company')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [loadingUsersKey, setLoadingUsersKey] = useState<string | null>(null)
  const [companyUsersCache, setCompanyUsersCache] = useState<Record<string, { type: 'agents' | 'clients', users: { user_id: number, first_name: string | null, last_name: string | null, profile_picture: string | null, employee_id: string | null }[] }>>({})
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false)
  const [companyToEdit, setCompanyToEdit] = useState<CompanyModalData | null>(null)
  const [reloading, setReloading] = useState(false)

  const openEditModal = (company: CompanyRecord) => {
    // Convert CompanyRecord to CompanyModalData format for the modal
    const companyData: CompanyModalData = {
      id: company.id,
      company: company.company,
      address: company.address,
      phone: company.phone,
      logo: null, // Logo editing not yet implemented
      logoUrl: typeof company.logo === 'string' ? company.logo : null,
      service: company.service,
      status: company.status,
      badge_color: company.badge_color || '#0EA5E9',
      country: company.country,
      website: Array.isArray(company.website) && company.website.length > 0 ? company.website[0] : null,
      shift: company.shift || null,
      originalAgentIds: [], // Will be populated by the modal
      originalClientIds: [], // Will be populated by the modal
      selectedAgentIds: [],
      selectedClientIds: [],
      selectedAgentsData: [],
      selectedClientsData: []
    }
    setCompanyToEdit(companyData)
    setIsAddCompanyModalOpen(true)
  }

  const closeModal = () => {
    setIsAddCompanyModalOpen(false)
    setCompanyToEdit(null)
  }

  const fetchUsersForCompany = async (companyId: number, type: 'agents' | 'clients') => {
    const key = `${type}:${companyId}`
    if (companyUsersCache[key]) return companyUsersCache[key].users
    try {
      setLoadingUsersKey(key)
      const params = new URLSearchParams({ usersOfCompany: String(companyId), type })
      const res = await fetch(`/api/companies?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      const users = Array.isArray(data.users) ? data.users : []
      setCompanyUsersCache(prev => ({ ...prev, [key]: { type, users } }))
      return users
    } catch (e) {
      return []
    } finally {
      setLoadingUsersKey(null)
    }
  }

  const fetchCompanies = async () => {
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
      const res = await fetch(`/api/companies?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to fetch companies")
      }
      const data = await res.json()
      setCompanies(data.companies || [])
      setTotalCount(data.pagination?.totalCount || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (e: any) {
      setError(e?.message || "Failed to fetch companies")
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
      const res = await fetch(`/api/companies?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to fetch companies")
      }
      const data = await res.json()
      setCompanies(data.companies || [])
      setTotalCount(data.pagination?.totalCount || 0)
      setTotalPages(data.pagination?.totalPages || 1)
      setError(null) // Clear any previous errors
      
    } catch (err) {
      console.error('❌ Reload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to reload companies')
    } finally {
      setReloading(false)
    }
  }

  useEffect(() => { fetchCompanies() }, [])
  useEffect(() => { setCurrentPage(1) }, [search])
  useEffect(() => {
    const t = setTimeout(() => fetchCompanies(), 300)
    return () => clearTimeout(t)
  }, [currentPage, search, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

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
                    <h1 className="text-2xl font-bold">Companies</h1>
                    <p className="text-sm text-muted-foreground">Directory of companies</p>
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
                      placeholder="Search by company, service, country, phone, address, or website..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="default" 
                    onClick={() => setIsAddCompanyModalOpen(true)} 
                  >
                    <IconPlus className="h-4 w-4" />
                    Add New
                  </Button>
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {companies.map((m) => (
                        <Card key={m.id} className="h-full cursor-pointer hover:border-primary/50 hover:text-primary transition-all duration-200" onClick={() => openEditModal(m)}>
                          <CardContent className="p-4 h-full flex flex-col">
                              <div className="flex items-start justify-between gap-3">
                                                             <div className="min-w-0">
                                 <div className="font-medium truncate max-w-[14rem]">{m.company}</div>
                               </div>
                              {m.service && (
                                <Badge 
                                  variant="outline" 
                                  className={`px-3 py-1 font-medium ${getServiceBadgeClass(m.service)}`}
                                >
                                  {m.service}
                                </Badge>
                              )}
                            </div>
                            <div className="mt-3 space-y-2 text-sm">
                              {(m.address || m.country) && (
                                <div className="flex items-center gap-2 text-muted-foreground truncate">
                                  <IconMapPin className="h-4 w-4" />
                                  <span className="truncate">{m.address ? `${m.address}${m.country ? ", " + m.country : ""}` : m.country}</span>
                                </div>
                              )}
                              {Array.isArray(m.website) && m.website.length > 0 && (
                                <div className="flex items-center gap-2 text-muted-foreground truncate">
                                  <IconLink className="h-4 w-4 shrink-0" />
                                  <LinkPreview url={m.website[0] || '#'} className="truncate">
                                    <span className="truncate">{m.website[0]}</span>
                                  </LinkPreview>
                                </div>
                              )}
                              {m.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground truncate">
                                  <IconPhone className="h-4 w-4" />
                                  <span className="truncate" title={m.phone || ''}>{m.phone}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-auto pt-4">
                              <div className="h-px bg-border mb-3" />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">Employees</span>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="rounded-md border px-1.5 py-0.5 text-base font-semibold leading-none text-foreground/80 hover:bg-accent hover:border-primary/50 hover:text-primary transition-all duration-200 cursor-pointer" onClick={async (e) => { e.stopPropagation(); await fetchUsersForCompany(m.id, 'agents') }}>
                                        {typeof m.employee_count === 'number' ? m.employee_count : 0}
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" sideOffset={6} className="w-80 p-2">
                                      <div className="flex flex-wrap gap-2 items-center justify-center min-h-10">
                                        {loadingUsersKey === `agents:${m.id}` && !companyUsersCache[`agents:${m.id}`] && (
                                          <div className="w-full flex items-center justify-center py-2 gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0s' }} />
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.4s' }} />
                                          </div>
                                        )}
                                        {(companyUsersCache[`agents:${m.id}`]?.users || []).map(u => (
                                          <UserTooltip key={u.user_id} user={u} showEmployeeId={true} />
                                        ))}
                                        {loadingUsersKey !== `agents:${m.id}` && (!companyUsersCache[`agents:${m.id}`]?.users || companyUsersCache[`agents:${m.id}`]?.users.length === 0) && (
                                          <div className="text-xs text-muted-foreground w-full text-center">No Agents</div>
                                        )}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">Clients</span>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="rounded-md border px-1.5 py-0.5 text-base font-semibold leading-none text-foreground/80 hover:bg-accent hover:border-primary/50 hover:text-primary transition-all duration-200 cursor-pointer" onClick={async (e) => { e.stopPropagation(); await fetchUsersForCompany(m.id, 'clients') }}>
                                        {typeof m.client_count === 'number' ? m.client_count : 0}
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" sideOffset={6} className="w-80 p-2">
                                      <div className="flex flex-wrap gap-2 items-center justify-center min-h-10">
                                        {loadingUsersKey === `clients:${m.id}` && !companyUsersCache[`clients:${m.id}`] && (
                                          <div className="w-full flex items-center justify-center py-2 gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0s' }} />
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.4s' }} />
                                          </div>
                                        )}
                                        {(companyUsersCache[`clients:${m.id}`]?.users || []).map(u => (
                                          <UserTooltip key={u.user_id} user={u} showEmployeeId={false} />
                                        ))}
                                        {loadingUsersKey !== `clients:${m.id}` && (!companyUsersCache[`clients:${m.id}`]?.users || companyUsersCache[`clients:${m.id}`]?.users.length === 0) && (
                                          <div className="text-xs text-muted-foreground w-full text-center">No Clients</div>
                                        )}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                            </div>
                            
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-muted-foreground">
                          {totalCount > 0
                            ? <>Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} Companies</>
                            : <>Showing 0 to 0 of 0 Companies</>
                          }
                        </div>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.max(1, p - 1)) }}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(page) }} isActive={currentPage === page}>
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.min(totalPages, p + 1)) }}
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

      {/* Add/Edit Company Modal */}
      <AddCompanyModal 
        isOpen={isAddCompanyModalOpen}
        onClose={closeModal}
        companyToEdit={companyToEdit}
        onCompanyAdded={(company) => {
          console.log('Company saved:', company)
          
          // Real-time updates will handle the refresh automatically
          // Just clear cache to ensure fresh data when real-time updates arrive
          if (company && company.id) {
            console.log('🔄 Clearing cache for real-time updates...')
            setCompanyUsersCache(prev => {
              const newCache = { ...prev }
              delete newCache[`agents:${company.id}`]
              delete newCache[`clients:${company.id}`]
              return newCache
            })
          }
        }}
      />
    </>
  )
}


