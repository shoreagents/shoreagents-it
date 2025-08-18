"use client"

import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconWorld, IconEye, IconCalendar, IconUser } from "@tabler/icons-react"

// Types
interface TalentPoolEntry {
  id: number
  applicant_id: string
  interested_clients: number[]
  last_contact_date: string | null
  created_at: string
  updated_at: string
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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">Talent Pool</h1>
                    <p className="text-sm text-muted-foreground">Search and manage talent candidates.</p>
                  </div>
                </div>
                


                {/* Loading State */}
                {loading && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading talent pool...</p>
                  </div>
                )}

                {/* Error State */}
                {error && (
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
                )}

                {/* Results Count */}
                {!loading && !error && (
                <div className="mb-6">
                  <p className="text-muted-foreground">
                      Showing {talentPool.length} talent pool entr{talentPool.length !== 1 ? 'ies' : 'y'}
                  </p>
                </div>
                )}

                {/* Talent Pool */}
                {!loading && !error && talentPool.length > 0 && (
                  <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {talentPool.map((entry) => (
                        <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold">
                              Applicant {entry.applicant_id.slice(0, 8)}...
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Status: <Badge variant="secondary">{entry.applicant.status}</Badge>
                            </p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <IconCalendar className="h-4 w-4" />
                              Added {new Date(entry.created_at).toLocaleDateString()}
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-4">
                            {/* Applicant Info */}
                            <div className="space-y-2">
                              {entry.applicant.current_salary && (
                                <p className="text-sm">
                                  <span className="font-medium">Current Salary:</span> ₱{entry.applicant.current_salary.toLocaleString()}
                                </p>
                              )}
                              {entry.applicant.expected_monthly_salary && (
                                <p className="text-sm">
                                  <span className="font-medium">Expected:</span> ₱{entry.applicant.expected_monthly_salary.toLocaleString()}
                                </p>
                              )}
                              {entry.applicant.shift && (
                                <p className="text-sm">
                                  <span className="font-medium">Shift:</span> {entry.applicant.shift}
                                </p>
                              )}
                              {entry.applicant.job_ids.length > 0 && (
                                <p className="text-sm">
                                  <span className="font-medium">Jobs:</span> {entry.applicant.job_ids.join(', ')}
                                </p>
                              )}
                            </div>

                            {/* Comment */}
                            {entry.comment && (
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {entry.comment.type}
                                  </Badge>
                                  {entry.comment.creator.email && (
                                    <p className="text-xs text-muted-foreground">
                                      by {entry.comment.creator.email}
                                    </p>
                                  )}
                                </div>
                                <p className="text-sm">{entry.comment.text}</p>
                              </div>
                            )}

                            {/* Interested Clients */}
                            {entry.interested_clients.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-1">Interested Clients:</p>
                                <div className="flex flex-wrap gap-1">
                                  {entry.interested_clients.map(clientId => (
                                    <Badge key={clientId} variant="outline" className="text-xs">
                                      Client {clientId}
                                    </Badge>
                                  ))}
                                </div>
                          </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" variant="outline">
                                <IconEye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              {entry.applicant.video_introduction_url && (
                                <Button size="sm" variant="outline" asChild>
                                  <a href={entry.applicant.video_introduction_url} target="_blank" rel="noopener noreferrer">
                                    <IconWorld className="h-4 w-4" />
                                  </a>
                          </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                        </div>
                )}



                {/* No Results */}
                {!loading && !error && talentPool.length === 0 && (
                  <div className="text-center py-12">
                    <IconUser className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No talent pool entries found</h3>
                    <p className="text-muted-foreground">
                      Talent pool entries are automatically created when applicants reach 'passed' status.
                    </p>
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
