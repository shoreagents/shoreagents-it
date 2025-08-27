"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import { ApplicantsDetailModal } from "@/components/modals/applicants-detail-modal"
import { useRealtimeApplicants } from "@/hooks/use-realtime-applicants"
import { 
  Search, 
  Star, 
  MapPin, 
  Briefcase, 
  Filter,
  Users,
  DollarSign,
  Mail,
  Phone,
  AlertCircle
} from "lucide-react"

// Use the same Applicant interface as BPOC applicants page
type ApplicantStatus = 'submitted' | 'qualified' | 'for verification' | 'verified' | 'initial interview' | 'final interview' | 'not qualified' | 'not qualifies' | 'passed'

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
  // Additional fields from recruits table
  bpoc_application_ids?: string[] | null
  applicant_id?: string | null
  job_ids?: number[] | null
  resume_slug_recruits?: string | null
  status_recruits?: string | null
  created_at_recruits?: string | null
  updated_at_recruits?: string | null
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

const categories = ["All", "Design", "Marketing", "Development", "Science", "Writing"]

export default function TalentPoolPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortBy, setSortBy] = useState("rating")
  const [selectedTalent, setSelectedTalent] = useState<Applicant | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Data mapping function (same as BPOC applicants page)
  const mapApplicantData = useCallback((rawData: any): Applicant => {
    const applicant = rawData.applicant || {}
    const skills = Array.isArray(rawData.applicant_skills) ? rawData.applicant_skills : []
    const expected = Number(rawData.expected_monthly_salary ?? 0)
    
    console.log('🔍 Talent Pool: Mapping applicant data:', {
      rawData: {
        id: rawData.id,
        shift: rawData.shift,
        current_salary: rawData.current_salary,
        expected_monthly_salary: rawData.expected_monthly_salary,
        video_introduction_url: rawData.video_introduction_url
      },
      mapped: {
        shift: rawData.shift || null,
        current_salary: rawData.current_salary || null,
        expected_monthly_salary: isFinite(expected) ? expected : null
      }
    })
    
    return {
      id: String(rawData.id ?? rawData.applicant_id ?? crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
      ticket_id: rawData.ticket_id || '',
      user_id: rawData.user_id || '',
      resume_slug: rawData.resume_slug || null,
      concern: rawData.concern || '',
      details: rawData.details || null,
      category: rawData.category || '',
      category_id: rawData.category_id || null,
      category_name: rawData.category_name || '',
      status: (rawData.status as ApplicantStatus) || 'submitted',
      position: rawData.position || 0,
      resolved_by: rawData.resolved_by || null,
      resolved_at: rawData.resolved_at || null,
      created_at: rawData.created_at || '',
      updated_at: rawData.updated_at || '',
      role_id: rawData.role_id || null,
      station_id: rawData.station_id || null,
      profile_picture: rawData.profile_picture || null,
      first_name: rawData.first_name || null,
      last_name: rawData.last_name || null,
      full_name: rawData.full_name || null,
      employee_id: rawData.employee_id || null,
      resolver_first_name: rawData.resolver_first_name || null,
      resolver_last_name: rawData.resolver_last_name || null,
      user_type: rawData.user_type || null,
      member_name: rawData.member_name || null,
      member_color: rawData.member_color || null,
      job_title: rawData.job_title || null,
      company_name: rawData.company_name || null,
      bpoc_application_ids: rawData.bpoc_application_ids || null,
      applicant_id: rawData.applicant_id || null,
      job_ids: rawData.job_ids || null,
      resume_slug_recruits: rawData.resume_slug_recruits || null,
      status_recruits: rawData.status_recruits || null,
      created_at_recruits: rawData.created_at_recruits || null,
      updated_at_recruits: rawData.updated_at_recruits || null,
      video_introduction_url: rawData.video_introduction_url || null,
      current_salary: rawData.current_salary || null,
      expected_monthly_salary: isFinite(expected) ? expected : null,
      shift: rawData.shift || null,
      all_job_titles: rawData.all_job_titles || [],
      all_companies: rawData.all_companies || [],
      all_job_statuses: rawData.all_job_statuses || [],
      all_job_timestamps: rawData.all_job_timestamps || [],
      skills,
      originalSkillsData: rawData.originalSkillsData || null,
      summary: rawData.summary || null,
      email: rawData.email || null,
      phone: rawData.phone || null,
      address: rawData.address || null,
      aiAnalysis: rawData.aiAnalysis || null,
    }
  }, [])

  // Data enrichment function (same as BPOC applicants page)
  const enrichApplicantData = useCallback(async (rawData: any): Promise<any> => {
    try {
      console.log('🔍 Talent Pool: Enriching applicant data:', { id: rawData.id, type: typeof rawData.id })
      
      // Fetch enrichment data from the API for this specific applicant
      const response = await fetch(`/api/bpoc?id=${rawData.id}`)
      if (response.ok) {
        const enrichedData = await response.json()
        console.log('🔍 Talent Pool: Enrichment API response:', { count: enrichedData.length, ids: enrichedData.map((a: any) => a.id) })
        
        // Find the matching applicant in the enriched data
        const enriched = enrichedData.find((app: any) => {
          const match = String(app.id) === String(rawData.id)
          console.log(`🔍 Talent Pool: Enrichment ID comparison: "${app.id}" === "${rawData.id}" = ${match}`)
          return match
        })
        
        if (enriched) {
          console.log('🔍 Talent Pool: Found enriched data:', enriched)
          return enriched
        } else {
          console.log('🔍 Talent Pool: No enriched data found, returning original')
        }
      } else {
        console.warn('⚠️ Talent Pool: Enrichment API failed:', response.status, response.statusText)
      }
    } catch (error) {
      console.warn('⚠️ Talent Pool: Failed to enrich real-time data:', error)
    }
    // Return original data if enrichment fails
    return rawData
  }, [])

  // Real-time updates for BPOC applications (same as BPOC applicants page)
  const { isConnected: isRealtimeConnected } = useRealtimeApplicants({
    onApplicantCreated: async (newApplicant) => {
      console.log('🆕 Talent Pool Real-time: New applicant created:', newApplicant)
      // Enrich and map the raw data to Applicant format
      const enrichedData = await enrichApplicantData(newApplicant)
      const mappedApplicant = mapApplicantData(enrichedData)
      console.log('🆕 Talent Pool: Mapped new applicant:', mappedApplicant)
      
      setApplicants(prev => {
        console.log('🆕 Talent Pool: Adding new applicant to state. Previous count:', prev.length)
        const updated = [...prev, mappedApplicant]
        console.log('🆕 Talent Pool: New count:', updated.length)
        return updated
      })
    },
    onApplicantUpdated: async (updatedApplicant, oldApplicant) => {
      console.log('📝 Talent Pool Real-time: Applicant updated:', updatedApplicant, 'Old:', oldApplicant)
      console.log('📝 Talent Pool: Current applicants in state:', applicants.map(a => ({ id: a.id, type: typeof a.id })))
      console.log('📝 Talent Pool: Updated applicant ID:', { id: updatedApplicant.id, type: typeof updatedApplicant.id })
      
      // Enrich and map the raw data to Applicant format
      const enrichedData = await enrichApplicantData(updatedApplicant)
      const mappedApplicant = mapApplicantData(enrichedData)
      console.log('📝 Talent Pool: Mapped updated applicant:', mappedApplicant)
      
      setApplicants(prev => {
        const updated = prev.map(applicant => {
          const match = String(applicant.id) === String(updatedApplicant.id)
          console.log(`📝 Talent Pool: Comparing IDs: "${applicant.id}" (${typeof applicant.id}) === "${updatedApplicant.id}" (${typeof updatedApplicant.id}) = ${match}`)
          return match ? mappedApplicant : applicant
        })
        console.log('📝 Talent Pool: Updated applicants state:', updated.length)
        return updated
      })
      
      // Also update selectedTalent if the modal is open for this applicant
      if (selectedTalent && String(selectedTalent.id) === String(updatedApplicant.id)) {
        console.log('📝 Talent Pool: Updating selectedTalent for modal realtime update')
        const enrichedData = await enrichApplicantData(updatedApplicant)
        const mappedApplicant = mapApplicantData(enrichedData)
        setSelectedTalent(mappedApplicant)
      }
    },
    onApplicantDeleted: (deletedApplicant) => {
      console.log('🗑️ Talent Pool Real-time: Applicant deleted:', deletedApplicant)
      // Remove applicant from the list
      setApplicants(prev => prev.filter(applicant => applicant.id !== deletedApplicant.id))
      
      // Also close modal if the deleted applicant was selected
      if (selectedTalent && String(selectedTalent.id) === String(deletedApplicant.id)) {
        console.log('🗑️ Talent Pool: Closing modal for deleted applicant')
        setSelectedTalent(null)
        setIsModalOpen(false)
      }
    }
  })

  console.log('🔍 Talent Pool: Realtime connection status:', { isRealtimeConnected })
  
  // Debug: Log when applicants state changes
  useEffect(() => {
    console.log('🔍 Talent Pool: Applicants state changed:', { count: applicants.length, ids: applicants.map(a => a.id) })
    
    // If modal is open and we have a selected talent, ensure it has the latest data
    if (isModalOpen && selectedTalent) {
      const latestTalent = applicants.find(app => String(app.id) === String(selectedTalent.id))
      if (latestTalent && latestTalent !== selectedTalent) {
        console.log('🔍 Talent Pool: Updating selectedTalent with latest data from applicants state')
        setSelectedTalent(latestTalent)
      }
    }
  }, [applicants, isModalOpen, selectedTalent])

  // Load BPOC applications from main database (bpoc_recruits table) - same as BPOC applicants page
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
      
      // Map BPOC applications from main database into board items with proper status mapping
      const mapped: Applicant[] = data.map((a) => mapApplicantData(a))
      setApplicants(mapped)
    } catch (e: any) {
      setError(e?.message || 'Failed to load applicants')
    } finally {
      setLoading(false)
    }
  }, [mapApplicantData])

  useEffect(() => {
    fetchApplicants()
  }, [fetchApplicants])

  // Filter and sort applicants based on search and category
  const filteredApplicants = useMemo(() => {
    let filtered = applicants

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(applicant => 
        applicant.full_name?.toLowerCase().includes(query) ||
        applicant.job_title?.toLowerCase().includes(query) ||
        applicant.company_name?.toLowerCase().includes(query) ||
        applicant.skills?.some(skill => skill.toLowerCase().includes(query)) ||
        applicant.summary?.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter(applicant => 
        applicant.category?.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.aiAnalysis?.overall_score || 0) - (a.aiAnalysis?.overall_score || 0)
        case "salary":
          return (b.expected_monthly_salary || 0) - (a.expected_monthly_salary || 0)
        case "experience":
          return (b.all_job_titles?.length || 0) - (a.all_job_titles?.length || 0)
        case "name":
          return (a.full_name || '').localeCompare(b.full_name || '')
        default:
          return 0
      }
    })

    return filtered
  }, [applicants, searchQuery, selectedCategory, sortBy])

  const handleTalentClick = (talent: Applicant) => {
    console.log('🔍 Talent Pool: Opening modal for talent:', { id: talent.id, name: talent.full_name })
    // Ensure we have the latest data from the applicants state
    const latestTalent = applicants.find(app => String(app.id) === String(talent.id))
    if (latestTalent) {
      console.log('🔍 Talent Pool: Using latest talent data for modal:', latestTalent)
      setSelectedTalent(latestTalent)
    } else {
      console.log('🔍 Talent Pool: Using original talent data for modal:', talent)
      setSelectedTalent(talent)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTalent(null)
  }

  // Handle status updates (same as BPOC applicants page)
  const handleStatusUpdate = useCallback(async (applicantId: string, jobIndex: number, newStatus: string) => {
    try {
      console.log('🔄 Updating applicant status:', { applicantId, jobIndex, newStatus })
      
      const response = await fetch('/api/bpoc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: applicantId, status: newStatus })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update status')
      }
      
      // Update local state
      setApplicants(prev => prev.map(applicant => 
        applicant.id === applicantId 
          ? { ...applicant, status: newStatus as ApplicantStatus }
          : applicant
      ))
      
      // Also update selectedTalent if the modal is open for this applicant
      if (selectedTalent && String(selectedTalent.id) === String(applicantId)) {
        console.log('🔄 Updating selectedTalent status in modal')
        setSelectedTalent(prev => prev ? { ...prev, status: newStatus as ApplicantStatus } : null)
      }
      
      console.log('✅ Status updated successfully')
    } catch (error) {
      console.error('❌ Failed to update status:', error)
      // You could add a toast notification here
    }
  }, [])

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
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
                    <Badge className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {(applicants?.length ?? 0)} talents
                    </Badge>
                    {isRealtimeConnected && (
                      <Badge variant="secondary" className="flex items-center gap-1 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Live
                      </Badge>
                    )}
                    {/* Debug button to test realtime updates */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (applicants.length > 0) {
                          const firstApplicant = applicants[0]
                          console.log('🧪 Test: Manually updating first applicant status for realtime test')
                          handleStatusUpdate(firstApplicant.id, 0, 'qualified')
                        }
                      }}
                      className="text-xs"
                    >
                      Test Realtime
                    </Button>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, skills, or title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rating">Top Rated</SelectItem>
                        <SelectItem value="salary">Highest Salary</SelectItem>
                        <SelectItem value="experience">Most Experience</SelectItem>
                        <SelectItem value="name">Name A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Error loading talents:</span>
                      <span>{error}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={fetchApplicants}
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Left Column - Talent Grid */}
                  <div className="lg:col-span-3">
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
                    ) : (!Array.isArray(filteredApplicants) || filteredApplicants.length === 0) ? (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Users className="h-12 w-12 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No talents found</h3>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(Array.isArray(filteredApplicants) ? filteredApplicants : []).map((talent: Applicant) => (
                          <Card
                            key={talent.id}
                            className="rounded-xl flex flex-col"
                          >
                            <CardHeader className="pb-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={talent.profile_picture || ""} alt={talent.full_name || "Talent"} />
                                    <AvatarFallback>
                                      {talent.full_name ? talent.full_name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg leading-tight">
                                      {talent.full_name || talent.job_title || "Talent"}
                                    </h3>
                                    <div className="flex items-center gap-1 mt-1">
                                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                      <span className="text-sm font-medium">{talent.aiAnalysis?.overall_score || 0}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                  <span className="text-green-600 font-bold">₱</span>
                                  <span className="font-bold text-base">{talent.expected_monthly_salary || 0}</span>
                                  <span className="text-muted-foreground text-xs"> /month</span>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="flex flex-col justify-between min-h-0 flex-1">

                              <div className="space-y-4 flex-1">
                                {/* Description */}
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                  {talent.summary || 'No description available'}
                                </p>
                                
                                {/* Skills */}
                                <div className="flex flex-wrap gap-2">
                                  {(() => {
                                    // Use the same skills logic as the modal
                                    const originalSkillsData = talent.originalSkillsData
                                    
                                    // First priority: Check if we have structured skills data with categories
                                    if (originalSkillsData && typeof originalSkillsData === 'object' && !Array.isArray(originalSkillsData)) {
                                      if (originalSkillsData.skills && typeof originalSkillsData.skills === 'object') {
                                        // We have categorized skills - combine them for a better overview
                                        const skillsCategories = originalSkillsData.skills
                                        const validCategories = Object.keys(skillsCategories).filter(cat =>
                                          Array.isArray(skillsCategories[cat]) && skillsCategories[cat].length > 0
                                        )
                                        
                                        if (validCategories.length > 0) {
                                          // Combine skills from multiple categories for better representation
                                          let allSkills: string[] = []
                                          
                                          // Priority order: technical skills first, then others
                                          const priorityOrder = ['technical_skills', 'hard_skills', 'programming_skills', 'soft_skills', 'languages']
                                          const sortedCategories = validCategories.sort((a, b) => {
                                            const aIndex = priorityOrder.indexOf(a)
                                            const bIndex = priorityOrder.indexOf(b)
                                            if (aIndex === -1 && bIndex === -1) return 0
                                            if (aIndex === -1) return 1
                                            if (bIndex === -1) return -1
                                            return aIndex - bIndex
                                          })
                                          
                                          // Collect skills from all categories
                                          sortedCategories.forEach(category => {
                                            const categorySkills = skillsCategories[category]
                                            if (Array.isArray(categorySkills)) {
                                              allSkills.push(...categorySkills)
                                            }
                                          })
                                          
                                          // Remove duplicates (no maximum limit)
                                          allSkills = [...new Set(allSkills)]
                                          
                                          if (allSkills.length > 0) {
                                            return (
                                              <>
                                                {allSkills.slice(0, 8).map((skill: string, index: number) => (
                                                  <Badge key={index} className="text-xs">
                                                    {skill}
                                                  </Badge>
                                                ))}
                                                {allSkills.length > 8 && (
                                                  <TooltipProvider>
                                                    <Tooltip>
                                                      <TooltipTrigger asChild>
                                                        <Badge className="text-xs cursor-pointer hover:opacity-80 transition-colors">
                                                          +{allSkills.length - 8} more
                                                        </Badge>
                                                      </TooltipTrigger>
                                                      <TooltipContent side="top" className="p-3 max-w-xs">
                                                        <div className="text-center">
                                                          <div className="flex flex-wrap gap-2 justify-center">
                                                            {allSkills.slice(8).map((skill: string, index: number) => (
                                                              <Badge key={index + 8} className="text-xs">
                                                                {skill}
                                                              </Badge>
                                                            ))}
                                                          </div>
                                                        </div>
                                                      </TooltipContent>
                                                    </Tooltip>
                                                  </TooltipProvider>
                                                )}
                                              </>
                                            )
                                          }
                                        }
                                      }
                                      
                                      // Fallback: Look for individual skills arrays
                                      const skillsData = originalSkillsData.skills || originalSkillsData.technical_skills || originalSkillsData.soft_skills || originalSkillsData.languages
                                      if (skillsData && Array.isArray(skillsData) && skillsData.length > 0) {
                                        return (
                                          <>
                                            {skillsData.slice(0, 8).map((skill: string, index: number) => (
                                              <Badge key={index} className="text-xs">
                                                {skill}
                                              </Badge>
                                            ))}
                                            {skillsData.length > 8 && (
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Badge className="text-xs cursor-pointer hover:opacity-80 transition-colors">
                                                      +{skillsData.length - 8} more
                                                    </Badge>
                                                  </TooltipTrigger>
                                                  <TooltipContent side="top" className="p-3 max-w-xs">
                                                    <div className="text-center">
                                                      <div className="flex flex-wrap gap-2 justify-center">
                                                        {skillsData.slice(8).map((skill: string, index: number) => (
                                                          <Badge key={index + 8} className="text-xs">
                                                            {skill}
                                                          </Badge>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            )}
                                          </>
                                        )
                                      }
                                      
                                      // If no skills array found, try to find any array data that might be skills
                                      const arrayKeys = Object.keys(originalSkillsData).filter(key =>
                                        Array.isArray(originalSkillsData[key]) &&
                                        originalSkillsData[key].length > 0 &&
                                        typeof originalSkillsData[key][0] === 'string'
                                      )
                                      
                                      if (arrayKeys.length > 0) {
                                        const skills = originalSkillsData[arrayKeys[0]]
                                        return (
                                          <>
                                            {skills.slice(0, 8).map((skill: string, index: number) => (
                                              <Badge key={index} className="text-xs">
                                                {skill}
                                              </Badge>
                                            ))}
                                            {skills.length > 8 && (
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Badge className="text-xs cursor-pointer hover:opacity-80 transition-colors">
                                                      +{skills.length - 8} more
                                                    </Badge>
                                                  </TooltipTrigger>
                                                  <TooltipContent side="top" className="p-3 max-w-xs">
                                                    <div className="text-center">
                                                      <div className="flex flex-wrap gap-2 justify-center">
                                                        {skills.slice(8).map((skill: string, index: number) => (
                                                          <Badge key={index + 8} className="text-xs">
                                                            {skill}
                                                          </Badge>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            )}
                                          </>
                                        )
                                      }
                                    }
                                    
                                    // Second priority: Use the extracted skills array if no structured data found
                                    if (Array.isArray(talent.skills) && talent.skills.length > 0) {
                                      return (
                                        <>
                                          {talent.skills.slice(0, 8).map((skill: string, index: number) => (
                                            <Badge key={index} className="text-xs">
                                              {skill}
                                            </Badge>
                                          ))}
                                          {talent.skills.length > 8 && (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Badge className="text-xs cursor-pointer hover:opacity-80 transition-colors">
                                                    +{talent.skills.length - 8} more
                                                  </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="p-3 max-w-xs">
                                                  <div className="text-center">
                                                    <div className="flex flex-wrap gap-2 justify-center">
                                                      {talent.skills.slice(8).map((skill: string, index: number) => (
                                                        <Badge key={index + 8} className="text-xs">
                                                          {skill}
                                                        </Badge>
                                                      ))}
                                                    </div>
                                                  </div>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                        </>
                                      )
                                    }
                                    
                                    // No skills fallback
                                    return <span className="text-xs text-muted-foreground">No skills data available</span>
                                  })()}
                                </div>

                              </div>

                              {/* Separator */}
                              <div className="border-t border-border/50 my-3"></div>

                              {/* Contact Information - Always at bottom */}
                              <div className="space-y-1 mt-auto">
                                <div className="flex items-center gap-2 text-sm text-foreground">
                                  <Mail className="h-4 w-4" />
                                  <span className="truncate">{talent.email || <span className="text-muted-foreground">Not Specified</span>}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-foreground">
                                  <Phone className="h-4 w-4" />
                                  <span className="truncate">{talent.phone || <span className="text-muted-foreground">Not Specified</span>}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-foreground">
                                  <MapPin className="h-4 w-4" />
                                  <span className="truncate">{talent.address || <span className="text-muted-foreground">Not Specified</span>}</span>
                                </div>
                              </div>

                              {/* Action Button */}
                              <Button 
                                variant="default" 
                                className="w-full text-sm h-9 rounded-lg shadow-none mt-4"
                                onClick={() => handleTalentClick(talent)}
                              >
                                See Profile
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column - AI Assistant */}
                  <div className="lg:col-span-1">
                    <Card className="rounded-xl sticky top-6">
                      <CardHeader>
                        <h3 className="text-lg font-semibold">AI Assistant</h3>
                        <p className="text-sm text-muted-foreground">
                          Get help finding the perfect talent
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <h4 className="font-medium mb-2">Smart Talent Matching</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Describe your project requirements and let AI find the best candidates
                          </p>
                          <Button className="w-full" size="sm">
                            Start AI Search
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      
      {/* Talent Detail Modal */}
      <ApplicantsDetailModal
        applicant={selectedTalent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onStatusUpdate={handleStatusUpdate}
        pageContext="talent-pool"
      />
    </>
  )
}
