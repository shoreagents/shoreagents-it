"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

import { IconSearch, IconArrowUp, IconArrowDown, IconCalendar, IconClock } from "@tabler/icons-react"
import { Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { ApplicantsDetailModal } from "@/components/modals/applicants-detail-modal"
import { useRealtimeApplicants } from "@/hooks/use-realtime-applicants"
import { ReloadButton } from "@/components/ui/reload-button"

type ApplicantStatus = 'submitted' | 'qualified' | 'for verification' | 'verified' | 'initial interview' | 'final interview' | 'not qualified' | 'passed' | 'rejected' | 'withdrawn' | 'hired' | 'closed' | 'failed'

// Only show these specific statuses - defined outside component to prevent recreation
const ALLOWED_STATUSES: ApplicantStatus[] = ['failed', 'withdrawn', 'rejected', 'passed', 'hired']

interface Applicant {
  id: string
  ticket_id: string
  user_id: string
  resume_slug?: string | null
  concern: string
  details: string | null
  category: string
  category_id: number | null
  category_name?: string
  status: ApplicantStatus
  position: number
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  role_id: number | null
  station_id: string | null
  profile_picture: string | null
  first_name: string | null
  last_name: string | null
  full_name?: string | null
  employee_id: string | null
  resolver_first_name?: string | null
  resolver_last_name?: string | null
  user_type?: string | null
  member_name?: string | null
  member_color?: string | null
  job_title?: string | null
  company_name?: string | null
  user_position?: string | null
  // Additional fields from recruits table
  bpoc_application_ids?: string[] | null
  applicant_id?: string | null
  job_ids?: number[] | null
  video_introduction_url?: string | null
  current_salary?: number | null
  expected_monthly_salary?: number | null
  shift?: string | null
  // Arrays of all job information
  all_job_titles?: string[]
  all_companies?: string[]
  all_job_statuses?: string[]
  all_job_timestamps?: string[]
  // Skills data from BPOC database
  skills?: string[]
  originalSkillsData?: any
  // Summary from BPOC database
  summary?: string | null
  // Email from BPOC database
  email?: string | null
  // Phone and address from BPOC database
  phone?: string | null
  address?: string | null
  // AI analysis data from BPOC database
  aiAnalysis?: {
    overall_score?: number
    key_strengths?: any[]
    strengths_analysis?: any
    improvements?: any[]
    recommendations?: any[]
    improved_summary?: string
    salary_analysis?: any
    career_path?: any
    section_analysis?: any
  } | null
}

function ApplicantsTable({ applicants, onSort, sortField, sortDirection, onRowClick }: { 
  applicants: Applicant[]
  onSort: (field: string) => void
  sortField: string
  sortDirection: 'asc' | 'desc'
  onRowClick: (applicant: Applicant) => void
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' })
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' })
    return (
      <div className="flex items-center gap-1">
        <IconCalendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-muted-foreground">{dateStr}</span>
        <span className="text-muted-foreground/70">•</span>
        <IconClock className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{timeStr}</span>
      </div>
    )
  }

  const getStatusBadge = (status: ApplicantStatus) => {
    const getStatusColor = (status: ApplicantStatus | string) => {
      switch (status.toLowerCase()) {
        case "failed":
          return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
        case "withdrawn":
          return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
        case "rejected":
          return "text-rose-700 dark:text-white border-rose-600/20 bg-rose-50 dark:bg-rose-600/20"
        case "passed":
          return "text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20"
        case "hired":
          return "text-pink-700 dark:text-white border-pink-600/20 bg-pink-50 dark:bg-pink-600/20"
        default:
          return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
      }
    }
    
    return (
      <Badge variant="outline" className={`${getStatusColor(status)} px-2 py-0.5 text-xs font-medium rounded-md`}>
        {getStatusDisplayLabel(status)}
      </Badge>
    )
  }

  const getStatusDisplayLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'failed': 'Failed',
      'withdrawn': 'Withdrawn',
      'rejected': 'Rejected',
      'passed': 'For Sale',
      'hired': 'Hired'
    }
    return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  return (
    <div className="rounded-xl border overflow-x-auto bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
            <TableHead onClick={() => onSort('first_name')} className={`cursor-pointer hover:bg-accent dark:hover:bg-[#0f0f0f] transition-colors ${sortField === 'first_name' ? 'text-primary font-medium bg-accent/50' : ''}`}>
              <div className="flex items-center gap-1">Applicant <span className="w-4 h-4">{sortField === 'first_name' && (sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4 text-primary" /> : <IconArrowDown className="h-4 w-4 text-primary" />)}</span></div>
            </TableHead>
            <TableHead onClick={() => onSort('all_job_titles')} className={`cursor-pointer hover:bg-accent dark:hover:bg-[#0f0f0f] transition-colors ${sortField === 'all_job_titles' ? 'text-primary font-medium bg-accent/50' : ''}`}>
              <div className="flex items-center gap-1">Positions <span className="w-4 h-4">{sortField === 'all_job_titles' && (sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4 text-primary" /> : <IconArrowDown className="h-4 w-4 text-primary" />)}</span></div>
            </TableHead>
            <TableHead onClick={() => onSort('status')} className={`cursor-pointer hover:bg-accent dark:hover:bg-[#0f0f0f] transition-colors ${sortField === 'status' ? 'text-primary font-medium bg-accent/50' : ''}`}>
              <div className="flex items-center gap-1">Status <span className="w-4 h-4">{sortField === 'status' && (sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4 text-primary" /> : <IconArrowDown className="h-4 w-4 text-primary" />)}</span></div>
            </TableHead>
            <TableHead onClick={() => onSort('created_at')} className={`cursor-pointer hover:bg-accent dark:hover:bg-[#0f0f0f] transition-colors ${sortField === 'created_at' ? 'text-primary font-medium bg-accent/50' : ''}`}>
              <div className="flex items-center gap-1">Applied Date <span className="w-4 h-4">{sortField === 'created_at' && (sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4 text-primary" /> : <IconArrowDown className="h-4 w-4 text-primary" />)}</span></div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applicants.map((applicant) => (
            <TableRow 
              key={applicant.id} 
              className="cursor-pointer hover:bg-accent/50"
              onClick={() => onRowClick(applicant)}
            >

              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={applicant.profile_picture || ''} alt={`User ${applicant.user_id}`} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                      {applicant.first_name && applicant.last_name 
                        ? `${applicant.first_name[0]}${applicant.last_name[0]}`
                        : String(applicant.user_id).split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground">
                    {applicant.full_name || (applicant.first_name && applicant.last_name 
                      ? `${applicant.first_name} ${applicant.last_name}`
                      : `User ${applicant.user_id}`)}
                  </span>
                </div>
              </TableCell>


              <TableCell className="max-w-[200px] min-w-[180px]">
                {applicant.all_job_titles && applicant.all_job_titles.length > 0 ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="truncate">{applicant.all_job_titles[0]}</span>
                    {applicant.all_job_titles.length > 1 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-muted/50 text-muted-foreground border-muted-foreground/30 flex-shrink-0 cursor-pointer">
                              <Plus className="h-3 w-3 mr-1" />
                              {applicant.all_job_titles.length - 1} More
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="text-sm">
                              <div className="space-y-1">
                                {applicant.all_job_titles.slice(1).map((title, index) => (
                                  <div key={index} className="text-xs text-muted-foreground">
                                    {index + 1}. {title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground/50">-</span>
                )}
              </TableCell>
              <TableCell>
                {getStatusBadge(applicant.status)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {applicant.created_at ? formatDate(applicant.created_at) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ApplicantsSkeleton() {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default function ApplicantsRecordsPage() {
  const { user } = useAuth()
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  

  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Helper function to map raw database records to Applicant objects
  const mapApplicantData = useCallback((rawData: any, index: number = 0): Applicant => ({
    id: rawData.id,
    ticket_id: rawData.resume_slug || rawData.id,
    user_id: rawData.user_id || rawData.applicant_id,
    resume_slug: rawData.resume_slug,
    concern: rawData.job_title ? `Applied for ${rawData.job_title}` : `Applied for Job #${rawData.job_id}`,
    details: null,
    category: 'Application',
    category_id: null,
    category_name: 'Application',
    status: rawData.status as ApplicantStatus,
    position: rawData.position || index,
    resolved_by: null,
    resolved_at: null,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at || rawData.created_at,
    role_id: null,
    station_id: null,
    profile_picture: rawData.profile_picture || null,
    first_name: rawData.first_name || null,
    last_name: rawData.last_name || null,
    full_name: rawData.full_name || null,
    employee_id: null,
    resolver_first_name: null,
    resolver_last_name: null,
    user_type: 'External',
    member_name: null,
    member_color: null,
    job_title: rawData.job_title || null,
    company_name: rawData.company_name || null,
    user_position: rawData.user_position || null,
    // Add recruits data fields
    bpoc_application_ids: rawData.bpoc_application_ids,
    applicant_id: rawData.applicant_id,
    job_ids: rawData.job_ids,
    video_introduction_url: rawData.video_introduction_url,
    current_salary: rawData.current_salary,
    expected_monthly_salary: rawData.expected_monthly_salary,
    shift: rawData.shift,
    // Arrays of all job information (from API enrichment)
    all_job_titles: rawData.all_job_titles,
    all_companies: rawData.all_companies,
    all_job_statuses: rawData.all_job_statuses,
    all_job_timestamps: rawData.all_job_timestamps,
             // Skills data from BPOC database
         skills: rawData.skills,
         originalSkillsData: rawData.originalSkillsData,
         // Summary from BPOC database
         summary: rawData.summary,
         // Email from BPOC database
         email: rawData.email,
         // Phone and address from BPOC database
         phone: rawData.phone,
         address: rawData.address,
         // AI analysis data from BPOC database
         aiAnalysis: rawData.aiAnalysis,
  }), [])

  // Real-time updates for BPOC applications
  const { } = useRealtimeApplicants({
    onApplicantCreated: async (newApplicant) => {
      console.log('🆕 Real-time: New applicant created:', newApplicant)
      console.log('🔍 New applicant data structure:', {
        id: newApplicant.id,
        applicant_id: newApplicant.applicant_id,
        resume_slug: newApplicant.resume_slug,
        status: newApplicant.status,
        type: typeof newApplicant.id
      })
      
      // Only add if status is in allowed statuses
      if (ALLOWED_STATUSES.includes(newApplicant.status?.toLowerCase() as ApplicantStatus)) {
        try {
          // Use the numeric ID from bpoc_recruits table, not the UUID applicant_id
          const recordId = newApplicant.id
          console.log('🔍 Fetching enriched data for new applicant with ID:', recordId)
          const res = await fetch(`/api/bpoc/${recordId}`)
          if (res.ok) {
            const enrichedData = await res.json()
            console.log('✅ Enriched data received:', enrichedData)
            const mappedApplicant = mapApplicantData(enrichedData)
            console.log('📋 Mapped applicant:', mappedApplicant)
            setApplicants(prev => [...prev, mappedApplicant])
          } else {
            // Fallback to basic data if enrichment fails
            console.warn('⚠️ Failed to fetch enriched data, using basic data')
            const mappedApplicant = mapApplicantData(newApplicant)
            setApplicants(prev => [...prev, mappedApplicant])
          }
        } catch (error) {
          console.warn('Failed to fetch enriched data for new applicant, using basic data:', error)
          const mappedApplicant = mapApplicantData(newApplicant)
          setApplicants(prev => [...prev, mappedApplicant])
        }
      }
    },
    onApplicantUpdated: async (updatedApplicant) => {
      console.log('📝 Real-time: Applicant updated:', updatedApplicant)
      console.log('🔍 Updated applicant data structure:', {
        id: updatedApplicant.id,
        applicant_id: updatedApplicant.applicant_id,
        resume_slug: updatedApplicant.resume_slug,
        status: updatedApplicant.status,
        type: typeof updatedApplicant.id
      })
      
      // If status changed to allowed status, add to list
      if (ALLOWED_STATUSES.includes(updatedApplicant.status?.toLowerCase() as ApplicantStatus)) {
        try {
          // Use the numeric ID from bpoc_recruits table, not the UUID applicant_id
          const recordId = updatedApplicant.id
          console.log('🔍 Fetching enriched data for updated applicant with ID:', recordId)
          const res = await fetch(`/api/bpoc/${recordId}`)
          if (res.ok) {
            const enrichedData = await res.json()
            console.log('✅ Enriched data received for update:', enrichedData)
            const mappedApplicant = mapApplicantData(enrichedData)
            console.log('📋 Mapped applicant for update:', mappedApplicant)
            
            setApplicants(prev => {
              const existing = prev.find(applicant => applicant.id === updatedApplicant.id)
              if (existing) {
                return prev.map(applicant => 
                  applicant.id === updatedApplicant.id ? mappedApplicant : applicant
                )
              } else {
                return [...prev, mappedApplicant]
              }
            })
          } else {
            // Fallback to basic data if enrichment fails
            console.warn('⚠️ Failed to fetch enriched data for update, using basic data')
            const mappedApplicant = mapApplicantData(updatedApplicant)
            setApplicants(prev => {
              const existing = prev.find(applicant => applicant.id === updatedApplicant.id)
              if (existing) {
                return prev.map(applicant => 
                  applicant.id === updatedApplicant.id ? mappedApplicant : applicant
                )
              } else {
                return [...prev, mappedApplicant]
              }
            })
          }
        } catch (error) {
          console.warn('Failed to fetch enriched data for updated applicant, using basic data:', error)
          const mappedApplicant = mapApplicantData(updatedApplicant)
          setApplicants(prev => {
            const existing = prev.find(applicant => applicant.id === updatedApplicant.id)
            if (existing) {
              return prev.map(applicant => 
                applicant.id === updatedApplicant.id ? mappedApplicant : applicant
              )
            } else {
              return [...prev, mappedApplicant]
            }
          })
        }
      } else {
        // If status changed to not allowed, remove from list
        setApplicants(prev => prev.filter(applicant => applicant.id !== updatedApplicant.id))
      }
    },
    onApplicantDeleted: (deletedApplicant) => {
      console.log('🗑️ Real-time: Applicant deleted:', deletedApplicant)
      setApplicants(prev => prev.filter(applicant => applicant.id !== deletedApplicant.id))
    }
  })

  // Load BPOC applications from main database (bpoc_recruits table)
  const fetchApplicants = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/bpoc')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to fetch applicants (${res.status})`)
      }
      const data: any[] = await res.json()
      
      // Filter applicants by allowed statuses only
      const filteredData = data.filter((item: any) => {
        const status = item.status?.toLowerCase()
        return ALLOWED_STATUSES.includes(status as ApplicantStatus)
      })
      
      // Map BPOC applications from main database into table items
      const mapped: Applicant[] = filteredData.map((a, index) => mapApplicantData(a))
      setApplicants(mapped)
      setTotalCount(mapped.length)
      setTotalPages(Math.ceil(mapped.length / itemsPerPage))
    } catch (e: any) {
      setError(e?.message || 'Failed to load applicants')
    } finally {
      setLoading(false)
    }
  }, [mapApplicantData])

  useEffect(() => {
    fetchApplicants()
  }, [fetchApplicants])

  // Auto-save new applications when page loads
  useEffect(() => {
    const autoSaveOnLoad = async () => {
      try {
        console.log('🔄 Auto-saving new applications on page load...')
        const response = await fetch('/api/bpoc/auto-save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const result = await response.json()
          console.log('📊 Auto-save result:', result)
          
          if (result.savedCount > 0) {
            console.log(`✅ Auto-saved ${result.savedCount} new applications on page load`)
            // Don't call fetchApplicants here to prevent infinite loop
            // The real-time updates will handle new data
          }
        }
      } catch (error) {
        console.warn('⚠️ Auto-save on page load failed, but continuing:', error)
      }
    }

    if (!loading) {
      autoSaveOnLoad()
    }
  }, [loading])

  useEffect(() => { setCurrentPage(1) }, [searchTerm, selectedStatus])

  // Removed the problematic useEffect that was causing infinite loops
  // Search and filtering now happens client-side only

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  const handleRowClick = (applicant: Applicant) => {
    setSelectedApplicant(applicant)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedApplicant(null)
  }

  // Filter applicants based on search and status
  const filteredApplicants = applicants.filter(applicant => {
    const matchesSearch = searchTerm === '' || 
      applicant.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.all_job_titles?.some(title => title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      applicant.all_companies?.some(company => company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      applicant.resume_slug?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || applicant.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  // Paginate filtered applicants
  const paginatedApplicants = filteredApplicants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const statusOptions = [
    { value: 'all', label: 'All Applicants' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' },
    { value: 'passed', label: 'For Sale' },
    { value: 'hired', label: 'Hired' },
    { value: 'failed', label: 'Failed' }
  ]

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col justify-between">
          <div className="@container/main flex flex-1 flex-col gap-2 justify-between">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 justify-between h-full">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">Records</h1>
                    <p className="text-sm text-muted-foreground">View and manage applicant records.</p>
                  </div>
                  <div className="flex gap-2">
                    <ReloadButton onReload={fetchApplicants} loading={loading} className="flex-1" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search applicants, positions, companies, or resume IDs..." 
                      className="pl-8" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                  </div>
                  <div className="w-48">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-[hsl(var(--sidebar-background))] rounded-lg border">
                    <div className="text-sm font-medium text-muted-foreground">Total Applicants:</div>
                    <div className="text-sm font-semibold text-sidebar-accent-foreground">{totalCount}</div>
                  </div>
                </div>
              </div>
              <div className="px-4 lg:px-6 flex-1 flex flex-col justify-between">
                {loading ? (
                  <ApplicantsSkeleton />
                ) : error ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <p className="text-red-600 mb-2">{error}</p>
                      <Button onClick={fetchApplicants} variant="outline">Retry</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {filteredApplicants.length > 0 ? (
                      <div className="flex flex-col justify-between h-full">
                        <div className="flex-1">
                          <ApplicantsTable 
                            applicants={paginatedApplicants} 
                            onSort={handleSort} 
                            sortField={sortField} 
                            sortDirection={sortDirection} 
                            onRowClick={handleRowClick} 
                          />
                        </div>
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between mt-6">
                            <div className="text-sm text-muted-foreground">
                              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredApplicants.length)} of {filteredApplicants.length} applicants
                            </div>
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    href="#" 
                                    onClick={(e) => { 
                                      e.preventDefault(); 
                                      setCurrentPage(prev => Math.max(prev - 1, 1)) 
                                    }} 
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} 
                                  />
                                </PaginationItem>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                  <PaginationItem key={page}>
                                    <PaginationLink 
                                      href="#" 
                                      onClick={(e) => { 
                                        e.preventDefault(); 
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
                                      e.preventDefault(); 
                                      setCurrentPage(prev => Math.min(prev + 1, totalPages)) 
                                    }} 
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""} 
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col h-[75vh]">
                        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 flex-1 flex items-center justify-center">
                          <div>
                            <p className="text-sm font-medium">No Applicants Found</p>
                            <p className="text-xs text-muted-foreground/70">
                              {searchTerm || selectedStatus !== 'all' 
                                ? 'No applicants match your search criteria' 
                                : 'No applicants available'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      
      <ApplicantsDetailModal 
        applicant={selectedApplicant}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        pageContext="applicants-records"
        onStatusUpdate={() => {
          // Real-time updates will handle status changes automatically
          // No need to manually refresh
        }}
      />
    </>
  )
}
