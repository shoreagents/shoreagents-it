"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconGlobe, IconCreditCard, IconPlus, IconUpload, IconX, IconSearch, IconLink, IconMinus, IconCheck } from "@tabler/icons-react"
import { useRealtimeMembers } from '@/hooks/use-realtime-members'
import { SendHorizontal } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataFieldRow } from "@/components/ui/fields"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"
import { ColorPicker } from "@/components/ui/color-picker"
import { LinkPreview } from "@/components/ui/link-preview"
import { MembersActivityLog } from "@/components/members-activity-log"
import { Comment } from "@/components/ui/comment"




interface AddCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onCompanyAdded?: (company: CompanyData) => void
  companyToEdit?: CompanyData & { id?: number } | null
}

interface CompanyData {
  company: string
  address: string | null
  phone: string | null
  country: string | null
  service: string | null
  website: string | null
  logo?: File | null
  logoUrl?: string | null
  badge_color?: string
  status?: string | null
  id?: number
  originalAgentIds?: number[] // Added for tracking original assignments
  originalClientIds?: number[] // Added for tracking original client assignments
  // Storage fields for selected agents and clients
  selectedAgentIds?: number[]
  selectedClientIds?: number[]
  selectedAgentsData?: Array<{user_id: number, first_name: string | null, last_name: string | null, employee_id: string | null, job_title: string | null, profile_picture: string | null, member_company: string | null, member_badge_color: string | null}>
  selectedClientsData?: Array<{user_id: number, first_name: string | null, last_name: string | null, profile_picture: string | null, member_company: string | null, member_badge_color: string | null}>
}

const serviceOptions = [
  { value: 'one agent', label: 'One Agent' },
  { value: 'team', label: 'Team' },
  { value: 'workforce', label: 'Workforce' }
]

// Badge helper functions (matching the ticket modal color scheme)
const getServiceBadgeClass = (service: string | null): string => {
  const s = (service || '').toLowerCase()
  if (s === 'workforce') {
    return 'text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20'
  }
  if (s === 'one agent') {
    return 'text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20'
  }
  if (s === 'team') {
    return 'text-yellow-700 dark:text-white border-yellow-600/20 bg-yellow-50 dark:bg-yellow-600/20'
  }
  return 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20'
}

const getStatusBadgeClass = (status: string | null): string => {
  const s = (status || '').toLowerCase()
  if (s === 'current client') {
    return 'text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20'
  }
  if (s === 'lost client') {
    return 'text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20'
  }
  return 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20'
}

const countryOptions = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
]

export function AddCompanyModal({ isOpen, onClose, onCompanyAdded, companyToEdit }: AddCompanyModalProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  
  // Real-time updates for member changes
  const { isConnected } = useRealtimeMembers({
    autoConnect: true,
    onMemberUpdated: (updatedMember, oldMember) => {
      if (companyToEdit?.id && updatedMember.id === companyToEdit.id) {
        console.log('🔄 Real-time member update received:', updatedMember)
        console.log('🔍 Old member data:', oldMember)
        console.log('🔍 New member data:', updatedMember)
        
        // Update the company data with real-time changes
        // Handle null values properly by checking if the field exists in the update
        setFormData(prev => ({
          ...prev,
          company: updatedMember.hasOwnProperty('company') ? updatedMember.company : prev.company,
          address: updatedMember.hasOwnProperty('address') ? updatedMember.address : prev.address,
          phone: updatedMember.hasOwnProperty('phone') ? updatedMember.phone : prev.phone,
          country: updatedMember.hasOwnProperty('country') ? updatedMember.country : prev.country,
          service: updatedMember.hasOwnProperty('service') ? updatedMember.service : prev.service,
          website: updatedMember.hasOwnProperty('website') ? updatedMember.website : prev.website,
          badge_color: updatedMember.hasOwnProperty('badge_color') ? updatedMember.badge_color : prev.badge_color,
          status: updatedMember.hasOwnProperty('status') ? updatedMember.status : prev.status
        }))
      }
    },
    onAgentMemberChanged: (agent, oldAgent) => {
      console.log('🔍 Agent member change detected:', { agent, oldAgent, companyToEditId: companyToEdit?.id })
      
      if (companyToEdit?.id && agent.member_id === companyToEdit.id) {
        console.log('🔄 Real-time agent assignment change:', agent)
        // Agent was assigned to this member
        setSelectedAgents(prev => {
          const newSet = new Set(prev)
          newSet.add(agent.user_id)
          console.log('✅ Updated selected agents:', Array.from(newSet))
          return newSet
        })
        
        // Fetch complete agent data to ensure we have all user information
        fetchSelectedAgentsData([agent.user_id])
      } else if (companyToEdit?.id && oldAgent?.member_id === companyToEdit.id && agent.member_id !== companyToEdit.id) {
        console.log('🔄 Real-time agent unassignment:', agent)
        // Agent was unassigned from this member
        setSelectedAgents(prev => {
          const newSet = new Set(prev)
          newSet.delete(agent.user_id)
          console.log('✅ Updated selected agents after unassignment:', Array.from(newSet))
          return newSet
        })
        setSelectedAgentsData(prev => {
          const filtered = prev.filter(a => a.user_id !== agent.user_id)
          console.log('✅ Updated selected agents data after unassignment:', filtered)
          return filtered
        })
      } else {
        console.log('❌ Agent change not relevant for current company:', {
          agentMemberId: agent.member_id,
          oldAgentMemberId: oldAgent?.member_id,
          companyToEditId: companyToEdit?.id
        })
      }
    },
    onClientMemberChanged: (client, oldClient) => {
      console.log('🔍 Client member change detected:', { client, oldClient, companyToEditId: companyToEdit?.id })
      
      if (companyToEdit?.id && client.member_id === companyToEdit.id) {
        console.log('🔄 Real-time client assignment change:', client)
        // Client was assigned to this member
        setSelectedClients(prev => {
          const newSet = new Set(prev)
          newSet.add(client.user_id)
          console.log('✅ Updated selected clients:', Array.from(newSet))
          return newSet
        })
        // Fetch complete client data to ensure we have all user information
        // Since we don't have a fetchSelectedClientsData function, we'll fetch from the clients API
        fetch(`/api/clients/modal?memberId=${companyToEdit.id}&limit=1000`)
          .then(response => response.json())
          .then(data => {
            const companyClients = data.clients || []
            setSelectedClientsData(companyClients)
            console.log('✅ Updated selected clients data with complete information:', companyClients)
          })
          .catch(error => {
            console.error('❌ Failed to fetch complete client data:', error)
          })
      } else if (companyToEdit?.id && oldClient?.member_id === companyToEdit.id && client.member_id !== companyToEdit.id) {
        console.log('🔄 Real-time client unassignment:', client)
        // Client was unassigned from this member
        setSelectedClients(prev => {
          const newSet = new Set(prev)
          newSet.delete(client.user_id)
          console.log('✅ Updated selected clients after unassignment:', Array.from(newSet))
          return newSet
        })
        setSelectedClientsData(prev => {
          const filtered = prev.filter(c => c.user_id !== client.user_id)
          console.log('✅ Updated selected clients data after unassignment:', filtered)
          return filtered
        })
      } else {
        console.log('❌ Client change not relevant for current company:', {
          clientMemberId: client.member_id,
          oldClientMemberId: oldClient?.member_id,
          companyToEditId: companyToEdit?.id
        })
      }
    }
  })

  // Real-time comment and activity updates via WebSocket
  React.useEffect(() => {
    if (!companyToEdit?.id || !isConnected) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected for real-time updates in modal')
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('🔍 WebSocket message received:', message)
        
        // Handle member comment updates
        if (message.type === 'member_comment_update') {
          const { action, record, old_record } = message.data
          console.log('🔍 Processing comment update:', { action, record, old_record, companyToEditId: companyToEdit.id })
          
          if (record && record.member_id === companyToEdit.id) {
            console.log('🔄 Real-time comment update received:', { action, record })
            
            setCommentsList(prevComments => {
              console.log('🔍 Previous comments:', prevComments)
              let newComments
              
              switch (action) {
                case 'INSERT':
                  // Add new comment
                  const newComment = {
                    id: record.id.toString(),
                    comment: record.comment,
                    user_name: record.user_name || 'Unknown User',
                    created_at: record.created_at
                  }
                  newComments = [newComment, ...prevComments]
                  console.log('✅ Added new comment:', newComment)
                  break
                  
                case 'UPDATE':
                  // Update existing comment
                  newComments = prevComments.map(comment => 
                    comment.id === record.id.toString()
                      ? {
                          ...comment,
                          comment: record.comment,
                          created_at: record.updated_at || record.created_at
                        }
                      : comment
                  )
                  console.log('✅ Updated comment:', record)
                  break
                  
                case 'DELETE':
                  // Remove deleted comment
                  newComments = prevComments.filter(comment => comment.id !== old_record.id.toString())
                  console.log('✅ Deleted comment:', old_record.id)
                  break
                  
                default:
                  newComments = prevComments
                  console.log('❌ Unknown comment action:', action)
              }
              
              console.log('🔍 New comments list:', newComments)
              return newComments
            })
          } else {
            console.log('❌ Comment update not relevant for current company:', {
              recordMemberId: record?.member_id,
              companyToEditId: companyToEdit.id
            })
          }
        }
        
        // Handle member activity updates
        if (message.type === 'member_activity_update') {
          const { action, record, old_record } = message.data
          console.log('🔍 Processing activity update:', { action, record, old_record, companyToEditId: companyToEdit.id })
          
          if (record && record.member_id === companyToEdit.id) {
            console.log('🔄 Real-time activity update received:', { action, record })
            
            // Real-time updates will automatically refresh the activity log
            // The MembersActivityLog component will receive live updates
          } else {
            console.log('❌ Activity update not relevant for current company:', {
              recordMemberId: record?.member_id,
              companyToEditId: companyToEdit.id
            })
          }
        }
        
        // Log any other message types for debugging
        if (message.type !== 'member_comment_update' && message.type !== 'member_activity_update') {
          console.log('🔍 Other WebSocket message type:', message.type, message)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message for real-time updates:', error)
        console.error('Raw message data:', event.data)
      }
    }

    ws.onclose = () => {
      console.log('❌ WebSocket disconnected for real-time updates in modal')
    }

    ws.onerror = (error) => {
      console.error('❌ WebSocket error for real-time updates in modal:', error)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [companyToEdit?.id, isConnected])
  
  // Add custom scrollbar styles for the popover
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .scrollbar-thin::-webkit-scrollbar {
        width: 6px;
      }
      .scrollbar-thin::-webkit-scrollbar-track {
        background: transparent;
      }
      .scrollbar-thin::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
      }
      .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }
      .dark .scrollbar-thin::-webkit-scrollbar-thumb {
        background: #4b5563;
      }
      .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: #6b7280;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Auto-save function that can be called before closing
  const autoSaveBeforeClose = async (): Promise<boolean> => {
    if (!companyToEdit?.id || !hasUnsavedChanges) {
      return true // No need to save, can close
    }

    try {
      console.log('🔄 Auto-saving changes before closing...')
      setIsSubmitting(true)
      
      // Update company data
      await updateDatabase(formData)
      
      // Update assignments
      await updateAssignments()
      
      console.log('✅ Auto-save completed successfully')
      
      // Real-time updates will automatically refresh the activity log
      
      return true
    } catch (error) {
      console.error('❌ Auto-save failed:', error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  // Modified close handler with auto-save for company data only
  const handleClose = async () => {
    console.log('🔒 handleClose called:', { 
      companyToEdit: companyToEdit?.id, 
      hasUnsavedChanges, 
      isOpen,
      formDataLogo: formData.logo,
      formDataLogoUrl: formData.logoUrl,
      companyToEditLogo: companyToEdit?.logo,
      companyToEditLogoUrl: companyToEdit?.logoUrl
    })
    
    if (companyToEdit?.id && hasUnsavedChanges) {
      // Auto-save company data changes before closing
      try {
        console.log('🔄 Auto-saving changes before close...')
        await updateDatabase(formData)
        console.log('✅ Company data saved successfully')
        
        // Notify parent of changes
        if (onCompanyAdded) {
          onCompanyAdded(companyToEdit)
        }
        onClose() // Call the original onClose prop
      } catch (error) {
        // Don't close if save failed
        console.error('❌ Failed to save company data:', error)
        alert('Failed to save company changes. Please try again.')
        return
      }
    } else {
      // No unsaved changes or not in edit mode, just close
      console.log('🔒 Closing without auto-save - no changes detected')
      onClose() // Call the original onClose prop
    }
  }

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [countrySearch, setCountrySearch] = React.useState('')
  const [agentSearch, setAgentSearch] = React.useState('')
  const [isColorPickerOpen, setIsColorPickerOpen] = React.useState(false)
  const [inputWidth, setInputWidth] = React.useState(0)
  const [isAddAgentDrawerOpen, setIsAddAgentDrawerOpen] = React.useState(false)
  const [showAgentSelection, setShowAgentSelection] = React.useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isAgentsHovered, setIsAgentsHovered] = React.useState(false)
  const [isClientsHovered, setIsClientsHovered] = React.useState(false)
  const [isLogoHovered, setIsLogoHovered] = React.useState(false)
  const [comment, setComment] = React.useState("")
  const [isCommentFocused, setIsCommentFocused] = React.useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)
  const [commentsList, setCommentsList] = React.useState<Array<{id: string, comment: string, user_name: string, created_at: string}>>([])
  const [isEditingCompany, setIsEditingCompany] = React.useState(false)
  const [agents, setAgents] = React.useState<Array<{user_id: number, first_name: string | null, last_name: string | null, employee_id: string | null, job_title: string | null, profile_picture: string | null, member_company: string | null, member_badge_color: string | null}>>([])
  const [selectedAgents, setSelectedAgents] = React.useState<Set<number>>(new Set())
  const [selectedAgentsData, setSelectedAgentsData] = React.useState<Array<{user_id: number, first_name: string | null, last_name: string | null, employee_id: string | null, job_title: string | null, profile_picture: string | null, member_company: string | null, member_badge_color: string | null}>>([])
  const [isLoadingAgents, setIsLoadingAgents] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [isLoadingCompany, setIsLoadingCompany] = React.useState(false)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  const [totalCount, setTotalCount] = React.useState(0)
  
  // Client-related state variables
  const [selectedClients, setSelectedClients] = React.useState<Set<number>>(new Set())
  const [selectedClientsData, setSelectedClientsData] = React.useState<Array<{user_id: number, first_name: string | null, last_name: string | null, profile_picture: string | null, member_company: string | null, member_badge_color: string | null}>>([])
  const [showClientSelection, setShowClientSelection] = React.useState(false)
  const [clientSearch, setClientSearch] = React.useState('')
  const [isLoadingClients, setIsLoadingClients] = React.useState(false)
  const [clients, setClients] = React.useState<Array<{user_id: number, first_name: string | null, last_name: string | null, profile_picture: string | null, member_company: string | null, member_badge_color: string | null}>>([])
  const [displayClients, setDisplayClients] = React.useState<Array<{user_id: number, first_name: string | null, last_name: string | null, profile_picture: string | null, member_company: string | null, member_badge_color: string | null}>>([])
  const [hasMoreClients, setHasMoreClients] = React.useState(true)
  const [isLoadingMoreClients, setIsLoadingMoreClients] = React.useState(false)
  const [currentClientPage, setCurrentClientPage] = React.useState(1)
  const [totalClientCount, setTotalClientCount] = React.useState(0)
  
  // Database sync state
  const [lastDatabaseSync, setLastDatabaseSync] = React.useState<Date | null>(null)
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [formData, setFormData] = React.useState<CompanyData>({
    company: '',
    address: '',
    phone: '',
    country: '',
    service: '',
    website: '',
    logo: null,
    badge_color: '#0EA5E9',
    status: 'Current Client'
  })
  const [existingLogoUrl, setExistingLogoUrl] = React.useState<string | null>(null)

  const logoPreviewUrl = React.useMemo(() => {
    if (formData.logo) {
      try {
        return URL.createObjectURL(formData.logo)
      } catch {
        return null
      }
    }
    // Only use formData.logoUrl for display, not existingLogoUrl
    // existingLogoUrl is only for comparison to detect changes
    return formData.logoUrl
  }, [formData.logo, formData.logoUrl])

  React.useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
    }
  }, [logoPreviewUrl])

  // Reset editing state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setIsEditingCompany(false)
    }
  }, [isOpen])

  // Debug effect to monitor logo changes
  React.useEffect(() => {
    console.log('🔍 formData.logoUrl changed to:', formData.logoUrl)
    console.log('🔍 formData.logo changed to:', formData.logo)
  }, [formData.logoUrl, formData.logo])

  const filteredCountries = countryOptions.filter(country =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  )

  // Use agents directly since we're now doing server-side search
  const displayAgents = agents

  // Manual save function
  const handleSave = async () => {
    if (!companyToEdit?.id) return
    
    try {
      setIsSubmitting(true)
      console.log('💾 Starting manual save...')
      console.log('🔍 Current selected agents:', Array.from(selectedAgents))
      console.log('🔍 Current selected clients:', Array.from(selectedClients))
      
      // Update database
      await updateDatabase(formData)
      
      // Update agent and client assignments
      await updateAssignments()
      
      // Reset unsaved changes flag
      setHasUnsavedChanges(false)
      
      console.log('✅ Manual save completed successfully')
      
      // Real-time updates will automatically refresh the activity log
      
      // Call the callback if provided (same as add company)
      if (onCompanyAdded) {
        onCompanyAdded(companyToEdit)
      }
      
      // Close modal after successful save (same as add company)
      handleClose()
      
    } catch (error) {
      console.error('❌ Manual save error:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update database function
  const updateDatabase = async (data: CompanyData) => {
    if (!companyToEdit?.id) return
    
    try {
      console.log('🔄 Updating database...', {
        dataLogo: data.logo,
        dataLogoUrl: data.logoUrl,
        companyToEditLogo: companyToEdit.logo,
        companyToEditLogoUrl: companyToEdit.logoUrl
      })
      
      const formDataToSend = new FormData()
      formDataToSend.append('company', data.company)
      if (data.address) formDataToSend.append('address', data.address)
      if (data.phone) formDataToSend.append('phone', data.phone)
      if (data.country) formDataToSend.append('country', data.country)
      if (data.service) formDataToSend.append('service', data.service)
      if (data.website) formDataToSend.append('website', data.website)
      if (data.badge_color) formDataToSend.append('badge_color', data.badge_color)
      if (data.status) formDataToSend.append('status', data.status)
      
      if (data.logo) {
        formDataToSend.append('logo', data.logo)
        console.log('🔄 New logo being uploaded')
      } else if (data.logoUrl === null && existingLogoUrl) {
        // Logo was cleared - send remove_logo flag
        formDataToSend.append('remove_logo', 'true')
        console.log('🔄 Logo removal requested - remove_logo flag added')
        console.log('🔄 Logo removal details:', { dataLogoUrl: data.logoUrl, existingLogoUrl })
      } else {
        console.log('🔄 No logo changes detected:', { dataLogoUrl: data.logoUrl, existingLogoUrl })
      }
      
      console.log('🔄 FormData contents:', Array.from(formDataToSend.entries()))
      
      const dbResponse = await fetch(`/api/members/${companyToEdit.id}`, {
        method: 'PATCH',
        body: formDataToSend
      })
      
      if (!dbResponse.ok) {
        throw new Error(`Database update failed: ${dbResponse.status}`)
      }
      
      console.log('✅ Database updated successfully')
      
    } catch (error) {
      console.error('❌ Database update error:', error)
      throw error
    }
  }

  // Real-time update function for immediate database updates
  const updateAssignmentRealTime = async (agentId: number, isSelected: boolean, type: 'agent' | 'client') => {
    if (!companyToEdit?.id) return
    
    try {
      console.log(`🔄 Real-time ${type} assignment update:`, { agentId, isSelected, companyId: companyToEdit.id })
      
      const endpoint = type === 'agent' ? `/api/agents/${agentId}` : `/api/clients/${agentId}`
      const body = { member_id: isSelected ? companyToEdit.id : null }
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!response.ok) {
        console.error(`❌ Failed to update ${type} ${agentId}:`, response.status)
        throw new Error(`Failed to update ${type} assignment`)
      }
      
      console.log(`✅ Real-time ${type} assignment updated successfully`)
      
      // Log activity for the assignment change
      if (user?.id) {
        try {
          const currentUserId = parseInt(user.id, 10)
          
          if (type === 'agent') {
            // Get current state for logging
            const currentOriginalAgentIds = formData.originalAgentIds || []
            let newOriginalAgentIds: number[]
            
            if (isSelected) {
              newOriginalAgentIds = [...currentOriginalAgentIds, agentId]
            } else {
              newOriginalAgentIds = currentOriginalAgentIds.filter(id => id !== agentId)
            }
            
            // Log the agent assignment change
            await fetch(`/api/members/${companyToEdit.id}/log-assignments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                originalAgentIds: currentOriginalAgentIds,
                currentAgentIds: newOriginalAgentIds,
                originalClientIds: formData.originalClientIds || [],
                currentClientIds: Array.from(selectedClients),
                userId: currentUserId
              })
            })
            
            console.log('✅ Agent assignment activity logged')
          } else {
            // Get current state for logging
            const currentOriginalClientIds = formData.originalClientIds || []
            let newOriginalClientIds: number[]
            
            if (isSelected) {
              newOriginalClientIds = [...currentOriginalClientIds, agentId]
            } else {
              newOriginalClientIds = currentOriginalClientIds.filter(id => id !== agentId)
            }
            
            // Log the client assignment change
            await fetch(`/api/members/${companyToEdit.id}/log-assignments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                originalAgentIds: formData.originalAgentIds || [],
                currentAgentIds: Array.from(selectedAgents),
                originalClientIds: currentOriginalClientIds,
                currentClientIds: newOriginalClientIds,
                userId: currentUserId
              })
            })
            
            console.log('✅ Client assignment activity logged')
          }
        } catch (logError) {
          console.error('❌ Failed to log assignment activity:', logError)
          // Don't throw - logging failure shouldn't break the main operation
        }
      }
      
      // Update original IDs to reflect the change
      if (type === 'agent') {
        if (isSelected) {
    setFormData(prev => ({
      ...prev,
            originalAgentIds: [...(prev.originalAgentIds || []), agentId]
          }))
        } else {
          setFormData(prev => ({
            ...prev,
            originalAgentIds: (prev.originalAgentIds || []).filter(id => id !== agentId)
          }))
        }
      } else {
        if (isSelected) {
          setFormData(prev => ({
            ...prev,
            originalClientIds: [...(prev.originalClientIds || []), agentId]
          }))
        } else {
          setFormData(prev => ({
            ...prev,
            originalClientIds: (prev.originalClientIds || []).filter(id => id !== agentId)
          }))
        }
      }
      
    } catch (error) {
      console.error(`❌ Real-time ${type} update error:`, error)
      // Revert the selection change on error
      if (type === 'agent') {
        setSelectedAgents(prev => {
          const newSet = new Set(prev)
          if (isSelected) {
            newSet.delete(agentId)
          } else {
            newSet.add(agentId)
          }
          return newSet
        })
      } else {
        setSelectedClients(prev => {
          const newSet = new Set(prev)
          if (isSelected) {
            newSet.delete(agentId)
          } else {
            newSet.add(agentId)
          }
          return newSet
        })
      }
      throw error
    }
  }

  // Update assignments function with timeout protection
  const updateAssignments = async () => {
    if (!companyToEdit?.id) return
    
    try {
      console.log('🔄 Updating assignments...')
      
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Assignment update timeout after 10 seconds')), 10000)
      })
      
      // Update agent assignments
      if (selectedAgents.size > 0) {
        console.log(`🔄 Updating ${selectedAgents.size} agent assignments...`)
        
        const agentUpdatePromises = Array.from(selectedAgents).map(async (agentId) => {
          const agentResponse = await fetch(`/api/agents/${agentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_id: companyToEdit.id })
          })
          
          if (!agentResponse.ok) {
            console.error(`❌ Failed to update agent ${agentId}:`, agentResponse.status)
            return false
          }
          
          return true
        })
        
        // Race against timeout to prevent hanging
        const agentResults = await Promise.race([
          Promise.all(agentUpdatePromises),
          timeoutPromise
        ]) as boolean[]
        
        const agentSuccessCount = agentResults.filter(Boolean).length
        
        if (agentSuccessCount === selectedAgents.size) {
          console.log('✅ All agent assignments updated in database')
        } else {
          console.warn(`⚠️ ${agentSuccessCount}/${selectedAgents.size} agent assignments updated`)
        }
      }
      
      // Update client assignments
      if (selectedClients.size > 0) {
        console.log(`🔄 Updating ${selectedClients.size} client assignments...`)
        
        const clientUpdatePromises = Array.from(selectedClients).map(async (clientId) => {
          const clientResponse = await fetch(`/api/clients/${clientId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_id: companyToEdit.id })
          })
          
          if (!clientResponse.ok) {
            console.error(`❌ Failed to update client ${clientId}:`, clientResponse.status)
            return false
          }
          
          return true
        })
        
        // Race against timeout to prevent hanging
        const clientResults = await Promise.race([
          Promise.all(clientUpdatePromises),
          timeoutPromise
        ]) as boolean[]
        
        const clientSuccessCount = clientResults.filter(Boolean).length
        
        if (clientSuccessCount === selectedClients.size) {
          console.log('✅ All client assignments updated in database')
        } else {
          console.warn(`⚠️ ${clientSuccessCount}/${selectedClients.size} client assignments updated`)
        }
      }
      
      // Handle deselections
      if (formData.originalAgentIds) {
        const deselectedAgentIds = formData.originalAgentIds.filter(id => 
          !selectedAgents.has(id)
        )
        
        if (deselectedAgentIds.length > 0) {
          console.log(`🔄 Removing ${deselectedAgentIds.length} deselected agent assignments...`)
          
          const agentRemovePromises = deselectedAgentIds.map(async (agentId) => {
            const agentResponse = await fetch(`/api/agents/${agentId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ member_id: null })
            })
            
            if (!agentResponse.ok) {
              console.error(`❌ Failed to remove agent ${agentId} assignment:`, agentResponse.status)
              return false
            }
            
            return true
          })
          
          // Race against timeout to prevent hanging
          const agentRemoveResults = await Promise.race([
            Promise.all(agentRemovePromises),
            timeoutPromise
          ]) as boolean[]
          
          const agentRemoveSuccessCount = agentRemoveResults.filter(Boolean).length
          
          if (agentRemoveSuccessCount === deselectedAgentIds.length) {
            console.log('✅ All deselected agent assignments removed from database')
          } else {
            console.warn(`⚠️ ${agentRemoveSuccessCount}/${deselectedAgentIds.length} deselected agent assignments removed`)
          }
        }
      }
      
      if (formData.originalClientIds) {
        const deselectedClientIds = formData.originalClientIds.filter(id => 
          !selectedClients.has(id)
        )
        
        if (deselectedClientIds.length > 0) {
          console.log(`🔄 Removing ${deselectedClientIds.length} deselected client assignments...`)
          
          const clientRemovePromises = deselectedClientIds.map(async (clientId) => {
            const clientResponse = await fetch(`/api/clients/${clientId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ member_id: null })
            })
            
            if (!clientResponse.ok) {
              console.error(`❌ Failed to remove client ${clientId} assignment:`, clientResponse.status)
              return false
            }
          
            return true
          })
          
          // Race against timeout to prevent hanging
          const clientRemoveResults = await Promise.race([
            Promise.all(clientRemovePromises),
            timeoutPromise
          ]) as boolean[]
          
          const clientRemoveSuccessCount = clientRemoveResults.filter(Boolean).length
          
          if (clientRemoveSuccessCount === deselectedClientIds.length) {
            console.log('✅ All deselected client assignments removed from database')
          } else {
            console.warn(`⚠️ ${clientRemoveSuccessCount}/${deselectedClientIds.length} deselected client assignments removed`)
          }
        }
      }
      
      console.log('✅ All assignments updated successfully')
      
      // Log activity for assignment changes via API
      if (companyToEdit.id && user?.id) {
        try {
          const currentUserId = parseInt(user.id, 10)
          const originalAgentIds = formData.originalAgentIds || []
          const currentAgentIds = Array.from(selectedAgents)
          const originalClientIds = formData.originalClientIds || []
          const currentClientIds = Array.from(selectedClients)
          
          // Debug logging
          console.log('🔍 Sending assignment data to API:', {
            memberId: companyToEdit.id,
            originalAgentIds,
            currentAgentIds,
            originalClientIds,
            currentClientIds,
            userId: currentUserId,
            formDataKeys: Object.keys(formData),
            hasOriginalAgentIds: 'originalAgentIds' in formData,
            hasOriginalClientIds: 'originalClientIds' in formData
          })
          
          const response = await fetch(`/api/members/${companyToEdit.id}/log-assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              originalAgentIds,
              currentAgentIds,
              originalClientIds,
              currentClientIds,
              userId: currentUserId
            })
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            console.error('❌ API response error:', response.status, errorData)
          } else {
            const result = await response.json()
            console.log('✅ Activity logged for assignment changes:', result)
          }
        } catch (logError) {
          console.error('❌ Failed to log assignment activity:', logError)
          // Don't throw - logging failure shouldn't break the main operation
        }
      }
      
    } catch (error) {
      console.error('❌ Assignment update error:', error)
      throw error
    }
  }



  const handleInputChange = (field: keyof CompanyData, value: string | File | null) => {
    console.log(`🔄 handleInputChange called with field: ${field}, value:`, value)
    console.log(`🔍 Current formData.${field}:`, formData[field])
    
    const newData = {
      ...formData,
      [field]: value
    }
    
    console.log(`📝 Setting new formData for ${field}:`, newData[field])
    setFormData(newData)
    
    // No more auto-save timer - user must click save button
    console.log(`📝 Field '${field}' updated to:`, value)
    console.log(`📝 New formData.${field} will be:`, newData[field])
    
    if (field === 'badge_color') {
      console.log('🎨 Badge color changed to:', value)
      console.log('🎨 New formData.badge_color will be:', newData.badge_color)
    }
    
    if (field === 'logo' || field === 'logoUrl') {
      console.log('🖼️ Logo field change:', { field, value, newLogo: newData.logo, newLogoUrl: newData.logoUrl })
    }
  }

  const handleCompanyEdit = () => {
    setIsEditingCompany(true)
  }

  const handleCompanySave = (value: string) => {
    handleInputChange('company', value)
    setIsEditingCompany(false)
  }

  const handleCompanyCancel = () => {
    setIsEditingCompany(false)
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    console.log('🖼️ Logo upload triggered:', file)
    
    if (file) {
      console.log('📁 File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toLocaleString()
      })
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPEG, PNG, GIF, etc.)')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Please select an image smaller than 5MB.')
        return
      }
    }
    
    handleInputChange('logo', file)
  }

  const fetchAgents = async (page = 1, append = false, searchQuery = '') => {
    try {
      if (page === 1) {
        setIsLoadingAgents(true)
      } else {
        setIsLoadingMore(true)
      }
      
      // Build query parameters - increase limit to ensure scrolling is possible
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20' // Increased from 10 to 20 for better scroll experience
      })
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      
      console.log(`Fetching agents page ${page} from API with search: "${searchQuery}"...`)
      
      const response = await fetch(`/api/agents/modal?${params.toString()}`)
      console.log('API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('API response data:', data)
        
        if (append) {
          setAgents(prev => [...prev, ...(data.agents || [])])
        } else {
          setAgents(data.agents || [])
        }
        
        setTotalCount(data.pagination?.totalCount || 0)
        setCurrentPage(page)
        setHasMore(page < (data.pagination?.totalPages || 1))
        
        console.log('Pagination Debug:', {
          page,
          totalCount: data.pagination?.totalCount,
          totalPages: data.pagination?.totalPages,
          hasMore: page < (data.pagination?.totalPages || 1),
          agentsInResponse: data.agents?.length || 0,
          totalAgentsAfterUpdate: append ? agents.length + (data.agents?.length || 0) : (data.agents?.length || 0),
          searchQuery
        })
        
        // Auto-load more pages if content height is too short for scrolling
        if (page === 1 && !searchQuery.trim() && data.pagination?.totalCount > 20) {
          // Check if we need more content for scrolling
          setTimeout(() => {
            checkAndLoadMoreIfNeeded(searchQuery)
          }, 300)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch agents:', response.status, errorData)
        if (!append) {
          setAgents([])
        }
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
      if (!append) {
        setAgents([])
      }
    } finally {
      setIsLoadingAgents(false)
      setIsLoadingMore(false)
    }
  }

  // Check if more content is needed for scrolling
  const checkAndLoadMoreIfNeeded = async (searchQuery: string) => {
    const container = document.querySelector('[data-agent-list]') as HTMLElement
    if (!container) return
    
    const { scrollHeight, clientHeight } = container
    const needsMoreContent = scrollHeight <= clientHeight + 100 // Add 100px buffer
    
    console.log('Scroll check:', {
      scrollHeight,
      clientHeight,
      needsMoreContent,
      hasMore,
      isLoadingMore
    })
    
    if (needsMoreContent && hasMore && !isLoadingMore) {
      console.log('Content too short, auto-loading more...')
      await fetchAgents(currentPage + 1, true, searchQuery)
    }
  }

  const loadMoreAgents = () => {
    console.log('loadMoreAgents called:', { hasMore, isLoadingMore, currentPage, agentSearch })
    if (hasMore && !isLoadingMore) {
      console.log('Fetching next page:', currentPage + 1)
      fetchAgents(currentPage + 1, true, agentSearch)
    } else {
      console.log('Cannot load more:', { hasMore, isLoadingMore })
    }
  }

  const fetchSelectedAgentsData = async (agentIds: number[]) => {
    if (agentIds.length === 0) {
      return
    }

    try {
      // Try to fetch by IDs first, fallback to search if not supported
      let response
      try {
        response = await fetch(`/api/agents/modal?ids=${agentIds.join(',')}`)
      } catch {
        // Fallback: fetch all agents and filter by IDs
                  response = await fetch('/api/agents/modal?limit=1000')
      }
      
      if (response.ok) {
        const data = await response.json()
        const allAgents = data.agents || []
        
        // Filter agents by the requested IDs
        const requestedAgents = allAgents.filter((agent: any) => agentIds.includes(agent.user_id))
        
        // Merge new agents with existing ones, avoiding duplicates
        setSelectedAgentsData(prev => {
          const existingIds = new Set(prev.map((agent: any) => agent.user_id))
          const newAgents = requestedAgents.filter((agent: any) => !existingIds.has(agent.user_id))
          return [...prev, ...newAgents]
        })
      } else {
        console.error('Failed to fetch selected agents data')
      }
    } catch (error) {
      console.error('Error fetching selected agents data:', error)
    }
  }

  const fetchCompanyAgents = async (memberId: number) => {
    try {
      setIsLoadingCompany(true)
              const response = await fetch(`/api/agents/modal?memberId=${memberId}&limit=1000`)
      if (response.ok) {
        const data = await response.json()
        const companyAgents = data.agents || []
        
        // Set the selected agents
        const agentIds = companyAgents.map((agent: any) => agent.user_id)
        setSelectedAgents(new Set(agentIds))
        
        // Set the selected agents data
        setSelectedAgentsData(companyAgents)
        
        // Store original agent IDs for tracking deselection in edit mode
        if (companyToEdit) {
          setFormData(prev => ({
            ...prev,
            originalAgentIds: agentIds
          }))
        }
        
        console.log('Loaded company agents:', companyAgents)
      } else {
        console.error('Failed to fetch company agents')
      }
    } catch (error) {
      console.error('Error fetching company agents:', error)
    } finally {
      setIsLoadingCompany(false)
    }
  }

  const fetchCompanyClients = async (memberId: number) => {
    try {
      // Use the utility function to get clients for the member
              const response = await fetch(`/api/clients/modal?memberId=${memberId}&limit=1000`)
      if (response.ok) {
        const data = await response.json()
        const companyClients = data.clients || []
        
        // Set the selected clients
        const clientIds = companyClients.map((client: any) => client.user_id)
        setSelectedClients(new Set(clientIds))
        
        setSelectedClientsData(companyClients)
        
        // Store original client IDs for tracking deselection in edit mode
        if (companyToEdit) {
          setFormData(prev => ({
            ...prev,
            originalClientIds: clientIds
          }))
        }
        
        console.log('Loaded company clients:', companyClients)
      } else {
        console.error('Failed to fetch company clients')
      }
    } catch (error) {
      console.error('Error fetching company clients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.company) {
      alert('Please fill in the company name')
      return
    }

    // For editing mode, auto-save company data before closing
    if (companyToEdit?.id) {
      console.log('Edit mode - auto-saving company data before closing...')
      await handleClose()
      return
    }

    try {
      setIsSubmitting(true)
      
      console.log('🚀 Starting form submission...')
      console.log('🔍 Current formData:', formData)
      
      // Create FormData for API call (only for new companies)
      const formDataToSend = new FormData()
      formDataToSend.append('company', formData.company)
      if (formData.address) formDataToSend.append('address', formData.address)
      if (formData.phone) formDataToSend.append('phone', formData.phone)
      if (formData.country) formDataToSend.append('country', formData.country)
      if (formData.service) formDataToSend.append('service', formData.service)
      if (formData.website) formDataToSend.append('website', formData.website)
      if (formData.logo) {
        formDataToSend.append('logo', formData.logo)
      }
      // Always send badge_color and status (they have default values)
      console.log('🔍 Form submission - badge_color:', formData.badge_color)
      console.log('🔍 Form submission - status:', formData.status)
      formDataToSend.append('badge_color', formData.badge_color || '#0EA5E9')
      formDataToSend.append('status', formData.status || 'Current Client')
      
      console.log('📤 FormData being sent:')
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`  ${key}: ${value}`)
      }
      
        // Create new company
      const response = await fetch('/api/members', {
          method: 'POST',
        headers: {
          'x-user-id': user?.id || ''
        },
          body: formDataToSend
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create company')
        }
        
      const result = await response.json()
        console.log('Company created successfully:', result.company)
      
      // Update selected agents with the new member_id if any agents are selected
      if (selectedAgents.size > 0) {
        const memberId = result.company.id
        const agentIds = Array.from(selectedAgents)
        
        try {
          // Update each selected agent with the new member_id
          const updatePromises = agentIds.map(async (agentId) => {
            const updateResponse = await fetch(`/api/agents/${agentId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                member_id: memberId
              })
            })
            
            if (!updateResponse.ok) {
              console.error(`Failed to update agent ${agentId}`)
              return false
            }
            
            return true
          })
          
          const results = await Promise.all(updatePromises)
          const successCount = results.filter(Boolean).length
          
          if (successCount === agentIds.length) {
            console.log('All selected agents updated successfully with member_id:', memberId)
          } else {
            console.warn(`${successCount}/${agentIds.length} agents updated successfully`)
          }
        } catch (error) {
          console.error('Error updating agents with member_id:', error)
        }
      }

      // Handle agent deselection in edit mode
      if (companyToEdit?.id) {
        try {
          // Get all agents that were originally assigned to this company
          const originalAgentIds = formData.originalAgentIds || []
          
          // Find agents that were deselected (in original but not in current selection)
          const deselectedAgentIds = originalAgentIds.filter(id => !selectedAgents.has(id))
          
          // Remove member_id from deselected agents
          if (deselectedAgentIds.length > 0) {
            console.log('Removing member_id from deselected agents:', deselectedAgentIds)
            
            const removePromises = deselectedAgentIds.map(async (agentId) => {
              const updateResponse = await fetch(`/api/agents/${agentId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  member_id: null
                })
              })
              
              if (!updateResponse.ok) {
                console.error(`Failed to remove member_id from agent ${agentId}`)
                return false
              }
              
              return true
            })
            
            const removeResults = await Promise.all(removePromises)
            const removeSuccessCount = removeResults.filter(Boolean).length
            
            if (removeSuccessCount === deselectedAgentIds.length) {
              console.log('All deselected agents updated successfully (member_id removed)')
            } else {
              console.warn(`${removeSuccessCount}/${deselectedAgentIds.length} deselected agents updated successfully`)
            }
          }
        } catch (error) {
          console.error('Error handling agent deselection:', error)
        }
      }

      // Handle client assignments
      if (selectedClients.size > 0) {
        const memberId = result.company.id
        const clientIds = Array.from(selectedClients)
        
        try {
          // Update each selected client with the new member_id
          const updatePromises = clientIds.map(async (clientId) => {
            const updateResponse = await fetch(`/api/clients/${clientId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                member_id: memberId
              })
            })
            
            if (!updateResponse.ok) {
              console.error(`Failed to update client ${clientId}`)
              return false
            }
            
            return true
          })
          
          const results = await Promise.all(updatePromises)
          const successCount = results.filter(Boolean).length
          
          if (successCount === clientIds.length) {
            console.log('All selected clients updated successfully with member_id:', memberId)
          } else {
            console.warn(`${successCount}/${clientIds.length} clients updated successfully`)
          }
        } catch (error) {
          console.error('Error updating clients with member_id:', error)
        }
      }

      // Handle client deselection in edit mode
      if (companyToEdit?.id) {
        try {
          // Get all clients that were originally assigned to this company
          const originalClientIds = formData.originalClientIds || []
          
          // Find clients that were deselected (in original but not in current selection)
          const deselectedClientIds = originalClientIds.filter(id => !selectedClients.has(id))
          
          // Remove member_id from deselected clients
          if (deselectedClientIds.length > 0) {
            console.log('Removing member_id from deselected clients:', deselectedClientIds)
            
            const removePromises = deselectedClientIds.map(async (clientId) => {
              const updateResponse = await fetch(`/api/clients/${clientId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  member_id: null
                })
              })
              
              if (!updateResponse.ok) {
                console.error(`Failed to remove member_id from client ${clientId}`)
                return false
              }
              
              return true
            })
            
            const removeResults = await Promise.all(removePromises)
            const removeSuccessCount = removeResults.filter(Boolean).length
            
            if (removeSuccessCount === deselectedClientIds.length) {
              console.log('All deselected clients updated successfully (member_id removed)')
            } else {
              console.warn(`${removeSuccessCount}/${deselectedClientIds.length} deselected clients updated successfully`)
            }
          }
        } catch (error) {
          console.error('Error handling client deselection:', error)
        }
      }
      
      // Call the callback if provided
      if (onCompanyAdded) {
        onCompanyAdded(result.company)
      }
      
      // Reset form and close modal
      setFormData({
        company: '',
        address: '',
        phone: '',
        country: '',
        service: '',
        website: '',
        logo: null,
        badge_color: '#0EA5E9',
        status: 'Current Client'
      })
      
      // Reset agent selection
      setSelectedAgents(new Set())
      setSelectedAgentsData([])
      
      // Reset client selection
      setSelectedClients(new Set())
      setSelectedClientsData([])
      
      onClose()
      
    } catch (error) {
      console.error('Error creating company:', error)
      alert(error instanceof Error ? error.message : 'Failed to create company. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }



  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true)
  }

  // Load existing comments for the company
  const loadComments = async (memberId: number) => {
    try {
      const response = await fetch(`/api/members/${memberId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setCommentsList(data.comments || [])
      } else {
        console.error('Failed to fetch comments:', response.status)
        setCommentsList([])
      }
    } catch (error) {
      console.error('Error loading comments:', error)
      setCommentsList([])
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !companyToEdit?.id || isSubmittingComment) return

    setIsSubmittingComment(true)
    
    // Create the comment object
    const newComment = {
      id: Date.now().toString(),
      comment: comment.trim(),
      user_name: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
      created_at: new Date().toISOString()
    }
    
    try {
      // Add to local state immediately for optimistic UI
      setCommentsList((prev) => [newComment, ...prev])
      setComment("")
      
      // Save comment to database
      const response = await fetch(`/api/members/${companyToEdit.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: newComment.comment,
          user_id: user?.id
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save comment')
      }
      
      console.log('Comment submitted successfully:', newComment)
    } catch (error) {
      console.error('Error submitting comment:', error)
      // Remove the comment from local state if API call fails
      setCommentsList((prev) => prev.filter(c => c.id !== newComment.id))
      alert('Failed to submit comment. Please try again.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!companyToEdit?.id) return
    
    try {
      setIsDeleting(true)
      
      console.log('Attempting to delete company with ID:', companyToEdit.id)
      console.log('Company data:', companyToEdit)
      
      // Delete the company
      const response = await fetch(`/api/members/${companyToEdit.id}`, {
        method: 'DELETE'
      })
      
      console.log('Delete response status:', response.status)
      console.log('Delete response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorData = await response.json()
        console.log('Error response data:', errorData)
        throw new Error(errorData.error || 'Failed to delete company')
      }
      
      const responseData = await response.json()
      console.log('Success response data:', responseData)
      console.log('Company deleted successfully')
      
      // Close modal and notify parent
      setShowDeleteConfirmation(false)
      onClose() // Call original onClose directly to avoid auto-save during deletion
      
      // Optionally refresh the companies list if there's a callback
      if (onCompanyAdded) {
        // Trigger a refresh by calling the callback with a deleted indicator
        onCompanyAdded({ ...companyToEdit, _deleted: true } as any)
      }
      
    } catch (error) {
      console.error('Error deleting company:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete company. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Check if all required fields are completed
  const isFormValid = () => {
    return !!(
      formData.company?.trim()
    )
  }

  // Client-related functions
  const fetchClients = async (search = '', page = 1) => {
    try {
      setIsLoadingClients(true)
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: '20'
      })
      
      const response = await fetch(`/api/clients/modal?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        const newClients = data.clients || []
        
        if (page === 1) {
          setClients(newClients)
          setDisplayClients(newClients)
        } else {
          setClients(prev => [...prev, ...newClients])
          setDisplayClients(prev => [...prev, ...newClients])
        }
        
        setHasMoreClients(newClients.length === 20)
        setCurrentClientPage(page)
        setTotalClientCount(data.pagination?.totalCount || 0)
        
        // Auto-load more pages if content height is too short for scrolling
        if (page === 1 && !search && data.pagination?.totalCount > 20) {
          // Check if we need more content for scrolling
          setTimeout(() => {
            checkAndLoadMoreClientsIfNeeded(search)
          }, 300)
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setIsLoadingClients(false)
      setIsLoadingMoreClients(false)
    }
  }

  // Check if more client content is needed for scrolling
  const checkAndLoadMoreClientsIfNeeded = async (searchQuery: string) => {
    const container = document.querySelector('[data-client-list]') as HTMLElement
    if (!container) return
    
    const { scrollHeight, clientHeight } = container
    const needsMoreContent = scrollHeight <= clientHeight + 100 // Add 100px buffer
    
    console.log('Client scroll check:', {
      scrollHeight,
      clientHeight,
      needsMoreContent,
      hasMoreClients,
      isLoadingMoreClients
    })
    
    if (needsMoreContent && hasMoreClients && !isLoadingMoreClients) {
      console.log('Client content too short, auto-loading more...')
      await fetchClients(searchQuery, currentClientPage + 1)
    }
  }

  const loadMoreClients = async () => {
    if (isLoadingMoreClients || !hasMoreClients) return
    
    setIsLoadingMoreClients(true)
    await fetchClients(clientSearch, currentClientPage + 1)
  }

  const handleClientSearch = (searchTerm: string) => {
    setClientSearch(searchTerm)
    setCurrentClientPage(1)
    setClients([])
    setDisplayClients([])
    setHasMoreClients(true)
    fetchClients(searchTerm, 1)
  }

  // Helper functions to manage selection panel states
  const openAgentSelection = () => {
    setShowAgentSelection(true)
    setShowClientSelection(false) // Close client selection when opening agent selection
  }

  const openClientSelection = () => {
    setShowClientSelection(true)
    setShowAgentSelection(false) // Close agent selection when opening client selection
  }

  const closeSelectionContainers = () => {
    setShowAgentSelection(false)
    setShowClientSelection(false)
    
    // No auto-save when closing selection containers - user must click save button
    console.log('📝 Selection containers closed - changes will be saved when you click Save Changes')
  }

  // Update the useEffect that loads company data
  React.useEffect(() => {
    if (isOpen) {
      if (fileInputRef.current) {
        setInputWidth(fileInputRef.current.offsetWidth);
      }
      
      // Real-time updates will automatically refresh the activity log
      
      // If editing a company, populate the form
      if (companyToEdit) {
        console.log('🔄 Starting to load company data for:', companyToEdit.id)
        console.log('🔄 companyToEdit full data:', companyToEdit)
        
        // Set loading state to show skeleton
        setIsLoadingCompany(true)
        
        // Load data from database
        const loadCompanyData = async () => {
          console.log('🔄 Loading fresh data from database')
          
          const freshData = {
          company: companyToEdit.company || '',
          address: companyToEdit.address || '',
          phone: companyToEdit.phone || '',
          country: companyToEdit.country || '',
          service: companyToEdit.service || '',
          website: Array.isArray(companyToEdit.website) && companyToEdit.website.length > 0 ? companyToEdit.website[0] : (companyToEdit.website as string) || '',
            logo: null,
          logoUrl: typeof companyToEdit.logo === 'string' ? companyToEdit.logo : companyToEdit.logoUrl,
          badge_color: companyToEdit.badge_color || '#0EA5E9',
          status: companyToEdit.status || 'Current Client',
          id: companyToEdit.id,
            originalAgentIds: [],
            originalClientIds: []
          }
          
          // Set existing logo URL for comparison
          console.log('🔍 companyToEdit logo data:', {
            logo: companyToEdit.logo,
            logoUrl: companyToEdit.logoUrl,
            logoType: typeof companyToEdit.logo,
            logoUrlType: typeof companyToEdit.logoUrl
          })
          
          const originalLogoUrl = typeof companyToEdit.logo === 'string' ? companyToEdit.logo : companyToEdit.logoUrl || null
          setExistingLogoUrl(originalLogoUrl)
          console.log('🔍 Set existingLogoUrl for comparison:', originalLogoUrl)
          
          // Set form data with fresh database data
          setFormData(freshData)
          setLastDatabaseSync(new Date())
          
          // Fetch current assignments from database and set original IDs
        if (companyToEdit.id) {
            // Fetch agents and set original IDs
            const agentsResponse = await fetch(`/api/agents/modal?memberId=${companyToEdit.id}&limit=1000`)
            if (agentsResponse.ok) {
              const agentsData = await agentsResponse.json()
              const companyAgents = agentsData.agents || []
              const agentIds = companyAgents.map((agent: any) => agent.user_id)
              
              setSelectedAgents(new Set(agentIds))
              setSelectedAgentsData(companyAgents)
              
              // Set original agent IDs for tracking deselection
              setFormData(prev => ({
                ...prev,
                originalAgentIds: agentIds
              }))
              
              console.log('✅ Set original agent IDs:', agentIds)
            }
            
            // Fetch clients and set original IDs
            const clientsResponse = await fetch(`/api/clients/modal?memberId=${companyToEdit.id}&limit=1000`)
            if (clientsResponse.ok) {
              const clientsData = await clientsResponse.json()
              console.log('🔍 Clients API response:', clientsData)
              
              const companyClients = clientsData.clients || []
              console.log('🔍 Company clients extracted:', companyClients)
              
              const clientIds = companyClients.map((client: any) => client.user_id)
              console.log('🔍 Client IDs extracted:', clientIds)
              
              setSelectedClients(new Set(clientIds))
              setSelectedClientsData(companyClients)
              
              // Set original client IDs for tracking deselection
              setFormData(prev => ({
                ...prev,
                originalClientIds: clientIds
              }))
              
              console.log('✅ Set original client IDs:', clientIds)
              console.log('✅ selectedClientsData set to:', companyClients)
      } else {
              console.error('❌ Failed to fetch clients:', clientsResponse.status, clientsResponse.statusText)
            }
            
            // Load comments for this company
            await loadComments(companyToEdit.id)
          }
        }
        
        loadCompanyData().finally(() => {
          setIsLoadingCompany(false)
        })
      } else {
        // If adding a new company, reset form to empty state
        console.log('🆕 Resetting form for new company')
        setFormData({
          company: '',
          address: '',
          phone: '',
          country: '',
          service: '',
          website: '',
          logo: null,
          logoUrl: null,
          badge_color: '#0EA5E9',
          status: 'Current Client',
          id: undefined,
          originalAgentIds: [],
          originalClientIds: []
        })
        
        // Reset selections
      setSelectedAgents(new Set())
      setSelectedAgentsData([])
      setSelectedClients(new Set())
      setSelectedClientsData([])
        
        // Reset unsaved changes flag
        setHasUnsavedChanges(false)
      }
    }
  }, [isOpen, companyToEdit])

  // Remove the syncQueue effect
  // React.useEffect(() => { ... }, [syncQueue])

  // Debug: Monitor selectedClientsData changes
  React.useEffect(() => {
    console.log('🔍 selectedClientsData changed:', selectedClientsData)
  }, [selectedClientsData])

  // Prevent body scroll when either modal or sheet is open
  React.useEffect(() => {
    if (isOpen || isAddAgentDrawerOpen || showAgentSelection || showClientSelection) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = '0px'
      // Also try to prevent scroll on html element
      document.documentElement.style.overflow = 'hidden'
      // Add CSS class to body for additional scroll prevention
      document.body.classList.add('overflow-hidden')
      // Add inline style to body for maximum scroll prevention
      document.body.style.cssText += '; overflow: hidden !important; position: fixed; width: 100%;'
    } else {
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = ''
      document.documentElement.style.overflow = ''
      // Remove CSS class from body
      document.body.classList.remove('overflow-hidden')
      // Remove inline styles
      document.body.style.position = ''
      document.body.style.width = ''
      // Remove the important overflow style
      document.body.style.cssText = document.body.style.cssText.replace(/overflow:\s*hidden\s*!important;?\s*/g, '')
    }
  }, [isOpen, isAddAgentDrawerOpen, showAgentSelection, showClientSelection])

  React.useEffect(() => {
    if (isAddAgentDrawerOpen || showAgentSelection) {
      // Reset pagination state when sheet opens or agent selection is shown
      setCurrentPage(1)
      setHasMore(true)
      setTotalCount(0)
      // Reset search when opening agent selection
      if (showAgentSelection) {
        setAgentSearch('')
      }
      // Only reset selected agents when the modal first opens, not when agent selection is toggled
      if (isAddAgentDrawerOpen) {
        setSelectedAgents(new Set())
      }
      fetchAgents(1, false, '')
    }
  }, [isAddAgentDrawerOpen, showAgentSelection])

  React.useEffect(() => {
    if (showClientSelection) {
      // Reset pagination state when client selection is shown
      setCurrentClientPage(1)
      setHasMoreClients(true)
      setTotalClientCount(0)
      // Reset search when opening client selection
      setClientSearch('')
      // Fetch clients on first load
      fetchClients('', 1)
    }
  }, [showClientSelection])

  // Debounced search effect
  React.useEffect(() => {
    if (!showAgentSelection) return

    const timeoutId = setTimeout(() => {
      // Reset pagination when searching
      setCurrentPage(1)
      setHasMore(true)
      setTotalCount(0)
      // Fetch agents with search query
      fetchAgents(1, false, agentSearch)
    }, 300) // 300ms delay

    return () => clearTimeout(timeoutId)
  }, [agentSearch, showAgentSelection])

  // Debounced client search effect
  React.useEffect(() => {
    if (!showClientSelection) return

    const timeoutId = setTimeout(() => {
      // Reset pagination when searching
      setCurrentClientPage(1)
      setHasMoreClients(true)
      setTotalClientCount(0)
      // Fetch clients with search query
      fetchClients(clientSearch, 1)
    }, 300) // 300ms delay

    return () => clearTimeout(timeoutId)
  }, [clientSearch, showClientSelection])

  // Cleanup effect to reset selection states when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      // Reset all selection states when modal closes
      setShowAgentSelection(false)
      setShowClientSelection(false)
      setShowDeleteConfirmation(false)
      console.log('🧹 Modal closed - resetting all selection states')
    }
  }, [isOpen])

  // Fetch selected agents data whenever selection changes
  React.useEffect(() => {
    if (selectedAgents.size > 0) {
      // Only fetch agents that are not already in selectedAgentsData
      const missingAgentIds = Array.from(selectedAgents).filter(
        id => !selectedAgentsData?.some(agent => agent.user_id === id)
      )
      
      if (missingAgentIds.length > 0) {
        fetchSelectedAgentsData(missingAgentIds)
      }
    } else {
      setSelectedAgentsData([])
    }
  }, [selectedAgents]) // Removed selectedAgentsData from dependencies to prevent infinite loop

  // Fetch selected clients data whenever selection changes
  React.useEffect(() => {
    if (selectedClients.size > 0) {
      // Only fetch clients that are not already in selectedClientsData
      const missingClientIds = Array.from(selectedClients).filter(
        id => !selectedClientsData?.some(client => client.user_id === id)
      )
      
      if (missingClientIds.length > 0) {
        // For now, we'll use the existing client data since we don't have a separate fetchSelectedClientsData function
        // This could be enhanced later if needed
        console.log('Missing client data for IDs:', missingClientIds)
      }
    } else {
      setSelectedClientsData([])
    }
  }, [selectedClients]) // Removed selectedClientsData from dependencies to prevent infinite loop





  // Cleanup function to restore scroll when component unmounts
  React.useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = ''
      document.documentElement.style.overflow = ''
      document.body.classList.remove('overflow-hidden')
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.cssText = document.body.style.cssText.replace(/overflow:\s*hidden\s*!important;?\s*/g, '')
      
      // Auto-save functionality removed - user must click save button
    }
  }, [companyToEdit?.id, formData])

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)

  // Update hasUnsavedChanges when form data or selections change
  React.useEffect(() => {
    if (companyToEdit?.id) {
      // Check if there are any changes compared to original data
      // Debug logo comparison
      const logoChanged = formData.logo !== null || formData.logoUrl !== existingLogoUrl
      
      console.log('🔍 Logo comparison debug:', {
        formDataLogo: formData.logo,
        formDataLogoUrl: formData.logoUrl,
        existingLogoUrl,
        logoChanged
      })
      
      const hasChanges = 
        formData.company !== companyToEdit.company ||
        formData.address !== companyToEdit.address ||
        formData.phone !== companyToEdit.phone ||
        formData.country !== companyToEdit.country ||
        formData.service !== companyToEdit.service ||
        formData.website !== (Array.isArray(companyToEdit.website) ? companyToEdit.website[0] : companyToEdit.website) ||
        logoChanged ||
        formData.badge_color !== companyToEdit.badge_color ||
        formData.status !== companyToEdit.status ||
        // Check if agent selection has changed from original
        JSON.stringify(Array.from(selectedAgents).sort()) !== JSON.stringify((formData.originalAgentIds || []).sort()) ||
        // Check if client selection has changed from original
        JSON.stringify(Array.from(selectedClients).sort()) !== JSON.stringify((formData.originalClientIds || []).sort())
      
      console.log('🔍 hasChanges result:', hasChanges)
      console.log('🔍 Full change detection:', {
        company: formData.company !== companyToEdit.company,
        address: formData.address !== companyToEdit.address,
        phone: formData.phone !== companyToEdit.phone,
        country: formData.country !== companyToEdit.country,
        service: formData.service !== companyToEdit.service,
        website: formData.website !== (Array.isArray(companyToEdit.website) ? companyToEdit.website[0] : companyToEdit.website),
        logo: logoChanged,
        badge_color: formData.badge_color !== companyToEdit.badge_color,
        status: formData.status !== companyToEdit.status,
        agents: JSON.stringify(Array.from(selectedAgents).sort()) !== JSON.stringify((formData.originalAgentIds || []).sort()),
        clients: JSON.stringify(Array.from(selectedClients).sort()) !== JSON.stringify((formData.originalClientIds || []).sort())
      })
      setHasUnsavedChanges(hasChanges)
    }
  }, [formData, selectedAgents, selectedClients, companyToEdit, existingLogoUrl])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-7xl max-h-[95vh] overflow-hidden p-0 rounded-xl"
        style={{ backgroundColor: theme === 'dark' ? '#111111' : '#f8f9fa' }}
      >
        <DialogTitle className="sr-only">Add Company</DialogTitle>
        <div className="flex h-[95vh]">
          {/* Left Panel - Form */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
              <div className="flex items-center gap-3">
                <Badge className="text-xs h-6 flex items-center rounded-[6px]">
                  Company
                </Badge>
              </div>
              

            </div>

            {/* Company Header */}
            <div className="px-6 py-5">
              {/* Company Name - Editable Title */}
              {isEditingCompany ? (
                <div className="mb-4">
                  <Input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Company Name"
                    className="text-2xl font-semibold h-auto px-3 py-0 !border !border-sidebar-border dark:!border-border !bg-[#ebebeb] dark:!bg-[#0a0a0a] rounded-lg transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                    style={{ minHeight: '2.5rem' }}
                    autoFocus
                    onBlur={() => handleCompanySave(formData.company || '')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCompanySave(formData.company || '')
                      } else if (e.key === 'Escape') {
                        handleCompanyCancel()
                      }
                    }}
                  />
                </div>
              ) : (
                <div 
                  className="text-2xl font-semibold mb-4 px-3 py-0 cursor-pointer hover:bg-[#ebebeb] dark:hover:bg-[#0a0a0a] rounded-lg transition-colors duration-200 flex items-center border border-transparent"
                  style={{ minHeight: '2.5rem' }}
                  onClick={handleCompanyEdit}
                >
                  {formData.company || 'Click to add company name'}
                </div>
              )}
              
              {/* Company Metadata Grid */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                {/* Service */}
                <div className="flex items-center gap-2">
                  <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Service:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className={`px-3 py-1 font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center ${
                          formData.service ? getServiceBadgeClass(formData.service) : 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20'
                        }`}
                      >
                        {formData.service ? serviceOptions.find(opt => opt.value === formData.service)?.label || formData.service : 'Choose Service'}
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2">
                      <div className="space-y-1">
                        {serviceOptions.map((option) => {
                          const isCurrentService = formData.service === option.value;
                          return (
                            <div 
                              key={option.value}
                              className={`flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 ${
                                isCurrentService 
                                  ? 'bg-primary/10 text-primary border border-primary/20 cursor-default' 
                                  : 'hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground cursor-pointer'
                              }`}
                              onClick={isCurrentService ? undefined : () => handleInputChange('service', option.value)}
                            >
                              {option.value === 'workforce' ? (
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              ) : option.value === 'one agent' ? (
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              ) : option.value === 'team' ? (
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              ) : (
                                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                              )}
                              <span className="text-sm font-medium">{option.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Status */}
                <div className="flex items-center gap-2">
                  {formData.status === 'Current Client' ? (
                    <IconCircle className="h-4 w-4 fill-green-500 stroke-none" />
                  ) : formData.status === 'Lost Client' ? (
                    <IconCircle className="h-4 w-4 fill-red-500 stroke-none" />
                  ) : (
                    <IconCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-muted-foreground">Status:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className={`px-3 py-1 font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center ${
                          formData.status ? getStatusBadgeClass(formData.status) : 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20'
                        }`}
                      >
                        {formData.status || 'Set Status'}
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2">
                      <div className="space-y-1">
                        {[
                          { value: 'Current Client' },
                          { value: 'Lost Client' }
                        ].map((statusOption) => {
                          const isCurrentStatus = formData.status === statusOption.value;
                          return (
                            <div 
                              key={statusOption.value}
                              className={`flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 ${
                                isCurrentStatus 
                                  ? 'bg-primary/10 text-primary border border-primary/20 cursor-default' 
                                  : 'hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground cursor-pointer'
                              }`}
                              onClick={isCurrentStatus ? undefined : () => handleInputChange('status', statusOption.value)}
                            >
                              {statusOption.value === 'Current Client' ? (
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              ) : statusOption.value === 'Lost Client' ? (
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              ) : (
                                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                              )}
                              <span className="text-sm font-medium">{statusOption.value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Badge Color */}
                <div className="flex items-center gap-2">
                  <IconTag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Badge Color:</span>
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      color={formData.badge_color}
                      onChange={(color) => handleInputChange('badge_color', color)}
                      open={isColorPickerOpen}
                      onOpenChange={setIsColorPickerOpen}
                    >
                      <div 
                        className="w-5 h-5 rounded-full border border-border cursor-pointer shadow-sm flex-shrink-0" 
                        style={{ backgroundColor: formData.badge_color || '#0EA5E9' }}
                        title="Click to open color picker"
                      />
                    </ColorPicker>
                    <span className="text-xs text-muted-foreground leading-none">
                      {formData.badge_color || '#0EA5E9'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6">
              <Separator />
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 px-6 py-5 overflow-y-auto min-h-0">
              {isLoadingCompany ? (
                <div className="space-y-6">
                  {/* Information Section Skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <div className="rounded-lg border border-[#cecece99] dark:border-border space-y-0">
                      {[...Array(7)].map((_, index) => (
                        <div key={index} className={`grid grid-cols-[180px_auto_1fr] gap-2 h-[33px] items-center ${index === 6 ? '' : 'border-b border-[#cecece99] dark:border-border'}`}>
                          <div className="flex items-center gap-3 min-w-0 px-2">
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                          <div className="min-w-0 flex items-center relative">
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Agents Section Skeleton */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between min-h-[40px]">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-9 w-24" />
                    </div>
                    <div className="rounded-lg border border-[#cecece99] dark:border-border p-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {[...Array(5)].map((_, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                              <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <Skeleton className="h-3 w-16 mb-1" />
                                <Skeleton className="h-2 w-12" />
                              </div>
                              <Skeleton className="w-3 h-3" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clients Section Skeleton */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between min-h-[40px]">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-9 w-24" />
                </div>
                    <div className="rounded-lg border border-[#cecece99] dark:border-border p-4">
                  <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {[...Array(3)].map((_, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                              <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <Skeleton className="h-3 w-20 mb-1" />
                                <Skeleton className="h-2 w-14" />
                            </div>
                              <Skeleton className="w-3 h-3" />
                                </div>
                              ))}
                            </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form id="add-company-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Information Section */}
                  <div>
                    <div className="flex items-center justify-between min-h-[40px]">
                      <h3 className="text-lg font-medium text-muted-foreground">Information</h3>
                    </div>
                    {/* Company Information Container */}
                    <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                    {/* Address */}
                    <DataFieldRow
                      icon={<IconMapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Address"
                      fieldName="address"
                      value={formData.address || ''}
                      onSave={(fieldName, value) => handleInputChange(fieldName as keyof CompanyData, value)}
                      placeholder="-"
                    />

                    {/* Phone */}
                    <DataFieldRow
                      icon={<IconPhone className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Phone"
                      fieldName="phone"
                      value={formData.phone || ''}
                      onSave={(fieldName, value) => {
                            // Only allow numbers, spaces, dashes, and parentheses
                        const cleanValue = value.replace(/[^0-9\s\-\(\)]/g, '')
                        handleInputChange(fieldName as keyof CompanyData, cleanValue)
                          }}
                      placeholder="-"
                          onKeyDown={(e) => {
                        // Allow all navigation and editing keys
                        if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' || 
                            e.key === 'Escape' || e.key === 'Enter' || e.key === 'ArrowLeft' || 
                            e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
                            e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown' ||
                            e.ctrlKey || e.metaKey) {
                          return
                        }
                                // Allow: numbers, space, dash, parentheses
                        if (/[0-9\s\-\(\)]/.test(e.key)) {
                              return
                            }
                            e.preventDefault()
                          }}
                    />

                    {/* Country */}
                    <DataFieldRow
                      icon={<IconGlobe className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Country"
                      fieldName="country"
                      value={formData.country || ''}
                      onSave={(fieldName, value) => handleInputChange(fieldName as keyof CompanyData, value)}
                      placeholder="-"
                      customInput={
                        <Popover>
                          <PopoverTrigger asChild>
                            <div 
                              className={`h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center ${
                                formData.country ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                              style={{ backgroundColor: 'transparent' }}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                }
                              }}
                            >
                              {formData.country || '-'}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2" align="start" side="bottom" sideOffset={4}>
                            <div className="space-y-1">
                              <div className="sticky top-0 z-10 border-b px-0 py-0 mb-2">
                                <div className="relative">
                                  <IconSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search countries..."
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                    className="bg-white/0 dark:bg-white/0 pl-8 border-0 focus:ring-0 shadow-none"
                                    onKeyDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              <div 
                                className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
                                onWheel={(e) => {
                                  // Ensure scroll events work properly in the popover
                                  e.stopPropagation()
                                }}
                              >
                                {filteredCountries.map((country) => (
                                  <div 
                                    key={country}
                                    className={`flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 ${
                                      formData.country === country 
                                        ? 'bg-primary/10 text-primary border border-primary/20 pointer-events-none cursor-default' 
                                        : 'cursor-pointer hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground'
                                    }`}
                                    onClick={() => handleInputChange('country', country)}
                                  >
                                    <span className="text-sm font-medium">{country}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      }
                    />

                    {/* Website */}
                    <DataFieldRow
                      icon={<IconLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Website"
                      fieldName="website"
                      value={formData.website || ''}
                      onSave={(fieldName, value) => handleInputChange(fieldName as keyof CompanyData, value)}
                      placeholder="-"
                    />

                    {/* Company Logo */}
                    <DataFieldRow
                      icon={<IconFile className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Logo"
                      fieldName="logo"
                      value={formData.logo ? formData.logo.name : ''}
                      onSave={() => {}}
                      placeholder="Choose file..."
                      isLast={true}
                      customInput={
                        <div 
                          className="flex items-center gap-2 w-full"
                          onMouseEnter={() => setIsLogoHovered(true)}
                          onMouseLeave={() => setIsLogoHovered(false)}
                        >
                          <input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          <label
                            htmlFor="logo"
                            className="w-full cursor-pointer"
                          >
                            {(formData.logo || formData.logoUrl) ? (
                              <LinkPreview
                                url="#"
                                isStatic={true}
                                imageSrc={logoPreviewUrl || ''}
                                width={200}
                                height={200}
                              >
                                <Input
                                  ref={fileInputRef}
                                  placeholder="-"
                                                                      value={formData.logo ? formData.logo.name : (formData.logoUrl || '')}
                                  readOnly
                                  className="h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none cursor-pointer"
                                  onClick={() => document.getElementById('logo')?.click()}
                                />
                              </LinkPreview>
                            ) : (
                              <Input
                                ref={fileInputRef}
                                placeholder="-"
                                value=""
                                readOnly
                                className="h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none cursor-pointer"
                                onClick={() => document.getElementById('logo')?.click()}
                              />
                            )}
                          </label>
                          
                          {/* Clear button - only show when there's a logo */}
                          {(formData.logo || formData.logoUrl) && (
                            <div className={`flex items-center gap-2 transition-all duration-200 ease-in-out ${
                              isLogoHovered 
                                ? 'opacity-100 translate-x-0' 
                                : 'opacity-0 translate-x-2 pointer-events-none'
                            }`}>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  console.log('🧹 Logo clear button clicked')
                                  console.log('🧹 Before clearing - formData.logo:', formData.logo)
                                  console.log('🧹 Before clearing - formData.logoUrl:', formData.logoUrl)
                                  console.log('🧹 Before clearing - existingLogoUrl:', existingLogoUrl)
                                  
                                  // Clear both the file and the URL using setFormData directly to ensure immediate update
                                  setFormData(prev => {
                                    const newData = {
                                      ...prev,
                                      logo: null,
                                      logoUrl: null
                                    }
                                    console.log('🧹 Setting formData directly:', newData)
                                    return newData
                                  })
                                  // DON'T clear existingLogoUrl - it's needed for comparison to detect changes!
                                  console.log('🧹 Keeping existingLogoUrl for comparison:', existingLogoUrl)
                                  
                                  console.log('🧹 After clearing - formData.logo should be null')
                                  console.log('🧹 After clearing - formData.logoUrl should be null')
                                  console.log('🧹 After clearing - existingLogoUrl should be null')
                                }}
                                className="p-0 hover:text-foreground rounded transition-colors text-muted-foreground"
                                title="Clear logo"
                                tabIndex={-1}
                              >
                                <IconX className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </div>
                </div>

                                  {/* Agents Section */}
                  <div>
                    <div className="flex items-center justify-between min-h-[40px]">
                      <h3 className="text-lg font-medium text-muted-foreground">
                        Agents
                        {selectedAgents.size > 0 && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({selectedAgents.size})
                          </span>
                        )}
                      </h3>
                                              <button
                          type="button"
                          onClick={async () => {
                            // Force hover state to false immediately on click
                            setIsAgentsHovered(false)
                            // Small delay to ensure state update, then open selection
                            setTimeout(() => openAgentSelection(), 100)
                          }}
                          onMouseEnter={() => setIsAgentsHovered(true)}
                          onMouseLeave={() => setIsAgentsHovered(false)}
                          className="text-sm text-primary hover:text-primary/80 transition-all duration-300 cursor-pointer flex items-center gap-2 group"
                        >
                        <AnimatePresence>
                          {isAgentsHovered && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              className="whitespace-nowrap overflow-hidden flex items-center"
                            >
                          Add Agents
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <AnimatePresence mode="wait">
                          {!showAgentSelection && (
                            <motion.div
                              key="agent-icon"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                              <IconPlus className="h-4 w-4" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                    

                    
                    <div className="rounded-lg border border-[#cecece99] dark:border-border">
                      {/* Agent Fields */}
                      <div className="p-4 space-y-4">
                        {isLoadingCompany ? (
                          <div className="space-y-2">
                            {[...Array(2)].map((_, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                                <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                                <div className="flex-1">
                                  <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="w-3 h-3" />
                              </div>
                            ))}
                          </div>
                        ) : selectedAgents.size > 0 ? (
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {selectedAgentsData.map((agent) => (
                                <div key={agent.user_id} className="relative flex items-center gap-2 p-2 px-3 bg-primary/5 border border-primary/20 rounded-lg min-w-0">
                                  <Avatar className="w-6 h-6 flex-shrink-0">
                                    <AvatarImage src={agent.profile_picture || undefined} alt={agent.first_name || 'Agent'} />
                                    <AvatarFallback className="text-xs">
                                      {agent.first_name && agent.last_name 
                                        ? `${agent.first_name.charAt(0)}${agent.last_name.charAt(0)}`
                                        : agent.first_name?.charAt(0) || agent.last_name?.charAt(0) || 'A'
                                      }
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 max-w-[120px]">
                                    <h4 className="text-xs truncate">
                                      {agent.first_name && agent.last_name 
                                        ? `${agent.first_name} ${agent.last_name}` 
                                        : agent.first_name || agent.last_name || 'Unknown Name'
                                      }
                                    </h4>
                                    <span className="text-xs text-muted-foreground truncate block">
                                      {agent.employee_id || 'No ID'}
                                    </span>
                                  </div>
                                  <button
                                                                        onClick={async () => {
                                      const newSelected = new Set(selectedAgents)
                                      newSelected.delete(agent.user_id)
                                      
                                      // Update local state immediately for responsive UI
                                      setSelectedAgents(newSelected)
                                      setSelectedAgentsData(prev => prev.filter(a => a.user_id !== agent.user_id))
                                      
                                      // Real-time database update
                                      if (companyToEdit?.id) {
                                        try {
                                          await updateAssignmentRealTime(agent.user_id, false, 'agent')
                                          console.log(`✅ Real-time agent unassigned: ${agent.user_id}`)
                                        } catch (error) {
                                          console.error('❌ Real-time agent unassignment failed:', error)
                                          // Error handling is done in updateAssignmentRealTime
                                        }
                                      }
                                    }}
                                    className="absolute -top-2 -right-2 w-5 h-5 text-white rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0 shadow-sm hover:shadow-md"
                                    style={{ backgroundColor: theme === 'dark' ? '#626262' : '#888787' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#7a7a7a' : '#9a9a9a'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#626262' : '#888787'}
                                  >
                                    <IconMinus className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <p className="text-sm">No Agents Added</p>
                          </div>
                        )}
                      </div>
                  </div>
                </div>

                {/* Clients Section */}
                <div>
                  <div className="flex items-center justify-between min-h-[40px]">
                    <h3 className="text-lg font-medium text-muted-foreground">
                      Clients
                      {selectedClients.size > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({selectedClients.size})
                        </span>
                      )}
                    </h3>
                                          <button
                        type="button"
                        onClick={async () => {
                          // Force hover state to false immediately on click
                          setIsClientsHovered(false)
                          // Small delay to ensure state update, then open selection
                          setTimeout(() => openClientSelection(), 100)
                        }}
                        onMouseEnter={() => setIsClientsHovered(true)}
                        onMouseLeave={() => setIsClientsHovered(false)}
                        className="text-sm text-primary hover:text-primary/80 transition-all duration-300 cursor-pointer flex items-center gap-2 group"
                      >
                      <AnimatePresence>
                        {isClientsHovered && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="whitespace-nowrap overflow-hidden flex items-center"
                          >
                        Add Clients
                          </motion.span>
                          )}
                      </AnimatePresence>
                      <AnimatePresence mode="wait">
                        {!showClientSelection && (
                          <motion.div
                            key="client-icon"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          >
                            <IconPlus className="h-4 w-4" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                  
                  <div className="rounded-lg border border-[#cecece99] dark:border-border">
                    {/* Client Fields */}
                    <div className="p-4 space-y-4">
                      {isLoadingCompany ? (
                        <div className="space-y-2">
                          {[...Array(2)].map((_, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                              <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                              <div className="flex-1">
                                <Skeleton className="h-3 w-20" />
                              </div>
                              <Skeleton className="w-3 h-3" />
                            </div>
                          ))}
                        </div>
                      ) : selectedClients.size > 0 ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {selectedClientsData.map((client) => (
                                                              <div key={client.user_id} className="relative flex items-center gap-2 p-2 px-3 bg-primary/5 border border-primary/20 rounded-lg min-w-0">
                                <Avatar className="w-6 h-6 flex-shrink-0">
                                  <AvatarImage src={client.profile_picture || undefined} alt={client.first_name || 'Client'} />
                                  <AvatarFallback className="text-xs">
                                    {client.first_name && client.last_name 
                                      ? `${client.first_name.charAt(0)}${client.last_name.charAt(0)}`
                                      : client.first_name?.charAt(0) || client.last_name?.charAt(0) || 'C'
                                    }
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 max-w-[120px]">
                                  <h4 className="text-xs truncate">
                                    {client.first_name && client.last_name 
                                      ? `${client.first_name} ${client.last_name}` 
                                      : client.first_name || client.last_name || 'Unknown Name'
                                    }
                                  </h4>
                                </div>
                                <button
                                    onClick={async () => {
                                    const newSelected = new Set(selectedClients)
                                    newSelected.delete(client.user_id)
                                    
                                      // Update local state immediately for responsive UI
                                      setSelectedClients(newSelected)
                                    setSelectedClientsData(prev => prev.filter(c => c.user_id !== client.user_id))
                                      
                                      // Real-time database update
                                      if (companyToEdit?.id) {
                                        try {
                                          await updateAssignmentRealTime(client.user_id, false, 'client')
                                          console.log(`✅ Real-time client unassigned: ${client.user_id}`)
                                        } catch (error) {
                                          console.error('❌ Real-time client unassignment failed:', error)
                                          // Error handling is done in updateAssignmentRealTime
                                        }
                                      }
                                    }}
                                    className="absolute -top-2 -right-2 w-5 h-5 text-white rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0 shadow-sm hover:shadow-md"
                                    style={{ backgroundColor: theme === 'dark' ? '#626262' : '#888787' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#7a7a7a' : '#888787'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#626262' : '#888787'}
                                  >
                                    <IconMinus className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <p className="text-sm">No Clients Added</p>
                          </div>
                        )}
                      </div>
                  </div>
                </div>
                              </form>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-sidebar">
              <div className="flex items-center gap-3">
                {/* Show Save button only when adding a new company (not editing) AND modal is open */}
                {isOpen && !companyToEdit?.id && (
                  <Button type="submit" form="add-company-form" disabled={isSubmitting || !isFormValid()} size="sm">
                    {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
                )}

                {/* Show Delete button only when editing an existing company AND modal is open */}
                {isOpen && companyToEdit?.id && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    size="sm"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-96 flex flex-col border-l border-[#cecece99] dark:border-border h-full bg-[#ebebeb] dark:bg-[#0a0a0a]">
            <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border flex-shrink-0">
              <h3 className="font-medium">
                {showClientSelection ? 'Select Clients' : showAgentSelection ? 'Select Agents' : 'Activity'}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 bg-[#ebebeb] dark:bg-[#0a0a0a]">
              {showAgentSelection ? (
                // Agent Selection Content
                <div className="flex flex-col h-full space-y-4">
                  {/* Search and Filter */}
                  <div className="space-y-3 flex-shrink-0">
                    <div className="relative">
                      <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                          placeholder="Search by name or employee ID..."
                        value={agentSearch}
                        onChange={(e) => setAgentSearch(e.target.value)}
                        className="pl-9"
                      />
                      {agentSearch && (
                        <button
                          onClick={() => setAgentSearch('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <IconX className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Agents List */}
                  <div 
                    data-agent-list
                    className="space-y-4 flex-1 overflow-y-auto min-h-0 px-2 py-2"
                    onScroll={(e) => {
                      const target = e.target as HTMLDivElement
                      const { scrollTop, scrollHeight, clientHeight } = target
                      
                      // Debug scroll values
                      console.log('Scroll Debug:', {
                        scrollTop,
                        scrollHeight,
                        clientHeight,
                        threshold: scrollHeight * 0.8,
                        shouldLoad: scrollTop + clientHeight >= scrollHeight * 0.8,
                        hasMore,
                        isLoadingMore
                      })
                      
                      // Load more when user scrolls to 80% of the content
                      if (scrollTop + clientHeight >= scrollHeight * 0.8 && hasMore && !isLoadingMore) {
                        console.log('Loading more agents...')
                        loadMoreAgents()
                      }
                    }}
                  >
                    {isLoadingAgents ? (
                      <div className="space-y-3">
                        {[...Array(6)].map((_, index) => (
                          <div key={index} className="p-4 border rounded-lg animate-pulse">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                              </div>
                              <div className="w-16 h-6 bg-muted rounded flex-shrink-0"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : displayAgents.length > 0 ? (
                      <>
                        <div className="space-y-3">
                          {displayAgents.map((agent) => (
                            <div 
                              key={agent.user_id}
                              className={`p-4 border rounded-lg transition-all duration-200 ${
                                agent.member_company && agent.member_company !== companyToEdit?.company
                                  ? 'opacity-50 cursor-not-allowed bg-muted/30' 
                                  : `cursor-pointer ${
                                      selectedAgents.has(agent.user_id)
                                        ? 'border-primary/50 bg-primary/5'
                                        : 'hover:border-primary/50 hover:bg-primary/5'
                                    }`
                              }`}
                                                                onClick={async () => {
                                // Disable selection for agents assigned to other companies
                                if (agent.member_company && agent.member_company !== companyToEdit?.company) return
                                
                                const newSelected = new Set(selectedAgents)
                                    const wasSelected = newSelected.has(agent.user_id)
                                    
                                    if (wasSelected) {
                                  newSelected.delete(agent.user_id)
                                  // Remove from selectedAgentsData when unselecting
                                  setSelectedAgentsData(prev => prev.filter(a => a.user_id !== agent.user_id))
                                } else {
                                  newSelected.add(agent.user_id)
                                  // Only add if not already in selectedAgentsData
                                  setSelectedAgentsData(prev => {
                                    if (prev.some(a => a.user_id === agent.user_id)) {
                                      return prev
                                    }
                                    return [...prev, agent]
                                  })
                                }
                                    
                                    // Update local state immediately for responsive UI
                                setSelectedAgents(newSelected)
                                    
                                    // Real-time database update
                                    if (companyToEdit?.id) {
                                      try {
                                        await updateAssignmentRealTime(agent.user_id, !wasSelected, 'agent')
                                        console.log(`✅ Real-time agent assignment updated: ${agent.user_id} ${!wasSelected ? 'assigned' : 'unassigned'}`)
                                      } catch (error) {
                                        console.error('❌ Real-time agent update failed:', error)
                                        // Error handling is done in updateAssignmentRealTime
                                      }
                                    }
                              }}
                            >
                              <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
                                <div className="relative">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={agent.profile_picture || undefined} alt={agent.first_name || 'Agent'} />
                                    <AvatarFallback>
                                      {agent.first_name && agent.last_name 
                                        ? `${agent.first_name.charAt(0)}${agent.last_name.charAt(0)}`
                                        : agent.first_name?.charAt(0) || agent.last_name?.charAt(0) || 'A'
                                      }
                                    </AvatarFallback>
                                  </Avatar>
                                  {selectedAgents.has(agent.user_id) && (!agent.member_company || agent.member_company === companyToEdit?.company) && (
                                    <div className="absolute inset-0 rounded-full" style={{ backgroundColor: '#73a2bb80' }}></div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-medium text-sm truncate">
                                    {agent.first_name && agent.last_name 
                                      ? `${agent.first_name} ${agent.last_name}` 
                                      : agent.first_name || agent.last_name || 'Unknown Name'
                                    }
                                  </h4>
                                  <span 
                                    className="text-xs font-medium truncate block"
                                    style={{ 
                                      color: agent.member_company 
                                        ? (agent.member_company === companyToEdit?.company ? '#6B7280' : agent.member_badge_color || '#6B7280')
                                        : '#6B7280'
                                    }}
                                    title={agent.member_company === companyToEdit?.company ? 'Currently Assigned' : (agent.member_company || 'No Member')}
                                  >
                                    {agent.member_company === companyToEdit?.company ? 'Currently Assigned' : (agent.member_company || 'No Member')}
                                  </span>
                                </div>
                                {agent.employee_id && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs px-2 py-0.5 border flex-shrink-0"
                                    style={
                                      theme === 'dark'
                                        ? { backgroundColor: '#44464880', borderColor: '#444648', color: '#ffffff' }
                                        : { backgroundColor: '#44464814', borderColor: '#a5a5a540', color: '#444648' }
                                    }
                                  >
                                    {agent.employee_id}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                                          {/* Load More Indicator */}
                  {isLoadingMore && (
                    <div className="text-center py-4">
                      <div className="flex items-center justify-center space-x-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0s' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  )}
                  



                      </>
                    ) : (
                                              <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm font-medium">No Agents Found</p>
                        </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4 border-t flex-shrink-0">
                    {selectedAgents.size > 0 ? (
                      <Button 
                        className="w-full"
                        onClick={() => {
                          // TODO: Handle adding selected agents to company
                          const selectedAgentIds = Array.from(selectedAgents)
                          const selectedAgentDetails = agents.filter(agent => 
                            selectedAgentIds.includes(agent.user_id)
                          )
                          console.log('Adding agents to company:', selectedAgentDetails)
                          
                          // Here you would typically:
                          // 1. Call an API to add agents to the company
                          // 2. Update the company's agent list
                          // 3. Close the agent selection
                          // 4. Show success message
                          
                          closeSelectionContainers()
                        }}
                      >
                        Done
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={closeSelectionContainers}
                      >
                        Done
                      </Button>
                    )}
                  </div>
                </div>
              ) : showClientSelection ? (
                // Client Selection Content
                <div className="flex flex-col h-full space-y-4">
                  {/* Search and Filter */}
                  <div className="space-y-3 flex-shrink-0">
                    <div className="relative">
                      <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                              <Input
                          placeholder="Search by name..."
                          value={clientSearch}
                          onChange={(e) => handleClientSearch(e.target.value)}
                          className="pl-9"
                        />
                      {clientSearch && (
                        <button
                          onClick={() => handleClientSearch('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <IconX className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Clients List */}
                  <div 
                    data-client-list
                    className="space-y-4 flex-1 overflow-y-auto min-h-0 px-2 py-2"
                    onScroll={(e) => {
                      const target = e.target as HTMLDivElement
                      const { scrollTop, scrollHeight, clientHeight } = target
                      
                      // Debug scroll values
                      console.log('Client Scroll Debug:', {
                        scrollTop,
                        scrollHeight,
                        clientHeight,
                        threshold: scrollHeight * 0.8,
                        shouldLoad: scrollTop + clientHeight >= scrollHeight * 0.8,
                        hasMoreClients,
                        isLoadingMoreClients
                      })
                      
                      // Load more when user scrolls to 80% of the content
                      if (scrollTop + clientHeight >= scrollHeight * 0.8 && hasMoreClients && !isLoadingMoreClients) {
                        console.log('Loading more clients...')
                        loadMoreClients()
                      }
                    }}
                  >
                    {isLoadingClients ? (
                      <div className="space-y-3">
                        {[...Array(6)].map((_, index) => (
                          <div key={index} className="p-4 border rounded-lg animate-pulse">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                              </div>
                              <div className="w-16 h-6 bg-muted rounded flex-shrink-0"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : displayClients.length > 0 ? (
                      <>
                        <div className="space-y-3">
                          {displayClients.map((client) => (
                            <div 
                              key={client.user_id}
                              className={`p-4 border rounded-lg transition-all duration-200 ${
                                client.member_company && client.member_company !== companyToEdit?.company
                                  ? 'opacity-50 cursor-not-allowed bg-muted/30' 
                                  : `cursor-pointer ${
                                      selectedClients.has(client.user_id)
                                        ? 'border-primary/50 bg-primary/5'
                                        : 'hover:border-primary/50 hover:bg-primary/5'
                                    }`
                              }`}
                              onClick={async () => {
                                // Disable selection for clients assigned to other companies
                                if (client.member_company && client.member_company !== companyToEdit?.company) return
                                
                                const newSelected = new Set(selectedClients)
                                const wasSelected = newSelected.has(client.user_id)
                                
                                if (wasSelected) {
                                  newSelected.delete(client.user_id)
                                  // Remove from selectedClientsData when unselecting
                                  setSelectedClientsData(prev => prev.filter(c => c.user_id !== client.user_id))
                                } else {
                                  newSelected.add(client.user_id)
                                  // Only add if not already in selectedClientsData
                                  setSelectedClientsData(prev => {
                                    if (prev.some(c => c.user_id === client.user_id)) {
                                      return prev
                                    }
                                    return [...prev, client]
                                  })
                                }
                                
                                // Update local state immediately for responsive UI
                                setSelectedClients(newSelected)
                                
                                // Real-time database update
                                if (companyToEdit?.id) {
                                  try {
                                    await updateAssignmentRealTime(client.user_id, !wasSelected, 'client')
                                    console.log(`✅ Real-time client assignment updated: ${client.user_id} ${!wasSelected ? 'assigned' : 'unassigned'}`)
                                  } catch (error) {
                                    console.error('❌ Real-time client update failed:', error)
                                    // Error handling is done in updateAssignmentRealTime
                                  }
                                }
                              }}
                            >
                              <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
                                <div className="relative">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={client.profile_picture || undefined} alt={client.first_name || 'Client'} />
                                    <AvatarFallback>
                                      {client.first_name && client.last_name 
                                        ? `${client.first_name.charAt(0)}${client.last_name.charAt(0)}`
                                        : client.first_name?.charAt(0) || client.last_name?.charAt(0) || 'C'
                                      }
                                    </AvatarFallback>
                                  </Avatar>
                                  {selectedClients.has(client.user_id) && (!client.member_company || client.member_company === companyToEdit?.company) && (
                                    <div className="absolute inset-0 rounded-full" style={{ backgroundColor: '#73a2bb80' }}></div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-medium text-sm truncate">
                                    {client.first_name && client.last_name 
                                      ? `${client.first_name} ${client.last_name}` 
                                      : client.first_name || client.last_name || 'Unknown Name'
                                    }
                                  </h4>
                                  <span 
                                    className="text-xs font-medium truncate block"
                                    style={{ 
                                      color: client.member_company 
                                        ? (client.member_company === companyToEdit?.company ? '#6B7280' : client.member_badge_color || '#6B7280')
                                        : '#6B7280'
                                    }}
                                    title={client.member_company === companyToEdit?.company ? 'Currently Assigned' : (client.member_company || 'No Member')}
                                  >
                                    {client.member_company === companyToEdit?.company ? 'Currently Assigned' : (client.member_company || 'No Member')}
                                  </span>
                                </div>

                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Load More Indicator */}
                        {isLoadingMoreClients && (
                          <div className="text-center py-4">
                            <div className="flex items-center justify-center space-x-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0s' }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.2s' }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </div>
                          </div>
                        )}
                        

                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm font-medium">No Clients Found</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex-shrink-0 space-y-2">
                    {selectedClients.size > 0 ? (
                      <Button 
                        className="w-full"
                        onClick={() => {
                          // TODO: Handle adding selected clients to company
                          const selectedClientIds = Array.from(selectedClients)
                          const selectedClientDetails = clients.filter(client => 
                            selectedClientIds.includes(client.user_id)
                          )
                          console.log('Adding clients to company:', selectedClientDetails)
                          
                          // Here you would typically:
                          // 1. Call an API to add clients to the company
                          // 2. Update the company's client list
                          // 3. Close the client selection
                          // 4. Show success message
                          
                          closeSelectionContainers()
                        }}
                      >
                        Done
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={closeSelectionContainers}
                      >
                        Done
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                // Activity Content - Shows company activity and recent changes
                <div className="space-y-4">
                  {companyToEdit?.id ? (
                    <MembersActivityLog 
                      memberId={companyToEdit.id} 
                      companyName={companyToEdit.company || 'Unknown Company'} 
                      onRefresh={() => {
                        // Real-time updates handle refresh automatically
                      }}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No Activities Found</p>
                        </div>
                  )}
                      </div>
              )}


                        </div>



            {/* Comment Input Section - Outside main content */}
            {!showAgentSelection && !showClientSelection && (
              <div className="px-3 pb-3 bg-[#ebebeb] dark:bg-[#0a0a0a]">
                <div className="flex gap-2">
                                      <div className="flex-1">
                      <form onSubmit={handleCommentSubmit}>
                        <div className={`border rounded-lg bg-sidebar overflow-hidden transition-all duration-300 ease-in-out [&>*]:border-none [&>*]:outline-none [&>textarea]:transition-all [&>textarea]:duration-300 [&>textarea]:ease-in-out ${
                          isCommentFocused || comment.trim() 
                            ? 'border-muted-foreground' 
                            : 'border-border'
                        }`}>
                          <textarea 
                            placeholder="Write a comment..." 
                            value={comment}
                            onChange={(e) => {
                              setComment(e.target.value)
                              // Auto-resize the textarea
                              e.target.style.height = 'auto'
                              e.target.style.height = e.target.scrollHeight + 'px'
                            }}
                            onFocus={(e) => {
                              setIsCommentFocused(true)
                            }}
                            onBlur={(e) => {
                              setIsCommentFocused(false)
                            }}
                            className="w-full resize-none border-0 bg-transparent text-foreground px-3 py-2 shadow-none text-sm focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 dark:text-foreground placeholder:text-muted-foreground align-middle transition-all duration-300 ease-in-out min-h-[36px] overflow-hidden"
                            disabled={isSubmittingComment}
                            rows={1}
                          />
                          
                          {/* Send button - only show when expanded, inside the textarea container */}
                          {(isCommentFocused || comment.trim()) && (
                            <div className="p-1 flex justify-end animate-in fade-in duration-300">
                              <button
                                type="submit"
                                onClick={handleCommentSubmit}
                                disabled={!comment.trim() || isSubmittingComment}
                                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              >
                                {isSubmittingComment ? (
                                  <IconClock className="h-3 w-3 text-muted-foreground animate-spin" />
                                  ) : (
                                  <SendHorizontal className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                        </div>
                          )}
                      </div>
                      </form>
                        </div>
                        </div>
                        </div>
                      )}
                      </div>
                </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-[380px] w-[90vw] rounded-xl [&>button]:hidden">
          <div className="flex flex-col space-y-1.5 text-center sm:text-center">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Delete</h2>
            </div>
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">Are you sure you want to delete this company? This action cannot be undone and will remove all associated data.</p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowDeleteConfirmation(false)}
            >
              No
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Yes'}
            </Button>
        </div>
      </DialogContent>
      </Dialog>
    </Dialog>
  )
}
