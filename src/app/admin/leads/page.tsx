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
import { IconSearch, IconMail, IconPhone, IconArrowUp, IconArrowDown, IconBuilding, IconUser } from "@tabler/icons-react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { ReloadButton } from "@/components/ui/reload-button"
import { LeadsDetailModal } from "@/components/modals/leads-detail-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface Lead {
  id: number
  name: string
  email: string
  company: string | null
  phone: string | null
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost'
  source: string | null
  notes: string | null
  priority: 'Low' | 'Medium' | 'High'
  created_at: string
  updated_at: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'New':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'Contacted':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'Qualified':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'Proposal':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'Negotiation':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    case 'Closed Won':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
    case 'Closed Lost':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'Low':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

export default function LeadsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 20
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: PAGE_SIZE.toString(),
        sortField,
        sortDirection,
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })
      
      const response = await fetch(`/api/leads?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads)
        setTotalCount(data.pagination.totalCount)
        setTotalPages(data.pagination.totalPages)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to fetch leads')
        console.error('Failed to fetch leads:', response.status, errorData)
      }
    } catch (error) {
      setError('Network error - please check your connection')
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [currentPage, search, statusFilter, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedLead(null)
    fetchLeads() // Refresh data after modal close
  }

  const handleCreateLead = () => {
    setIsCreateModalOpen(true)
  }

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false)
    fetchLeads() // Refresh data after modal close
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex-1 flex-col gap-2 @container/main">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">Leads</h1>
                    <p className="text-sm text-muted-foreground">Manage your sales leads and prospects.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateLead} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Lead
                    </Button>
                    <ReloadButton onReload={fetchLeads} loading={loading} className="flex-1" />
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search leads..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Contacted">Contacted</SelectItem>
                      <SelectItem value="Qualified">Qualified</SelectItem>
                      <SelectItem value="Proposal">Proposal</SelectItem>
                      <SelectItem value="Negotiation">Negotiation</SelectItem>
                      <SelectItem value="Closed Won">Closed Won</SelectItem>
                      <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="space-y-4 p-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-[200px]" />
                              <Skeleton className="h-4 w-[150px]" />
                            </div>
                            <Skeleton className="h-6 w-[80px]" />
                          </div>
                        ))}
                      </div>
                    ) : error ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <p className="text-red-600 mb-2">{error}</p>
                          <Button onClick={fetchLeads} variant="outline">
                            Retry
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('name')}
                            >
                              <div className="flex items-center gap-1">
                                Lead
                                {sortField === 'name' && (
                                  sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4" /> : <IconArrowDown className="h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('status')}
                            >
                              <div className="flex items-center gap-1">
                                Status
                                {sortField === 'status' && (
                                  sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4" /> : <IconArrowDown className="h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('priority')}
                            >
                              <div className="flex items-center gap-1">
                                Priority
                                {sortField === 'priority' && (
                                  sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4" /> : <IconArrowDown className="h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('created_at')}
                            >
                              <div className="flex items-center gap-1">
                                Created
                                {sortField === 'created_at' && (
                                  sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4" /> : <IconArrowDown className="h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leads.map((lead) => (
                            <TableRow 
                              key={lead.id} 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleLeadClick(lead)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {getInitials(lead.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{lead.name}</div>
                                    {lead.source && (
                                      <div className="text-sm text-muted-foreground">via {lead.source}</div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {lead.company ? (
                                  <div className="flex items-center gap-2">
                                    <IconBuilding className="h-4 w-4 text-muted-foreground" />
                                    <span>{lead.company}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <IconMail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{lead.email}</span>
                                  </div>
                                  {lead.phone && (
                                    <div className="flex items-center gap-2">
                                      <IconPhone className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">{lead.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(lead.status)}>
                                  {lead.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getPriorityColor(lead.priority)}>
                                  {lead.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(lead.created_at)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}

                    {!loading && !error && leads.length === 0 && (
                      <div className="text-center py-12">
                        <IconUser className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No leads found</h3>
                        <p className="text-muted-foreground mb-4">
                          {search || statusFilter !== 'all' 
                            ? 'Try adjusting your search or filter criteria.' 
                            : 'Get started by adding your first lead.'
                          }
                        </p>
                        {!search && statusFilter === 'all' && (
                          <Button onClick={handleCreateLead}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Lead
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      <LeadsDetailModal 
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        isLoading={loading}
      />

      <LeadsDetailModal 
        lead={null}
        isOpen={isCreateModalOpen}
        onClose={handleCreateModalClose}
        isLoading={false}
        isCreate={true}
      />
    </>
  )
}
