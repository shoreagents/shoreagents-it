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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { useTheme } from "next-themes"

interface InternalRecord {
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
  station_id: string | null
}

export default function InternalPage() {
  const { theme } = useTheme()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<InternalRecord[]>([])
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 40
  const [sortField, setSortField] = useState<string>('first_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const fetchUsers = async () => {
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
      const res = await fetch(`/api/internal?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to fetch internal users")
      }
      const data = await res.json()
      setUsers(data.agents || [])
      setTotalCount(data.pagination?.totalCount || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (e: any) {
      setError(e?.message || "Failed to fetch internal users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])
  useEffect(() => { setCurrentPage(1) }, [search])
  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 300)
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
                    <h1 className="text-2xl font-bold">Internal</h1>
                    <p className="text-sm text-muted-foreground">Directory of internal employees and contact details</p>
                  </div>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search internal users..."
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
                    <Card>
                      <CardContent className="px-0 pt-0 pb-0">
                        <div className="rounded-xl overflow-hidden">
                          <Table className="table-fixed w-full">
                            <colgroup>
                              <col className="w-[16rem]" />
                              <col className="w-80" />
                              <col className="w-[22rem]" />
                            </colgroup>
                            <TableHeader>
                              <TableRow variant="no-hover">
                                <TableHead onClick={() => handleSort('first_name')} className={`cursor-pointer ${sortField === 'first_name' ? 'text-primary font-medium bg-accent/50' : ''}`}>
                                  <div className="flex items-center gap-1">
                                    Employee <span className="w-4 h-4">{sortField === 'first_name' && (sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4 text-primary" /> : <IconArrowDown className="h-4 w-4 text-primary" />)}</span>
                                  </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('job_title')} className={`cursor-pointer ${sortField === 'job_title' ? 'text-primary font-medium bg-accent/50' : ''}`}>
                                  <div className="flex items-center gap-1">
                                    Job Title <span className="w-4 h-4">{sortField === 'job_title' && (sortDirection === 'asc' ? <IconArrowUp className="h-4 w-4 text-primary" /> : <IconArrowDown className="h-4 w-4 text-primary" />)}</span>
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
                              {users.map((u) => (
                                <TableRow key={u.user_id}>
                                  <TableCell className="whitespace-nowrap">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Avatar className="h-7 w-7">
                                        <AvatarImage src={u.profile_picture ?? undefined} alt={(u.first_name || "") + (u.last_name ? ` ${u.last_name}` : "")} />
                                        <AvatarFallback>
                                          {((u.first_name || "").charAt(0) + (u.last_name || "").charAt(0) || "I").toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="truncate block max-w-[9rem]">{(u.first_name || "") + (u.last_name ? ` ${u.last_name}` : "")}</span>
                                      {u.employee_id && (
                                        <Badge
                                          variant="outline"
                                          className="border"
                                          style={
                                            theme === 'dark'
                                              ? { backgroundColor: '#44464880', borderColor: '#444648', color: '#ffffff' }
                                              : { backgroundColor: '#44464814', borderColor: '#a5a5a540', color: '#444648' }
                                          }
                                        >
                                          {u.employee_id}
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap"><span className="truncate block max-w-[18rem]">{u.job_title || "-"}</span></TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    <div className="flex flex-col gap-0.5 leading-tight">
                                      <div className="flex items-center gap-1.5">
                                        <IconMail className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="truncate block max-w-[18rem]">{u.work_email || u.email}</span>
                                      </div>
                                      {u.phone && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                          <IconPhone className="h-3.5 w-3.5" />
                                          <span className="truncate">{u.phone}</span>
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
                            ? <>Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} Internal</>
                            : <>Showing 0 to 0 of 0 Internal</>
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
    </>
  )
}



