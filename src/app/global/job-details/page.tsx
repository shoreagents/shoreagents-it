"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { IconCalendar, IconClock, IconBuilding, IconCalendarTime, IconAlertCircle, IconBriefcase, IconArrowsMaximize, IconMaximize, IconAward, IconEye, IconUsers, IconId, IconCoins } from "@tabler/icons-react"
import { X } from "lucide-react"

interface JobDetailsPageProps {
  searchParams: {
    jobId?: string
    jobData?: string
  }
}

interface JobData {
  id: string | number
  job_title?: string
  title?: string
  company_name?: string
  company?: string
  status?: string
  work_arrangement?: string
  experience_level?: string
  shift?: string
  priority?: string
  industry?: string
  department?: string
  application_deadline?: string
  created_at?: string
  salary_min?: number
  salary_max?: number
  currency?: string
  salary_type?: string
  job_description?: string
  requirements?: string[]
  responsibilities?: string[]
  benefits?: string[]
  skills?: string[]
  views?: number
  applicants?: number
}

export default function JobDetailsPage({ searchParams }: JobDetailsPageProps) {
  const [jobData, setJobData] = useState<JobData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get job data from search params
    const jobId = searchParams.jobId || ""
    const jobDataParam = searchParams.jobData || ""
    
    if (jobDataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(jobDataParam))
        setJobData(parsedData)
      } catch (error) {
        console.error('Error parsing job data:', error)
      }
    }
    setLoading(false)
  }, [searchParams])

  const handleCloseWindow = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.closeCurrentWindow()
        .then((result: any) => {
          if (result.success) {
            console.log('Job details window closed successfully')
          } else {
            console.error('Failed to close job details window:', result.error)
            window.close()
          }
        })
        .catch((error: any) => {
          console.error('Error closing job details window:', error)
          window.close()
        })
    } else {
      window.close()
    }
  }

  const handleMaximizeWindow = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.maximizeWindow()
        .then((result: any) => {
          if (result.success) {
            console.log('Window maximized successfully')
          } else {
            console.error('Failed to maximize window:', result.error)
          }
        })
        .catch((error: any) => {
          console.error('Error maximizing window:', error)
        })
    }
  }

  const handleMinimizeWindow = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      // For minimize, we can use the browser's minimize or just hide the window
      window.blur()
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background w-full">
        {/* Draggable Header */}
        <div
          className="flex items-center justify-between p-3 border-b border-border bg-sidebar cursor-move"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <IconBriefcase className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
          <button
            className="h-6 w-6 p-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity flex-shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Skeleton Loading Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Job Header Skeleton */}
          <div className="bg-card rounded-lg border p-6">
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded animate-pulse w-3/4"></div>
              <div className="h-6 bg-muted rounded animate-pulse w-1/2"></div>
            </div>
          </div>

          {/* Job Information Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-card rounded-lg border p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                    <div className="h-5 bg-muted rounded animate-pulse w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Job Description Skeleton */}
          <div className="bg-card rounded-lg border p-6">
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded animate-pulse w-32"></div>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse w-full"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-5/6"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-4/5"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          </div>

          {/* Requirements Skeleton */}
          <div className="bg-card rounded-lg border p-6">
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded animate-pulse w-28"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-48"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Skills Skeleton */}
          <div className="bg-card rounded-lg border p-6">
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded animate-pulse w-32"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-40"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Responsibilities Skeleton */}
          <div className="bg-card rounded-lg border p-6">
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded animate-pulse w-36"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-52"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Benefits Skeleton */}
          <div className="bg-card rounded-lg border p-6">
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded animate-pulse w-20"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-44"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!jobData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <IconAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground">No job data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background w-full">
      {/* Draggable Header */}
      <div 
        className="flex items-center justify-between p-3 border-b border-border bg-sidebar cursor-move"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <IconBriefcase className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
        <button
          onClick={handleCloseWindow}
          className="h-6 w-6 p-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity flex-shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Job Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Job Header */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-start justify-between">
                               <div className="flex-1">
                     <h1 className="text-2xl font-bold text-foreground mb-2">
                       {jobData.job_title || jobData.title || 'Job Title'}
                     </h1>
                     {(jobData.company_name || jobData.company) && (
                       <p className="text-lg text-muted-foreground mb-4">
                         {jobData.company_name || jobData.company}
                       </p>
                     )}

                     <div className="flex flex-wrap gap-3">
                     </div>
                   </div>
          </div>
        </div>

        {/* Job Information Cards - Single Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Industry */}
          {jobData.industry && (
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-medium text-foreground">{jobData.industry}</p>
                </div>
                <IconBuilding className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          )}
          
          {/* Department */}
          {jobData.department && (
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium text-foreground">{jobData.department}</p>
                </div>
                <IconUsers className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          )}
          
          {/* Salary Information */}
          {(jobData.salary_min || jobData.salary_max) && (
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Salary Range</p>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground">₱</span>
                    <p className="font-medium text-foreground">
                      {jobData.salary_min && jobData.salary_max
                        ? `${jobData.salary_min.toLocaleString()} - ${jobData.salary_max.toLocaleString()}`
                        : jobData.salary_min
                        ? `From ${jobData.salary_min.toLocaleString()}`
                        : jobData.salary_max
                        ? `Up to ${jobData.salary_max.toLocaleString()}`
                        : ''
                      }
                    </p>
                  </div>
                </div>
                <IconCoins className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Application Deadline */}
          {jobData.application_deadline && (
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Application Deadline</p>
                  <p className="font-medium text-foreground">
                    {new Date(jobData.application_deadline).toLocaleDateString()}
                  </p>
                </div>
                <IconCalendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Job Description */}
        {jobData.job_description && (
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Job Description</h2>
            <p className="text-muted-foreground leading-relaxed">{jobData.job_description}</p>
          </div>
        )}

                {/* Requirements */}
        {jobData.requirements && Array.isArray(jobData.requirements) && jobData.requirements.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Requirements</h2>
            <ul className="space-y-2">
              {jobData.requirements.map((req, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <span className="text-foreground">•</span>
                  <span className="text-muted-foreground">{req}</span>
                 </li>
              ))}
            </ul>
          </div>
        )}

        {/* Required Skills */}
        {jobData.skills && Array.isArray(jobData.skills) && jobData.skills.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Required Skills</h2>
            <ul className="space-y-2">
              {jobData.skills.map((skill, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <span className="text-foreground">•</span>
                  <span className="text-muted-foreground">{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Responsibilities */}
        {jobData.responsibilities && Array.isArray(jobData.responsibilities) && jobData.responsibilities.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Responsibilities</h2>
            <ul className="space-y-2">
              {jobData.responsibilities.map((resp, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <span className="text-foreground">•</span>
                  <span className="text-muted-foreground">{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Benefits */}
        {jobData.benefits && Array.isArray(jobData.benefits) && jobData.benefits.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Benefits</h2>
            <ul className="space-y-2">
              {jobData.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <span className="text-foreground">•</span>
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Skills */}
        {jobData.skills && Array.isArray(jobData.skills) && jobData.skills.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Required Skills</h2>
            <ul className="space-y-2">
              {jobData.skills.map((skill, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <span className="text-foreground">•</span>
                  <span className="text-muted-foreground">{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        )}


      </div>
    </div>
  )
}
