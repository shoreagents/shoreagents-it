"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IconSearch, IconMail, IconPhone, IconArrowUp, IconArrowDown } from "@tabler/icons-react"
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
import { ReloadButton } from "@/components/ui/reload-button"
import { ClientsDetailModal } from "@/components/modals/clients-detail-modal"
import { useRealtimeClients } from "@/hooks/use-realtime-clients"

interface ClientRecord {
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
  // Client specific fields
  company_id: number | null
  company_name: string | null
  company_badge_color: string | null
  station_id: string | null
  department_id: number | null
  department_name: string | null
}

export default function ClientsPage() {
  const { theme } = useTheme()
  
  // Helper function to create colors with alpha transparency
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
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 40
  const [companyId, setCompanyId] = useState<string>('all')
  const [companyOptions, setCompanyOptions] = useState<{ id: number; company: string }[]>([])
  const [sortField, setSortField] = useState<string>('first_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null)
  const [reloading, setReloading] = useState(false)

  // Realtime functionality
  const { isConnected: isRealtimeConnected } = useRealtimeClients({
    onClientCreated: (newClient) => {
      console.log('🆕 New client created via realtime:', newClient)
      // Add new client to the list if it matches current filters
      setClients(prev => {
        // Check if client already exists (avoid duplicates)
        const exists = prev.some(client => client.user_id === newClient.user_id)
        if (exists) return prev
        
        // Add new client to the beginning of the list
        return [newClient, ...prev]
      })
      // Update total count
      setTotalCount(prev => prev + 1)
    },
    onClientUpdated: (updatedClient, oldClient) => {
      console.log('📝 Client updated via realtime:', updatedClient, 'Old:', oldClient)
      
      // If this update is missing company information, we need to refetch the full client data
      // because some updates don't include complete company information
      if (updatedClient && (!updatedClient.company_name || !updatedClient.company_badge_color)) {
        console.log('🔄 Incomplete client data detected, refetching full client data...')
        
        // First, update with the partial data to avoid showing empty data
        setClients(prev => 
          prev.map(client => 
            client.user_id === updatedClient.user_id ? { ...client, ...updatedClient } : client
          )
        )
        
        // Update selected client if it's the one being updated
        if (selectedClient?.user_id === updatedClient.user_id) {
          setSelectedClient(prev => prev ? { ...prev, ...updatedClient } : updatedClient)
        }
        
        // Then refetch the complete data in the background
        fetch(`/api/clients/${updatedClient.user_id}`)
          .then(res => res.json())
          .then(data => {
            if (data.client) {
              console.log('✅ Refetched full client data:', data.client)
              // Update client in the list with complete data
              setClients(prev => 
                prev.map(client => 
                  client.user_id === data.client.user_id ? data.client : client
                )
              )
              // Update selected client if it's the one being updated
              if (selectedClient?.user_id === data.client.user_id) {
                setSelectedClient(data.client)
              }
            }
          })
          .catch(error => {
            console.error('❌ Failed to refetch client data:', error)
            // Keep the partial data that was already set
          })
      } else {
        // For other updates, use the data directly
        setClients(prev => 
          prev.map(client => 
            client.user_id === updatedClient.user_id ? updatedClient : client
          )
        )
        // Update selected client if it's the one being updated
        if (selectedClient?.user_id === updatedClient.user_id) {
          setSelectedClient(updatedClient)
        }
      }
    },
    onClientDeleted: (deletedClient) => {
      console.log('🗑️ Client deleted via realtime:', deletedClient)
      // Remove client from the list
      setClients(prev => 
        prev.filter(client => client.user_id !== deletedClient.user_id)
      )
      // Update total count
      setTotalCount(prev => Math.max(0, prev - 1))
      // Close modal if the deleted client was selected
      if (selectedClient?.user_id === deletedClient.user_id) {
        setIsModalOpen(false)
        setSelectedClient(null)
      }
    }
  })

  const fetchClients = async () => {
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
      const res = await fetch(`/api/clients?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to fetch clients")
      }
      const data = await res.json()
      if (data?.agents && data?.pagination) {
        setClients(data.agents)
        setTotalCount(data.pagination.totalCount || 0)
        setTotalPages(data.pagination.totalPages || 1)
      } else {
        setClients(Array.isArray(data) ? data : [])
        const fallbackCount = Array.isArray(data) ? data.length : 0
        setTotalCount(fallbackCount)
        setTotalPages(Math.max(1, Math.ceil(fallbackCount / PAGE_SIZE)))
      }
    } catch (e: any) {
      setError(e?.message || "Failed to fetch clients")
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
      const res = await fetch(`/api/clients?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to fetch clients")
      }
      const data = await res.json()
      if (data?.agents && data?.pagination) {
        setClients(data.agents)
        setTotalCount(data.pagination.totalCount || 0)
        setTotalPages(data.pagination.totalPages || 1)
      } else {
        setClients(Array.isArray(data) ? data : [])
        const fallbackCount = Array.isArray(data) ? data.length : 0
        setTotalCount(fallbackCount)
        setTotalPages(Math.max(1, Math.ceil(fallbackCount / PAGE_SIZE)))
      }
      setError(null) // Clear any previous errors
      
    } catch (err) {
      console.error('❌ Reload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to reload clients')
    } finally {
      setReloading(false)
    }
  }

  useEffect(() => { fetchClients() }, [])
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/clients', { method: 'OPTIONS' })
        const data = await res.json()
        setCompanyOptions(data.companies || [])
      } catch (e) {
        setCompanyOptions([])
      }
    }
    fetchCompanies()
  }, [])

  useEffect(() => { setCurrentPage(1) }, [search])
  useEffect(() => {
    const timer = setTimeout(() => { fetchClients() }, 300)
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

  const handleClientClick = async (client: ClientRecord) => {
    try {
      // Fetch detailed client data
      const response = await fetch(`/api/clients/${client.user_id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch client details')
      }
      const data = await response.json()
      setSelectedClient(data.client || client)
      setIsModalOpen(true)
    } catch (error) {
      console.error('Error fetching client details:', error)
      // Fallback to basic client data
      setSelectedClient(client)
      setIsModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedClient(null)
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
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold">Clients</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">Directory of client users with company assignments and contact details</p>
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
                      placeholder="Search by name, company, email, or phone..."
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
                        <SelectItem value="all">All Clients</SelectItem>
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
                              {clients.map((c) => (
                                <TableRow 
                                  key={c.user_id} 
                                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => handleClientClick(c)}
                                >
                                  <TableCell className="whitespace-nowrap">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Avatar className="h-7 w-7">
                                        <AvatarImage src={c.profile_picture ?? undefined} alt={(c.first_name || "") + (c.last_name ? ` ${c.last_name}` : "")} />
                                        <AvatarFallback>
                                          {((c.first_name || "").charAt(0) + (c.last_name || "").charAt(0) || "C").toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="truncate block max-w-[9rem]">{(c.first_name || "") + (c.last_name ? ` ${c.last_name}` : "")}</span>
                                    </div>
                                  </TableCell>

                                  <TableCell className="whitespace-nowrap">
                                    {c.company_name ? (
                                      <Badge
                                        variant="outline"
                                        className="border"
                                        style={{
                                          backgroundColor: withAlpha(c.company_badge_color || '#999999', 0.2),
                                          borderColor: withAlpha(c.company_badge_color || '#999999', 0.4),
                                          color: theme === 'dark' ? '#ffffff' : (c.company_badge_color || '#6B7280'),
                                        }}
                                      >
                                        <span className="truncate inline-block max-w-[16rem] align-bottom">{c.company_name}</span>
                                      </Badge>
                                    ) : (
                                      "-"
                                    )}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    <div className="flex flex-col gap-0.5 leading-tight">
                                      <div className="flex items-center gap-1.5">
                                        <IconMail className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="truncate block max-w-[18rem]">{c.email}</span>
                                      </div>
                                      {c.phone && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                          <IconPhone className="h-3.5 w-3.5" />
                                          <span className="truncate">{c.phone}</span>
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
                            ? <>Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} Clients</>
                            : <>Showing 0 to 0 of 0 Clients</>
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
      
      {/* Client Detail Modal */}
      <ClientsDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        clientId={selectedClient?.user_id?.toString()}
        clientData={selectedClient || undefined}
      />
    </>
  )
}



