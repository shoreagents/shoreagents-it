"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { AddCompanyModal } from "@/components/modals/add-company-modal"

interface MemberRecord {
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
  company_id: string
  created_at: string
  updated_at: string
  employee_count?: number
  client_count?: number
}

export default function CompaniesPage() {
  const { theme } = useTheme()
  const getServiceBadgeClass = (service: string | null): string => {
    const s = (service || '').toLowerCase()
    if (s === 'workforce') {
      return 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800'
    }
    if (s === 'one agent') {
      return 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800'
    }
    if (s === 'team') {
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800'
    }
    return 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-900/30 dark:text-gray-200 dark:border-gray-800'
  }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberRecord[]>([])
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 40
  const [sortField, setSortField] = useState<string>('company')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [loadingUsersKey, setLoadingUsersKey] = useState<string | null>(null)
  const [memberUsersCache, setMemberUsersCache] = useState<Record<string, { type: 'agents' | 'clients', users: { user_id: number, first_name: string | null, last_name: string | null, profile_picture: string | null, employee_id: string | null }[] }>>({})
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false)

  const fetchUsersForMember = async (memberId: number, type: 'agents' | 'clients') => {
    const key = `${type}:${memberId}`
    if (memberUsersCache[key]) return memberUsersCache[key].users
    try {
      setLoadingUsersKey(key)
      const params = new URLSearchParams({ usersOfMember: String(memberId), type })
      const res = await fetch(`/api/members?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      const users = Array.isArray(data.users) ? data.users : []
      setMemberUsersCache(prev => ({ ...prev, [key]: { type, users } }))
      return users
    } catch (e) {
      return []
    } finally {
      setLoadingUsersKey(null)
    }
  }

  const fetchMembers = async () => {
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
      const res = await fetch(`/api/members?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to fetch members")
      }
      const data = await res.json()
      setMembers(data.members || [])
      setTotalCount(data.pagination?.totalCount || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (e: any) {
      setError(e?.message || "Failed to fetch members")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMembers() }, [])
  useEffect(() => { setCurrentPage(1) }, [search])
  useEffect(() => {
    const t = setTimeout(() => fetchMembers(), 300)
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
                    <p className="text-sm text-muted-foreground">Directory of member companies</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddCompanyModalOpen(true)} 
                  >
                    <IconPlus className="h-4 w-4" />
                    Add Company
                  </Button>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search companies..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {members.map((m) => (
                        <Card key={m.id} className="h-full">
                          <CardContent className="p-4 h-full flex flex-col">
                              <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={m.logo ?? undefined} alt={m.company} />
                                  <AvatarFallback>{(m.company || 'C').slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="font-medium truncate max-w-[14rem]">{m.company}</div>
                                </div>
                              </div>
                              {m.service && (
                                <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${getServiceBadgeClass(m.service)}`}>
                                  {m.service}
                                </span>
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
                            <div className="mt-auto pt-2">
                              <div className="h-px bg-border mb-2" />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">Employees</span>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="rounded-md border px-1.5 py-0.5 text-base font-semibold leading-none text-foreground/80 hover:bg-accent" onClick={async () => { await fetchUsersForMember(m.id, 'agents') }}>
                                        {typeof m.employee_count === 'number' ? m.employee_count : 0}
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" sideOffset={6} className="w-80 p-2">
                                      <div className="flex flex-wrap gap-2 items-center justify-center min-h-10">
                                        {loadingUsersKey === `agents:${m.id}` && !memberUsersCache[`agents:${m.id}`] && (
                                          <div className="w-full flex items-center justify-center py-2 gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0s' }} />
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.4s' }} />
                                          </div>
                                        )}
                                        {(memberUsersCache[`agents:${m.id}`]?.users || []).map(u => (
                                          <TooltipProvider key={u.user_id}>
                                            <Tooltip delayDuration={100}>
                                              <TooltipTrigger asChild>
                                                <div className="flex items-center justify-center gap-2 cursor-pointer">
                                                  <Avatar className="h-7 w-7">
                                                    <AvatarImage src={u.profile_picture ?? undefined} alt={(u.first_name || '') + ' ' + (u.last_name || '')} />
                                                    <AvatarFallback>{((u.first_name || 'U')[0] + (u.last_name || 'N')[0]).toUpperCase()}</AvatarFallback>
                                                  </Avatar>
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent className="text-sm px-3 py-2">
                                                <span className="font-medium">{[u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unknown'}</span>
                                                {u.employee_id ? (
                                                  <Badge
                                                    variant="outline"
                                                    className="border ml-2"
                                                    style={
                                                      theme === 'dark'
                                                        ? { backgroundColor: '#44464880', borderColor: '#444648', color: '#ffffff' }
                                                        : { backgroundColor: '#44464814', borderColor: '#a5a5a540', color: '#444648' }
                                                    }
                                                  >
                                                    {u.employee_id}
                                                  </Badge>
                                                ) : null}
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        ))}
                                        {loadingUsersKey !== `agents:${m.id}` && (!memberUsersCache[`agents:${m.id}`]?.users || memberUsersCache[`agents:${m.id}`]?.users.length === 0) && (
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
                                      <button className="rounded-md border px-1.5 py-0.5 text-base font-semibold leading-none text-foreground/80 hover:bg-accent" onClick={async () => { await fetchUsersForMember(m.id, 'clients') }}>
                                        {typeof m.client_count === 'number' ? m.client_count : 0}
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" sideOffset={6} className="w-80 p-2">
                                      <div className="flex flex-wrap gap-2 items-center justify-center min-h-10">
                                        {loadingUsersKey === `clients:${m.id}` && !memberUsersCache[`clients:${m.id}`] && (
                                          <div className="w-full flex items-center justify-center py-2 gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0s' }} />
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.4s' }} />
                                          </div>
                                        )}
                                        {(memberUsersCache[`clients:${m.id}`]?.users || []).map(u => (
                                          <TooltipProvider key={u.user_id}>
                                            <Tooltip delayDuration={100}>
                                              <TooltipTrigger asChild>
                                                <div className="flex items-center justify-center gap-2 cursor-pointer">
                                                  <Avatar className="h-7 w-7">
                                                    <AvatarImage src={u.profile_picture ?? undefined} alt={(u.first_name || '') + ' ' + (u.last_name || '')} />
                                                    <AvatarFallback>{((u.first_name || 'U')[0] + (u.last_name || 'N')[0]).toUpperCase()}</AvatarFallback>
                                                  </Avatar>
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent className="text-sm px-3 py-2">
                                                <span className="font-medium">{[u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unknown'}</span>
                                                {u.employee_id ? (
                                                  <Badge
                                                    variant="outline"
                                                    className="border ml-2"
                                                    style={
                                                      theme === 'dark'
                                                        ? { backgroundColor: '#44464880', borderColor: '#444648', color: '#ffffff' }
                                                        : { backgroundColor: '#44464814', borderColor: '#a5a5a540', color: '#444648' }
                                                    }
                                                  >
                                                    {u.employee_id}
                                                  </Badge>
                                                ) : null}
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        ))}
                                        {loadingUsersKey !== `clients:${m.id}` && (!memberUsersCache[`clients:${m.id}`]?.users || memberUsersCache[`clients:${m.id}`]?.users.length === 0) && (
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

      {/* Add Company Modal */}
      <AddCompanyModal 
        isOpen={isAddCompanyModalOpen}
        onClose={() => setIsAddCompanyModalOpen(false)}
        onCompanyAdded={(company) => {
          console.log('New company added:', company)
          // Refresh the companies list
          fetchMembers()
        }}
      />
    </>
  )
}


