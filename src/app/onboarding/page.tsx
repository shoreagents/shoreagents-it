"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Badge } from "@/components/ui/badge"
import { IconUserPlus, IconUserMinus, IconBuilding, IconMail, IconPhone, IconCalendar } from "@tabler/icons-react"

export default function OnboardingPage() {
  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">Onboarding & Offboarding</h1>
                    <p className="text-muted-foreground">Manage employee onboarding and offboarding processes</p>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex items-center gap-2">
                      <IconUserPlus className="h-4 w-4" />
                      New Onboarding
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <IconUserMinus className="h-4 w-4" />
                      New Offboarding
                    </Button>
                  </div>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Onboarding Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconUserPlus className="h-5 w-5 text-green-600" />
                        Employee Onboarding
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" placeholder="John" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" placeholder="Doe" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="john.doe@company.com" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                            <SelectItem value="hr">Human Resources</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Input id="position" placeholder="Software Engineer" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input id="startDate" type="date" />
                      </div>
                      
                                             <div className="space-y-2">
                         <Label htmlFor="notes">Notes</Label>
                         <textarea 
                           id="notes" 
                           placeholder="Additional notes..." 
                           className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                         />
                       </div>
                      
                      <Button className="w-full">Submit Onboarding Request</Button>
                    </CardContent>
                  </Card>

                  {/* Offboarding Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconUserMinus className="h-5 w-5 text-red-600" />
                        Employee Offboarding
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="employeeSelect">Select Employee</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose employee to offboard" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="john-doe">John Doe - Software Engineer</SelectItem>
                            <SelectItem value="jane-smith">Jane Smith - Marketing Manager</SelectItem>
                            <SelectItem value="mike-johnson">Mike Johnson - Sales Director</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="offboardingDate">Last Working Day</Label>
                        <Input id="offboardingDate" type="date" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Offboarding</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="resignation">Resignation</SelectItem>
                            <SelectItem value="termination">Termination</SelectItem>
                            <SelectItem value="retirement">Retirement</SelectItem>
                            <SelectItem value="contract-end">Contract End</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="exitInterview">Exit Interview Required</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                                             <div className="space-y-2">
                         <Label htmlFor="offboardingNotes">Notes</Label>
                         <textarea 
                           id="offboardingNotes" 
                           placeholder="Offboarding notes..." 
                           className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                         />
                       </div>
                      
                      <Button variant="destructive" className="w-full">Submit Offboarding Request</Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Requests */}
                <div className="mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-green-100 rounded-full">
                              <IconUserPlus className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">Sarah Wilson</h4>
                              <p className="text-sm text-muted-foreground">UX Designer - Engineering</p>
                              <p className="text-xs text-muted-foreground">Start Date: Jan 15, 2024</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-red-100 rounded-full">
                              <IconUserMinus className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">Alex Brown</h4>
                              <p className="text-sm text-muted-foreground">Marketing Manager - Marketing</p>
                              <p className="text-xs text-muted-foreground">Last Day: Jan 20, 2024</p>
                            </div>
                          </div>
                          <Badge variant="outline">In Progress</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-green-100 rounded-full">
                              <IconUserPlus className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">David Chen</h4>
                              <p className="text-sm text-muted-foreground">Data Analyst - Finance</p>
                              <p className="text-xs text-muted-foreground">Start Date: Jan 25, 2024</p>
                            </div>
                          </div>
                          <Badge variant="default">Completed</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
} 