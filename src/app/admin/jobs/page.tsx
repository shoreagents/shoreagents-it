"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Search, 
  Filter, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Users,
  Building2,
  Calendar,
  Star,
  Plus
} from "lucide-react"

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary_min: number
  salary_max: number
  experience_level: string
  skills_required: string[]
  description: string
  status: string
  posted_date: string
  applications_count: number
  is_featured: boolean
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [locationFilter, setLocationFilter] = useState("all-locations")
  const [typeFilter, setTypeFilter] = useState("all-types")
  const [experienceFilter, setExperienceFilter] = useState("all-levels")
  const [statusFilter, setStatusFilter] = useState("all-status")

  // Mock data for demonstration
  useEffect(() => {
    const mockJobs: Job[] = [
      {
        id: "1",
        title: "Senior Frontend Developer",
        company: "TechCorp Solutions",
        location: "Manila, Philippines",
        type: "Full-time",
        salary_min: 80000,
        salary_max: 120000,
        experience_level: "Senior",
        skills_required: ["React", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL"],
        description: "We're looking for a Senior Frontend Developer to join our growing team and help build amazing user experiences.",
        status: "Active",
        posted_date: "2024-01-15",
        applications_count: 24,
        is_featured: true
      },
      {
        id: "2",
        title: "DevOps Engineer",
        company: "CloudTech Inc",
        location: "Cebu, Philippines",
        type: "Full-time",
        salary_min: 70000,
        salary_max: 100000,
        experience_level: "Mid-level",
        skills_required: ["Docker", "Kubernetes", "AWS", "Terraform", "Jenkins"],
        description: "Join our DevOps team to help scale our infrastructure and improve deployment processes.",
        status: "Active",
        posted_date: "2024-01-14",
        applications_count: 18,
        is_featured: false
      },
      {
        id: "3",
        title: "UI/UX Designer",
        company: "Creative Studio",
        location: "Makati, Philippines",
        type: "Contract",
        salary_min: 60000,
        salary_max: 90000,
        experience_level: "Mid-level",
        skills_required: ["Figma", "Adobe Creative Suite", "Prototyping", "User Research", "Design Systems"],
        description: "Create beautiful and intuitive user interfaces for our digital products.",
        status: "Active",
        posted_date: "2024-01-13",
        applications_count: 31,
        is_featured: true
      }
    ]

    setJobs(mockJobs)
    setFilteredJobs(mockJobs)
    setLoading(false)
  }, [])

  // Filter jobs based on search and filters
  useEffect(() => {
    let filtered = jobs

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.skills_required.some(skill => skill.toLowerCase().includes(query))
      )
    }

    if (locationFilter !== "all-locations") {
      filtered = filtered.filter(job => job.location === locationFilter)
    }

    if (typeFilter !== "all-types") {
      filtered = filtered.filter(job => job.type === typeFilter)
    }

    if (experienceFilter !== "all-levels") {
      filtered = filtered.filter(job => job.experience_level === experienceFilter)
    }

    if (statusFilter !== "all-status") {
      filtered = filtered.filter(job => job.status === statusFilter)
    }

    setFilteredJobs(filtered)
  }, [jobs, searchQuery, locationFilter, typeFilter, experienceFilter, statusFilter])

  const formatSalary = (min: number, max: number) => {
    return `₱${min.toLocaleString()} - ₱${max.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <>
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex flex-col items-start gap-4 py-4 sm:h-auto sm:flex-row sm:items-center sm:gap-8">
              <div className="flex items-center gap-2">
                <Briefcase className="h-6 w-6" />
                <h1 className="text-lg font-semibold">Jobs</h1>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
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
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex flex-col items-start gap-4 py-4 sm:h-auto sm:flex-row sm:items-center sm:gap-8">
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              <h1 className="text-lg font-semibold">Jobs</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Post New Job
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search jobs, companies, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-locations">All Locations</SelectItem>
                    <SelectItem value="Manila, Philippines">Manila</SelectItem>
                    <SelectItem value="Cebu, Philippines">Cebu</SelectItem>
                    <SelectItem value="Makati, Philippines">Makati</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-types">All Types</SelectItem>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-levels">All Levels</SelectItem>
                    <SelectItem value="Entry">Entry</SelectItem>
                    <SelectItem value="Mid-level">Mid-level</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-status">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Jobs Grid */}
          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Briefcase className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">No jobs found</h3>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className={`rounded-xl flex flex-col hover:shadow-lg transition-shadow ${
                    job.is_featured ? 'ring-2 ring-blue-500/20' : ''
                  }`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {job.company.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg leading-tight truncate">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground truncate">
                              {job.company}
                            </span>
                          </div>
                        </div>
                      </div>
                      {job.is_featured && (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col justify-between min-h-0 flex-1">
                    <div className="space-y-4">
                      {/* Job Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{job.type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="h-4 w-4" />
                          <span>{job.experience_level} Level</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Skills */}
                      {job.skills_required.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-foreground">Required Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {job.skills_required.slice(0, 6).map((skill, index) => (
                              <Badge key={index} className="text-xs bg-gray-200 text-black dark:bg-zinc-800 dark:text-white border-0">
                                {skill}
                              </Badge>
                            ))}
                            {job.skills_required.length > 6 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge className="text-xs bg-gray-200 text-black dark:bg-zinc-800 dark:text-white border-0 cursor-pointer">
                                      +{job.skills_required.length - 6} more
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs text-center">
                                    <div className="flex flex-wrap gap-2 justify-center">
                                      {job.skills_required.slice(6).map((skill, index) => (
                                        <Badge key={index + 6} className="text-xs bg-gray-200 text-black dark:bg-zinc-800 dark:text-white border-0">
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

                      {/* Job Meta */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>Posted {formatDate(job.posted_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          <span>{job.applications_count} applications</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="flex-1 text-sm h-9">
                        View Details
                      </Button>
                      <Button className="flex-1 text-sm h-9">
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}


