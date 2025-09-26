"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IconCalendar, IconUser, IconBuilding, IconPhone, IconMail, IconX, IconClock, IconEdit, IconSave, IconTrash } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"

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

interface LeadsDetailModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
  isCreate?: boolean
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

export function LeadsDetailModal({ lead, isOpen, onClose, isLoading, isCreate = false }: LeadsDetailModalProps) {
  const [activeTab, setActiveTab] = useState("information")
  const [isEditing, setIsEditing] = useState(isCreate)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    status: 'New' as Lead['status'],
    source: '',
    notes: '',
    priority: 'Medium' as Lead['priority']
  })

  // Initialize form data when lead changes
  useEffect(() => {
    if (lead && !isCreate) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        company: lead.company || '',
        phone: lead.phone || '',
        status: lead.status || 'New',
        source: lead.source || '',
        notes: lead.notes || '',
        priority: lead.priority || 'Medium'
      })
    } else if (isCreate) {
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        status: 'New',
        source: '',
        notes: '',
        priority: 'Medium'
      })
    }
  }, [lead, isCreate])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      if (isCreate) {
        // Create new lead
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error('Failed to create lead')
        }
      } else if (lead) {
        // Update existing lead
        const response = await fetch(`/api/leads/${lead.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error('Failed to update lead')
        }
      }
      
      setIsEditing(false)
      onClose()
    } catch (error) {
      console.error('Error saving lead:', error)
      // You could add a toast notification here
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!lead || !confirm('Are you sure you want to delete this lead?')) {
      return
    }

    try {
      setIsDeleting(true)
      
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete lead')
      }
      
      onClose()
    } catch (error) {
      console.error('Error deleting lead:', error)
      // You could add a toast notification here
    } finally {
      setIsDeleting(false)
    }
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Loading Lead Details</DialogTitle>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">
          {isCreate ? 'Create New Lead' : 'Lead Details'}
        </DialogTitle>
        
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {getInitials(formData.name || 'Lead')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {isCreate ? 'New Lead' : formData.name || 'Unnamed Lead'}
                </h2>
                <p className="text-muted-foreground">
                  {isCreate ? 'Create a new sales lead' : `Created ${lead ? formatDate(lead.created_at) : ''}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isCreate && lead && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              )}
              
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <IconSave className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <IconEdit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Status and Priority Badges */}
          {!isCreate && lead && (
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(lead.status)}>
                {lead.status}
              </Badge>
              <Badge className={getPriorityColor(lead.priority)}>
                {lead.priority} Priority
              </Badge>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="information">Information</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="information" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter lead name"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-md">
                      <IconUser className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.name || '-'}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-md">
                      <IconMail className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.email || '-'}</span>
                    </div>
                  )}
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  {isEditing ? (
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Enter company name"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-md">
                      <IconBuilding className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.company || '-'}</span>
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-md">
                      <IconPhone className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.phone || '-'}</span>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  {isEditing ? (
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Contacted">Contacted</SelectItem>
                        <SelectItem value="Qualified">Qualified</SelectItem>
                        <SelectItem value="Proposal">Proposal</SelectItem>
                        <SelectItem value="Negotiation">Negotiation</SelectItem>
                        <SelectItem value="Closed Won">Closed Won</SelectItem>
                        <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2 border rounded-md">
                      <Badge className={getStatusColor(formData.status)}>
                        {formData.status}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  {isEditing ? (
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2 border rounded-md">
                      <Badge className={getPriorityColor(formData.priority)}>
                        {formData.priority}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Source */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="source">Source</Label>
                  {isEditing ? (
                    <Input
                      id="source"
                      value={formData.source}
                      onChange={(e) => handleInputChange('source', e.target.value)}
                      placeholder="e.g., Website, Referral, Cold Call"
                    />
                  ) : (
                    <div className="p-2 border rounded-md">
                      <span>{formData.source || '-'}</span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                {isEditing ? (
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add notes about this lead..."
                    rows={8}
                  />
                ) : (
                  <div className="p-4 border rounded-md min-h-[200px]">
                    <p className="whitespace-pre-wrap">
                      {formData.notes || 'No notes available.'}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Timestamps */}
          {!isCreate && lead && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
              <div className="flex items-center gap-2">
                <IconCalendar className="h-4 w-4" />
                <span>Created: {formatDate(lead.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconClock className="h-4 w-4" />
                <span>Updated: {formatDate(lead.updated_at)}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
