"use client"

import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Search, 
  Star, 
  Filter,
  Users,
  Mail
} from "lucide-react"

// Types
interface TalentPoolEntry {
  id: number
  applicant_id: string
  interested_clients: number[]
  last_contact_date: string | null
  created_at: string
  updated_at: string
  // Enriched from BPOC users table
  applicant_name?: string | null
  applicant_email?: string | null
  applicant_avatar?: string | null
  // Enriched from BPOC resumes_generated table
  applicant_skills?: string[]
  applicant_summary?: string
  comment: {
    id: number
    text: string
    type: string
    created_by: number | null
    created_at: string
    creator: {
      email: string | null
      user_type: string | null
    }
  }
  applicant: {
    applicant_id: string
    resume_slug: string | null
    status: string
    video_introduction_url: string | null
    current_salary: number | null
    expected_monthly_salary: number | null
    shift: string | null
    position: number
    job_ids: number[]
    bpoc_application_ids: string[]
    created_at: string
  }
}







export default function TalentPoolPage() {
  const [talentPool, setTalentPool] = useState<TalentPoolEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sortBy, setSortBy] = useState("newest")

  // Helper function to get status badge styling
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'hired':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
      case 'passed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
      case 'withdrawn':
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
      case 'verified':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
      case 'qualified':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
      case 'initial interview':
      case 'final interview':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'
      case 'for verification':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100'
      case 'not qualified':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
      case 'submitted':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    }
  }

  // Filter and sort talent pool entries
  const filteredTalents = useMemo(() => {
    let filtered = talentPool.filter(entry => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = (
        entry.applicant_id.toLowerCase().includes(searchLower) ||
        (entry.applicant_name || '').toLowerCase().includes(searchLower) ||
        (entry.applicant_email || '').toLowerCase().includes(searchLower) ||
        entry.applicant.status.toLowerCase().includes(searchLower) ||
        (entry.comment?.text || '').toLowerCase().includes(searchLower)
      )
      
      const matchesStatus = !statusFilter || entry.applicant.status === statusFilter
      
      return matchesSearch && matchesStatus
    })

    // Sort entries
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "salary-high":
          return (b.applicant.expected_monthly_salary || 0) - (a.applicant.expected_monthly_salary || 0)
        case "salary-low":
          return (a.applicant.expected_monthly_salary || 0) - (b.applicant.expected_monthly_salary || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [talentPool, searchQuery, statusFilter, sortBy])

  // Fetch talent pool data from database
  useEffect(() => {
    const fetchTalentPool = async () => {
      try {
        setLoading(true)
        console.log('🎯 Fetching talent pool data...')
        
        const response = await fetch('/api/talent-pool')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch talent pool: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success) {
          setTalentPool(result.data)
          console.log(`✅ Loaded ${result.data.length} talent pool entries`)
        } else {
          throw new Error(result.error || 'Failed to fetch talent pool')
        }
        
      } catch (err) {
        console.error('❌ Error fetching talent pool:', err)
        setError(err instanceof Error ? err.message : 'Failed to load talent pool')
      } finally {
        setLoading(false)
      }
    }

    fetchTalentPool()
  }, [])



  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-x-auto">
        <AppHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex-1 flex-col gap-2 @container/main">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Talent Pool</h1>
                    <p className="text-sm text-muted-foreground">
                      Discover and connect with top freelancers and professionals.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {filteredTalents.length} talents
                    </Badge>
                  </div>
                </div>
                
                {/* Search and Filters */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by applicant ID, status, or comments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="for verification">For Verification</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="initial interview">Initial Interview</SelectItem>
                        <SelectItem value="final interview">Final Interview</SelectItem>
                        <SelectItem value="not qualified">Not Qualified</SelectItem>
                        <SelectItem value="passed">Passed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="salary-high">Highest Salary</SelectItem>
                        <SelectItem value="salary-low">Lowest Salary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Results Count and Clear Filters */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {filteredTalents.length} talent{filteredTalents.length !== 1 ? 's' : ''} found
                    {statusFilter && ` with status "${statusFilter}"`}
                  </p>
                  {(statusFilter || searchQuery) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStatusFilter("")
                        setSearchQuery("")
                      }}
                      className="text-xs h-7"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Loading State */}
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="rounded-xl">
                        <CardHeader className="pb-4">
                          <div className="flex items-start gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-5 w-3/4" />
                              <Skeleton className="h-4 w-1/2" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                          <Skeleton className="h-16 w-full" />
                          <div className="flex flex-wrap gap-1">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-14" />
                          </div>
                          <Skeleton className="h-10 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : error ? (

                  <div className="text-center py-12">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
                      <h3 className="text-lg font-medium text-destructive mb-2">Error Loading Talent Pool</h3>
                      <p className="text-sm text-muted-foreground mb-4">{error}</p>
                      <Button 
                        variant="outline" 
                        onClick={() => window.location.reload()}
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : filteredTalents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Users className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No talents found</h3>
                    <p className="text-sm">Try adjusting your search or filters</p>
                </div>
                ) : (



                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTalents.map((entry) => (
                      <Card
                        key={entry.id}
                        className="rounded-xl flex flex-col hover:shadow-lg transition-shadow"
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12">
                                {entry.applicant_avatar ? (
                                  <AvatarImage src={entry.applicant_avatar} alt={entry.applicant_name || 'Applicant'} />
                                ) : null}
                                <AvatarFallback>
                                  {(entry.applicant_name || entry.applicant_id)
                                    .split(' ')
                                    .map((n: string) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg leading-tight truncate">
                                  {entry.applicant_name || `Applicant ${entry.applicant_id.slice(0, 8)}...`}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge 
                                    className={`text-xs font-medium ${getStatusBadgeStyle(entry.applicant.status)}`}
                                  >
                                    {entry.applicant.status.replace(/\b\w/g, l => l.toUpperCase())}
                                  </Badge>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-medium">4.8</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <span className="text-green-600 font-bold">₱</span>
                              <span className="font-bold text-base">
                                {entry.applicant.expected_monthly_salary?.toLocaleString() || 'N/A'}
                              </span>
                              <span className="text-muted-foreground text-xs"> /month</span>
                            </div>
                            </div>
                          </CardHeader>
                        <CardContent className="flex flex-col justify-between min-h-0 flex-1">
                          <div className="space-y-4">
                            {/* Status and Description */}
                            <div className="space-y-2">
                              {/* Summary from BPOC */}
                              {entry.applicant_summary && (
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                    {entry.applicant_summary}
                                  </p>
                                </div>
                              )}
                              
                              {entry.applicant_email && (
                                <div className="flex items-center gap-2 text-sm text-foreground">
                                  <Mail className="h-4 w-4" />
                                  <span className="truncate">{entry.applicant_email}</span>
                                </div>
                              )}
                            </div>
                            
                                                        {/* Skills/Info */}
                            <div className="flex flex-wrap gap-2">
                              {entry.applicant.shift && (
                                <Badge className="text-xs bg-gray-200 text-black dark:bg-zinc-800 dark:text-white border-0">
                                  {entry.applicant.shift}
                                </Badge>
                              )}
                              {entry.interested_clients.length > 0 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="text-xs bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200 border-0 cursor-pointer">
                                        {entry.interested_clients.length} Client{entry.interested_clients.length !== 1 ? 's' : ''}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-sm">
                                        Interested Clients: {entry.interested_clients.join(', ')}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>

                            {/* Skills from BPOC resumes_generated */}
                            {entry.applicant_skills && entry.applicant_skills.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-foreground">Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                  {entry.applicant_skills.slice(0, 8).map((skill: string, index: number) => (
                                    <Badge key={index} className="text-xs bg-gray-200 text-black dark:bg-zinc-800 dark:text-white border-0">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {entry.applicant_skills.length > 8 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                          <Badge className="text-xs bg-gray-200 text-black dark:bg-zinc-800 dark:text-white border-0 cursor-pointer">
                                            +{entry.applicant_skills.length - 8} more
                                          </Badge>
                              </TooltipTrigger>
                                        <TooltipContent className="max-w-xs text-center">
                                          <div className="flex flex-wrap gap-2 justify-center">
                                            {entry.applicant_skills.slice(8).map((skill: string, index: number) => (
                                              <Badge key={index + 8} className="text-xs bg-gray-200 text-black dark:bg-zinc-800 dark:text-white border-0">
                                            {skill}
                                    </Badge>
                                        ))}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                            <Button 
                            variant="default" 
                            className="w-full text-sm h-9 rounded-lg shadow-none mt-4"
                          >
                            See Profile
                                    </Button>
                      </CardContent>
                    </Card>
                  ))}
                  </div>
                )}




              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}
