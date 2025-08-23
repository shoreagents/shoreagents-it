"use client"

import { useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

interface AgentRecord {
  user_id: number
  email: string
  user_type: string
  first_name: string | null
  last_name: string | null
  profile_picture: string | null
  phone: string | null
  employee_id: string | null
  job_title: string | null
  work_email: string | null
  start_date: string | null
  exit_date: string | null

  member_id: number | null
  member_company: string | null
  member_badge_color: string | null
  department_id: number | null
  department_name: string | null
  station_id: string | null
}

export default function AgentsPage() {
  const { theme } = useTheme()
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
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 40
  const [memberId, setMemberId] = useState<string>('all')
  const [memberOptions, setMemberOptions] = useState<{ id: number; company: string }[]>([])
  const [sortField, setSortField] = useState<string>('first_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const fetchAgents = async () => {
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
      if (memberId !== 'all') params.append('memberId', memberId)
      const res = await fetch(`/api/agents?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to fetch agents")
      }
      const data = await res.json()
      if (data?.agents && data?.pagination) {
        setAgents(data.agents)
        setTotalCount(data.pagination.totalCount || 0)
        setTotalPages(data.pagination.totalPages || 1)
      } else {
        setAgents(Array.isArray(data) ? data : [])
        const fallbackCount = Array.isArray(data) ? data.length : 0
        setTotalCount(fallbackCount)
        setTotalPages(Math.max(1, Math.ceil(fallbackCount / PAGE_SIZE)))
      }
    } catch (e: any) {
      setError(e?.message || "Failed to fetch agents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAgents() }, [])

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch('/api/agents', { method: 'OPTIONS' })
        const data = await res.json()
        setMemberOptions(data.members || [])
      } catch (e) {
        setMemberOptions([])
      }
    }
    fetchMembers()
  }, [])

  // Reset to page 1 when search changes
  useEffect(() => { setCurrentPage(1) }, [search])

  // Debounce fetch on search/page changes
  useEffect(() => {
    const timer = setTimeout(() => { fetchAgents() }, 300)
    return () => clearTimeout(timer)
  }, [currentPage, search, memberId, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  // no custom page list; mirror past tickets pagination (full page numbers)

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
                    <h1 className="text-2xl font-bold">Agents</h1>
                    <p className="text-sm text-muted-foreground">Directory of employees with member assignments and contact details</p>
                  </div>
                </div>
              </div>
              <div className="px-4 lg:px-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, employee ID, job title, member, phone, or email..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                                    <div className="w-40">
                    <Select value={memberId} onValueChange={(v: string) => { setMemberId(v); setCurrentPage(1) }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        <SelectItem value="none">No Assigned Members</SelectItem>
                        <SelectSeparator className="bg-border mx-2" />
                        <SelectGroup>
                          <SelectLabel className="text-muted-foreground">Members</SelectLabel>
                          {memberOptions.map((m) => (
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
                            <col className="w-80" />
                            <col className="w-72" />
                            <col className="w-[22rem]" />
                          </colgroup>
                          <TableHeader>
                            <TableRow variant="no-hover">
                            <TableHead onClick={() => handleSort('first_name')} className="cursor-pointer">
                              <div className="flex items-center gap-1">
                                Employee <span className="w-4 h-4">{sortField === 'first_name' && (sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4 text-primary" /> : <IconArrowDown className="h-4 w-4 text-primary" />)}</span>
                              </div>
                            </TableHead>
                            <TableHead onClick={() => handleSort('job_title')} className="cursor-pointer">
                              <div className="flex items-center gap-1">
                                Job Title <span className="w-4 h-4">{sortField === 'job_title' && (sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4 text-primary" /> : <IconArrowDown className="h-4 w-4 text-primary" />)}</span>
                              </div>
                            </TableHead>
                            <TableHead onClick={() => handleSort('member_company')} className="cursor-pointer">
                              <div className="flex items-center gap-1">
                                Member <span className="w-4 h-4">{sortField === 'member_company' && (sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4 text-primary" /> : <IconArrowDown className="h-4 w-4 text-primary" />)}</span>
                              </div>
                            </TableHead>
                            <TableHead onClick={() => handleSort('work_email')} className="cursor-pointer">
                              <div className="flex items-center gap-1">
                                Contact <span className="w-4 h-4">{sortField === 'work_email' && (sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4 text-primary" /> : <IconArrowDown className="h-4 w-4 text-primary" />)}</span>
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                        {agents.map((a) => (
                          <TableRow key={a.user_id}>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={a.profile_picture ?? undefined} alt={(a.first_name || "") + (a.last_name ? ` ${a.last_name}` : "")} />
                                  <AvatarFallback>
                                    {((a.first_name || "").charAt(0) + (a.last_name || "").charAt(0) || "A").toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate block max-w-[9rem]">{(a.first_name || "") + (a.last_name ? ` ${a.last_name}` : "")}</span>
                                {a.employee_id && (
                                  <Badge
                                    variant="outline"
                                    className="border"
                                    style={
                                      theme === 'dark'
                                        ? {
                                            backgroundColor: '#44464880',
                                            borderColor: '#444648',
                                            color: '#ffffff',
                                          }
                                        : {
                                            backgroundColor: '#44464814',
                                            borderColor: '#a5a5a540',
                                            color: '#444648',
                                          }
                                    }
                                  >
                                    {a.employee_id}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap"><span className="truncate block max-w-[18rem]">{a.job_title || "-"}</span></TableCell>
                            <TableCell className="whitespace-nowrap">
                              {a.member_company ? (
                                <Badge
                                  variant="outline"
                                  className="border"
                                  style={{
                                    backgroundColor: withAlpha(a.member_badge_color || '#999999', 0.2),
                                    borderColor: withAlpha(a.member_badge_color || '#999999', 0.4),
                                  }}
                                >
                                  <span className="truncate inline-block max-w-[16rem] align-bottom">{a.member_company}</span>
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex flex-col gap-0.5 leading-tight">
                                <div className="flex items-center gap-1.5">
                                  <IconMail className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="truncate block max-w-[18rem]">{a.work_email || a.email}</span>
                                </div>
                                {a.phone && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <IconPhone className="h-3.5 w-3.5" />
                                  <span className="truncate">{a.phone}</span>
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
                          ? <>Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} Agents</>
                          : <>Showing 0 to 0 of 0 Agents</>
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
    </>
  )
}


