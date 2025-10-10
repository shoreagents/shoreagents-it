"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconGlobe, IconWorld, IconCreditCard, IconPlus, IconUpload, IconX, IconSearch, IconLink, IconMinus, IconCheck, IconSun, IconMoon, IconTrophy, IconMedal, IconCrown, IconStar } from "@tabler/icons-react"
import { useRealtimeCompanies } from '@/hooks/use-realtime-companies'
import { SendHorizontal, Target } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataFieldRow } from "@/components/ui/fields"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Popover, PopoverContent, PopoverTrigger, PopoverItem } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"
import { ColorPicker } from "@/components/ui/color-picker"
import { LinkPreview } from "@/components/ui/link-preview"
import { CompaniesActivityLog } from "@/components/companies-activity-log"
import { Comment } from "@/components/ui/comment"
import { AgentSelection, type Agent } from "@/components/agent-selection"
import { ClientSelection, type Client } from "@/components/client-selection"




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
  shift: string | null
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
  selectedAgentsData?: Array<{user_id: number, first_name: string | null, last_name: string | null, employee_id: string | null, job_title: string | null, profile_picture: string | null, company_name: string | null, company_badge_color: string | null}>
  selectedClientsData?: Array<{user_id: number, first_name: string | null, last_name: string | null, profile_picture: string | null, company_name: string | null, company_badge_color: string | null}>
}

const serviceOptions = [
  { value: 'One Agent', label: 'One Agent' },
  { value: 'Team', label: 'Team' },
  { value: 'Workforce', label: 'Workforce' }
]

// Badge helper functions (matching the ticket modal color scheme)
const getServiceBadgeClass = (service: string | null): string => {
  const s = service || ''
  if (s === 'Workforce') {
    return 'text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20'
  }
  if (s === 'One Agent') {
    return 'text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20'
  }
  if (s === 'Team') {
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
  
  // Real-time updates for company changes
  const { isConnected } = useRealtimeCompanies({
    autoConnect: true,
    onCompanyUpdated: (updatedCompany, oldCompany) => {
      if (companyToEdit?.id && updatedCompany.id === companyToEdit.id) {
        console.log('🔄 Real-time company update received:', updatedCompany)
        console.log('🔍 Old company data:', oldCompany)
        console.log('🔍 New company data:', updatedCompany)
        
        // Update the company data with real-time changes
        // Handle null values properly by checking if the field exists in the update
        console.log('🔄 Updating form data with real-time changes:')
        console.log('  Service field in update:', updatedCompany.service)
        console.log('  Service field type:', typeof updatedCompany.service)
        console.log('  Service field exists:', updatedCompany.hasOwnProperty('service'))
        
        setFormData(prev => {
          console.log('  Current form data service:', prev.service)
          
          const newData = {
            ...prev,
            company: updatedCompany.hasOwnProperty('company') ? updatedCompany.company : prev.company,
            address: updatedCompany.hasOwnProperty('address') ? updatedCompany.address : prev.address,
            phone: updatedCompany.hasOwnProperty('phone') ? updatedCompany.phone : prev.phone,
            country: updatedCompany.hasOwnProperty('country') ? updatedCompany.country : prev.country,
            service: updatedCompany.hasOwnProperty('service') ? updatedCompany.service : prev.service,
            website: updatedCompany.hasOwnProperty('website') ? updatedCompany.website : prev.website,
            shift: updatedCompany.hasOwnProperty('shift') ? updatedCompany.shift : prev.shift,
            badge_color: updatedCompany.hasOwnProperty('badge_color') ? updatedCompany.badge_color : prev.badge_color,
            status: updatedCompany.hasOwnProperty('status') ? updatedCompany.status : prev.status
          }
          
          console.log('🔄 New form data after real-time update:', newData)
          return newData
        })
        
        // Also update localShift state if shift field was updated
        if (updatedCompany.hasOwnProperty('shift')) {
          console.log('🔄 Updating localShift with real-time shift value:', updatedCompany.shift)
          setLocalShift(updatedCompany.shift)
        }
      }
    },
    onAgentCompanyChanged: (agent, oldAgent) => {
      console.log('🔍 Agent company change detected:', { agent, oldAgent, companyToEditId: companyToEdit?.id })
      
      if (companyToEdit?.id && agent.company_id === companyToEdit.id) {
        console.log('🔄 Real-time agent assignment change:', agent)
        console.log('🔍 Agent data fields available:', Object.keys(agent))
        console.log('🔍 Company data available:', { company: companyToEdit.company, badge_color: companyToEdit.badge_color })
        
        // Agent was assigned to this company
        setSelectedAgents(prev => {
          const newSet = new Set(prev)
          newSet.add(agent.user_id)
          console.log('✅ Updated selected agents:', Array.from(newSet))
          return newSet
        })
        
        // Add the agent data directly to selectedAgentsData
        setSelectedAgentsData(prev => {
          // Check if agent already exists to avoid duplicates
          if (prev.some(a => a.user_id === agent.user_id)) {
            console.log('✅ Agent already exists in selectedAgentsData:', agent.user_id)
            return prev
          }
          
          // Check if we have all required fields
          const hasRequiredFields = agent.first_name && agent.last_name
          
          if (hasRequiredFields) {
            // Create agent object with required fields
            const agentData = {
              user_id: agent.user_id,
              first_name: agent.first_name,
              last_name: agent.last_name,
              profile_picture: agent.profile_picture || null,
              employee_id: agent.employee_id || null,
              job_title: agent.job_title || null,
              company_name: companyToEdit.company || null,
              company_badge_color: companyToEdit.badge_color || null
            }
            
            console.log('✅ Adding new agent to selectedAgentsData with complete data:', agentData)
            const newState = [...prev, agentData]
            console.log('✅ Final selectedAgentsData state:', newState)
            return newState
          } else {
            // If we don't have complete data, fetch it
            console.log('⚠️ Agent data incomplete, fetching complete data for user_id:', agent.user_id)
            fetch(`/api/agents/modal?companyId=${companyToEdit.id}&limit=1000`)
              .then(response => response.json())
              .then(data => {
                const companyAgents = data.agents || []
                const newAgent = companyAgents.find((a: any) => a.user_id === agent.user_id)
                if (newAgent) {
                  console.log('✅ Fetched complete agent data:', newAgent)
                  setSelectedAgentsData(prev => {
                    if (prev.some((a: any) => a.user_id === agent.user_id)) {
                      return prev
                    }
                    return [...prev, newAgent]
                  })
                }
              })
              .catch(error => {
                console.error('❌ Failed to fetch complete agent data:', error)
              })
            
            // Return current state while fetching
            return prev
          }
        })
      } else if (companyToEdit?.id && oldAgent?.company_id === companyToEdit.id && agent.company_id !== companyToEdit.id) {
        console.log('🔄 Real-time agent unassignment:', agent)
        // Agent was unassigned from this company
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
          agentCompanyId: agent.company_id,
          oldAgentCompanyId: oldAgent?.company_id,
          companyToEditId: companyToEdit?.id
        })
      }
    },
    onClientCompanyChanged: (client, oldClient) => {
      console.log('🔍 Client company change detected:', { client, oldClient, companyToEditId: companyToEdit?.id })
      
      if (companyToEdit?.id && client.company_id === companyToEdit.id) {
        console.log('🔄 Real-time client assignment change:', client)
        console.log('🔍 Client data fields available:', Object.keys(client))
        console.log('🔍 Company data available:', { company: companyToEdit.company, badge_color: companyToEdit.badge_color })
        
        // Client was assigned to this company
        setSelectedClients(prev => {
          const newSet = new Set(prev)
          newSet.add(client.user_id)
          console.log('✅ Updated selected clients:', Array.from(newSet))
          return newSet
        })
        
        // Add the client data directly to selectedClientsData
        setSelectedClientsData(prev => {
          // Check if client already exists to avoid duplicates
          if (prev.some(c => c.user_id === client.user_id)) {
            console.log('✅ Client already exists in selectedClientsData:', client.user_id)
            return prev
          }
          
          // Check if we have all required fields
          const hasRequiredFields = client.first_name && client.last_name
          
          if (hasRequiredFields) {
            // Create client object with required fields
            const clientData = {
              user_id: client.user_id,
              first_name: client.first_name,
              last_name: client.last_name,
              profile_picture: client.profile_picture || null,
              company_name: companyToEdit.company || null,
              company_badge_color: companyToEdit.badge_color || null
            }
            
            console.log('✅ Adding new client to selectedClientsData with complete data:', clientData)
            const newState = [...prev, clientData]
            console.log('✅ Final selectedClientsData state:', newState)
            return newState
          } else {
            // If we don't have complete data, fetch it
            console.log('⚠️ Client data incomplete, fetching complete data for user_id:', client.user_id)
            fetch(`/api/clients/modal?companyId=${companyToEdit.id}&limit=1000`)
              .then(response => response.json())
              .then(data => {
                const companyClients = data.clients || []
                const newClient = companyClients.find((c: any) => c.user_id === client.user_id)
                if (newClient) {
                  console.log('✅ Fetched complete client data:', newClient)
                  setSelectedClientsData(prev => {
                    if (prev.some((c: any) => c.user_id === client.user_id)) {
                      return prev
                    }
                    return [...prev, newClient]
                  })
                }
              })
              .catch(error => {
                console.error('❌ Failed to fetch complete client data:', error)
              })
            
            // Return current state while fetching
            return prev
          }
        })
      } else if (companyToEdit?.id && oldClient?.company_id === companyToEdit.id && client.company_id !== companyToEdit.id) {
        console.log('🔄 Real-time client unassignment:', client)
        // Client was unassigned from this company
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
          clientCompanyId: client.company_id,
          oldClientCompanyId: oldClient?.company_id,
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
        
        // Handle company comment updates
        if (message.type === 'company_comment_update') {
          const { action, record, old_record } = message.data
          console.log('🔍 Processing comment update:', { action, record, old_record, companyToEditId: companyToEdit.id })
          
          if (record && record.company_id === companyToEdit.id) {
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
              recordCompanyId: record?.company_id,
              companyToEditId: companyToEdit.id
            })
          }
        }
        
        // Handle company activity updates
        if (message.type === 'company_activity_update') {
          const { action, record, old_record } = message.data
          console.log('🔍 Processing activity update:', { action, record, old_record, companyToEditId: companyToEdit.id })
          
          if (record && record.company_id === companyToEdit.id) {
            console.log('🔄 Real-time activity update received:', { action, record })
            
            // Real-time updates will automatically refresh the activity log
            // The CompaniesActivityLog component will receive live updates
          } else {
            console.log('❌ Activity update not relevant for current company:', {
              recordCompanyId: record?.company_id,
              companyToEditId: companyToEdit.id
            })
          }
        }
        
        // Log any other message types for debugging
        if (message.type !== 'company_comment_update' && message.type !== 'company_activity_update') {
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
      
      // Update company data - merge localShift into formData
      const dataToUpdate = {
        ...formData,
        shift: localShift !== null ? localShift : formData.shift
      }
      await updateDatabase(dataToUpdate)
      
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
  const getMissingRequiredFields = () => {
    const missing: string[] = []
    
    if (!formData.company.trim()) {
      missing.push('Company Name')
    }
    
    return missing
  }

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
    
    // Only check for missing required fields when editing an existing company
    // For new companies, allow closing without validation
    if (companyToEdit?.id) {
      const missingFields = getMissingRequiredFields()
      if (missingFields.length > 0) {
        setMissingFields(missingFields)
        setShowRequiredFieldsWarning(true)
        return
      }
    }
    
    if (companyToEdit?.id && hasUnsavedChanges) {
      // Auto-save company data changes before closing
      try {
        console.log('🔄 Auto-saving changes before close...')
        // Merge localShift into formData
        const dataToUpdate = {
          ...formData,
          shift: localShift !== null ? localShift : formData.shift
        }
        await updateDatabase(dataToUpdate)
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
  const [agents, setAgents] = React.useState<Array<{user_id: number, first_name: string | null, last_name: string | null, employee_id: string | null, job_title: string | null, profile_picture: string | null, company_name: string | null, company_badge_color: string | null}>>([])
  const [selectedAgents, setSelectedAgents] = React.useState<Set<number>>(new Set())
  const [selectedAgentsData, setSelectedAgentsData] = React.useState<Array<{user_id: number, first_name: string | null, last_name: string | null, employee_id: string | null, job_title: string | null, profile_picture: string | null, company_name: string | null, company_badge_color: string | null}>>([])
  const [isLoadingAgents, setIsLoadingAgents] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [isLoadingCompany, setIsLoadingCompany] = React.useState(false)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  const [totalCount, setTotalCount] = React.useState(0)
  
  // Client-related state variables
  const [selectedClients, setSelectedClients] = React.useState<Set<number>>(new Set())
  const [selectedClientsData, setSelectedClientsData] = React.useState<Array<{user_id: number, first_name: string | null, last_name: string | null, profile_picture: string | null, company_name: string | null, company_badge_color: string | null}>>([])
  const [showClientSelection, setShowClientSelection] = React.useState(false)
  const [clientSearch, setClientSearch] = React.useState('')
  const [isLoadingClients, setIsLoadingClients] = React.useState(false)
  const [clients, setClients] = React.useState<Array<{user_id: number, first_name: string | null, last_name: string | null, profile_picture: string | null, company_name: string | null, company_badge_color: string | null}>>([])
  const [displayClients, setDisplayClients] = React.useState<Array<{user_id: number, first_name: string | null, last_name: string | null, profile_picture: string | null, company_name: string | null, company_badge_color: string | null}>>([])
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
    service: 'One Agent',
    website: '',
    shift: '',
    logo: null,
    badge_color: '#0EA5E9',
    status: 'Current Client'
  })
  const [existingLogoUrl, setExistingLogoUrl] = React.useState<string | null>(null)
  const [localShift, setLocalShift] = React.useState<string | null>(null)

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
      // When opening for a new company, start in edit mode
      // When opening for an existing company, start in view mode
      setIsEditingCompany(!companyToEdit)
    }
  }, [isOpen, companyToEdit])

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
      
      // Update database - merge localShift into formData
      const dataToUpdate = {
        ...formData,
        shift: localShift !== null ? localShift : formData.shift
      }
      await updateDatabase(dataToUpdate)
      
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
      // Always send shift field (use localShift if available, otherwise data.shift)
      const shiftValue = localShift !== null ? localShift : data.shift
      console.log('🔍 Shift value for update submission:', { localShift, dataShift: data.shift, shiftValue })
      if (shiftValue) formDataToSend.append('shift', shiftValue)
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
      
      const dbResponse = await fetch(`/api/companies/${companyToEdit.id}`, {
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
      const body = { company_id: isSelected ? companyToEdit.id : null }
      
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
            await fetch(`/api/companies/${companyToEdit.id}/log-assignments`, {
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
            await fetch(`/api/companies/${companyToEdit.id}/log-assignments`, {
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
            body: JSON.stringify({ company_id: companyToEdit.id })
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
            body: JSON.stringify({ company_id: companyToEdit.id })
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
              body: JSON.stringify({ company_id: null })
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
              body: JSON.stringify({ company_id: null })
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
            companyId: companyToEdit.id,
            originalAgentIds,
            currentAgentIds,
            originalClientIds,
            currentClientIds,
            userId: currentUserId,
            formDataKeys: Object.keys(formData),
            hasOriginalAgentIds: 'originalAgentIds' in formData,
            hasOriginalClientIds: 'originalClientIds' in formData
          })
          
          const response = await fetch(`/api/companies/${companyToEdit.id}/log-assignments`, {
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
        console.log('🔍 API response data:', data)
        console.log('🔍 API response structure:', {
          hasAgents: !!data.agents,
          agentsLength: data.agents?.length || 0,
          hasTotalCount: !!data.totalCount,
          totalCount: data.totalCount,
          hasPagination: !!data.pagination,
          pagination: data.pagination
        })
        
        if (append) {
          setAgents(prev => [...prev, ...(data.agents || [])])
        } else {
          setAgents(data.agents || [])
        }
        
        setTotalCount(data.totalCount || 0)
        setCurrentPage(page)
        
        // Calculate hasMore based on totalCount and current items loaded
        const totalItems = data.totalCount || 0
        const currentItems = append ? agents.length + (data.agents?.length || 0) : (data.agents?.length || 0)
        setHasMore(currentItems < totalItems)
        
        console.log('Pagination Debug:', {
          page,
          totalCount: data.totalCount,
          currentItems,
          hasMore: currentItems < totalItems,
          agentsInResponse: data.agents?.length || 0,
          totalAgentsAfterUpdate: currentItems,
          searchQuery
        })
        
        // Auto-load more pages if content height is too short for scrolling
        if (page === 1 && !searchQuery.trim() && data.totalCount > 20) {
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
    console.log('🔍 loadMoreAgents called:', { 
      hasMore, 
      isLoadingMore, 
      currentPage, 
      agentSearch,
      agentsLength: agents.length,
      totalCount
    })
    if (hasMore && !isLoadingMore) {
      console.log('✅ Fetching next page:', currentPage + 1)
      fetchAgents(currentPage + 1, true, agentSearch)
    } else {
      console.log('❌ Cannot load more:', { 
        hasMore, 
        isLoadingMore, 
        reason: !hasMore ? 'hasMore is false' : 'isLoadingMore is true' 
      })
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

  const fetchCompanyAgents = async (companyId: number) => {
    try {
      console.log('🔄 fetchCompanyAgents called with companyId:', companyId)
      setIsLoadingCompany(true)
      const response = await fetch(`/api/agents/modal?companyId=${companyId}&limit=1000`)
      console.log('🔄 fetchCompanyAgents response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('🔄 fetchCompanyAgents response data:', data)
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
        
        console.log('✅ Loaded company agents:', companyAgents)
      } else {
        console.error('❌ Failed to fetch company agents:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Error fetching company agents:', error)
    } finally {
      console.log('🔄 fetchCompanyAgents completed, setting isLoadingCompany to false')
      setIsLoadingCompany(false)
    }
  }

  const fetchCompanyClients = async (companyId: number) => {
    try {
      console.log('🔄 fetchCompanyClients called with companyId:', companyId)
      // Use the utility function to get clients for the company
      const response = await fetch(`/api/clients/modal?companyId=${companyId}&limit=1000`)
      console.log('🔄 fetchCompanyClients response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('🔄 fetchCompanyClients response data:', data)
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
        
        console.log('✅ Loaded company clients:', companyClients)
      } else {
        console.error('❌ Failed to fetch company clients:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Error fetching company clients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check for missing required fields
    const missingFields = getMissingRequiredFields()
    if (missingFields.length > 0) {
      setMissingFields(missingFields)
      setShowRequiredFieldsWarning(true)
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
      // Always send shift field (use localShift if available, otherwise formData.shift)
      const shiftValue = localShift !== null ? localShift : formData.shift
      console.log('🔍 Shift value for submission:', { localShift, formDataShift: formData.shift, shiftValue })
      if (shiftValue) formDataToSend.append('shift', shiftValue)
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
      const response = await fetch('/api/companies', {
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
      
      // Update selected agents with the new company_id if any agents are selected
      if (selectedAgents.size > 0) {
        const companyId = result.company.id
        const agentIds = Array.from(selectedAgents)
        
        try {
          // Update each selected agent with the new company_id
          const updatePromises = agentIds.map(async (agentId) => {
            const updateResponse = await fetch(`/api/agents/${agentId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                company_id: companyId
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
            console.log('All selected agents updated successfully with company_id:', companyId)
          } else {
            console.warn(`${successCount}/${agentIds.length} agents updated successfully`)
          }
        } catch (error) {
          console.error('Error updating agents with company_id:', error)
        }
      }

      // Handle agent deselection in edit mode
      if (companyToEdit?.id) {
        try {
          // Get all agents that were originally assigned to this company
          const originalAgentIds = formData.originalAgentIds || []
          
          // Find agents that were deselected (in original but not in current selection)
          const deselectedAgentIds = originalAgentIds.filter(id => !selectedAgents.has(id))
          
          // Remove company_id from deselected agents
          if (deselectedAgentIds.length > 0) {
            console.log('Removing company_id from deselected agents:', deselectedAgentIds)
            
            const removePromises = deselectedAgentIds.map(async (agentId) => {
              const updateResponse = await fetch(`/api/agents/${agentId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  company_id: null
                })
              })
              
              if (!updateResponse.ok) {
                console.error(`Failed to remove company_id from agent ${agentId}`)
                return false
              }
              
              return true
            })
            
            const removeResults = await Promise.all(removePromises)
            const removeSuccessCount = removeResults.filter(Boolean).length
            
            if (removeSuccessCount === deselectedAgentIds.length) {
              console.log('All deselected agents updated successfully (company_id removed)')
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
        const companyId = result.company.id
        const clientIds = Array.from(selectedClients)
        
        try {
          // Update each selected client with the new company_id
          const updatePromises = clientIds.map(async (clientId) => {
            const updateResponse = await fetch(`/api/clients/${clientId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                company_id: companyId
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
            console.log('All selected clients updated successfully with company_id:', companyId)
          } else {
            console.warn(`${successCount}/${clientIds.length} clients updated successfully`)
          }
        } catch (error) {
          console.error('Error updating clients with company_id:', error)
        }
      }

      // Handle client deselection in edit mode
      if (companyToEdit?.id) {
        try {
          // Get all clients that were originally assigned to this company
          const originalClientIds = formData.originalClientIds || []
          
          // Find clients that were deselected (in original but not in current selection)
          const deselectedClientIds = originalClientIds.filter(id => !selectedClients.has(id))
          
          // Remove company_id from deselected clients
          if (deselectedClientIds.length > 0) {
            console.log('Removing company_id from deselected clients:', deselectedClientIds)
            
            const removePromises = deselectedClientIds.map(async (clientId) => {
              const updateResponse = await fetch(`/api/clients/${clientId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  company_id: null
                })
              })
              
              if (!updateResponse.ok) {
                console.error(`Failed to remove company_id from client ${clientId}`)
                return false
              }
              
              return true
            })
            
            const removeResults = await Promise.all(removePromises)
            const removeSuccessCount = removeResults.filter(Boolean).length
            
            if (removeSuccessCount === deselectedClientIds.length) {
              console.log('All deselected clients updated successfully (company_id removed)')
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
        shift: '',
        logo: null,
        badge_color: '#0EA5E9',
        status: 'Current Client'
      })
      setLocalShift(null)
      
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
  const loadComments = async (companyId: number) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/comments`)
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
      const response = await fetch(`/api/companies/${companyToEdit.id}/comments`, {
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
      const response = await fetch(`/api/companies/${companyToEdit.id}`, {
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
        console.log('🔍 Clients API response data:', data)
        console.log('🔍 Clients API response structure:', {
          hasClients: !!data.clients,
          clientsLength: data.clients?.length || 0,
          hasTotalCount: !!data.totalCount,
          totalCount: data.totalCount,
          hasPagination: !!data.pagination,
          pagination: data.pagination
        })
        
        const newClients = data.clients || []
        
        if (page === 1) {
          setClients(newClients)
          setDisplayClients(newClients)
        } else {
          setClients(prev => [...prev, ...newClients])
          setDisplayClients(prev => [...prev, ...newClients])
        }
        
        // Calculate hasMore based on totalCount and current items loaded
        const totalItems = data.totalCount || 0
        const currentItems = page === 1 ? newClients.length : clients.length + newClients.length
        setHasMoreClients(currentItems < totalItems)
        
        setCurrentClientPage(page)
        setTotalClientCount(data.totalCount || 0)
        
        // Auto-load more pages if content height is too short for scrolling
        if (page === 1 && !search && data.totalCount > 20) {
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
    console.log('🔍 loadMoreClients called:', { 
      hasMoreClients, 
      isLoadingMoreClients, 
      currentClientPage, 
      clientSearch,
      clientsLength: clients.length,
      totalClientCount
    })
    if (isLoadingMoreClients || !hasMoreClients) {
      console.log('❌ Cannot load more clients:', { 
        hasMoreClients, 
        isLoadingMoreClients, 
        reason: !hasMoreClients ? 'hasMoreClients is false' : 'isLoadingMoreClients is true' 
      })
      return
    }
    
    console.log('✅ Fetching next page of clients:', currentClientPage + 1)
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
    console.log('🔍 Agent selection opened:', true)
  }

  const openClientSelection = () => {
    setShowClientSelection(true)
    setShowAgentSelection(false) // Close agent selection when opening client selection
    console.log('🔍 Client selection opened:', true)
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
        console.log('🔄 Setting isLoadingCompany to true')
        setIsLoadingCompany(true)
        
        // Load data from database
        const loadCompanyData = async () => {
          console.log('🔄 Loading fresh data from database')
          
          const freshData = {
          company: companyToEdit.company || '',
          address: companyToEdit.address || '',
          phone: companyToEdit.phone || '',
          country: companyToEdit.country || '',
          service: companyToEdit.service || 'One Agent',
          website: Array.isArray(companyToEdit.website) && companyToEdit.website.length > 0 ? companyToEdit.website[0] : (companyToEdit.website as string) || '',
          shift: companyToEdit.shift || '',
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
          setLocalShift(companyToEdit.shift || null)
          setLastDatabaseSync(new Date())
          
          // Fetch current assignments from database and set original IDs
        if (companyToEdit.id) {
            // Fetch agents and set original IDs
            const agentsResponse = await fetch(`/api/agents/modal?companyId=${companyToEdit.id}&limit=1000`)
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
            const clientsResponse = await fetch(`/api/clients/modal?companyId=${companyToEdit.id}&limit=1000`)
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
          console.log('🔄 Company data loading completed, setting isLoadingCompany to false')
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
          service: 'One Agent',
          website: '',
          shift: '',
          logo: null,
          logoUrl: null,
          badge_color: '#0EA5E9',
          status: 'Current Client',
          id: undefined,
          originalAgentIds: [],
          originalClientIds: []
        })
        setLocalShift(null)
        
        // Reset selections - only when adding a new company, not when editing
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

  // Debug: Monitor selectedAgents changes
  React.useEffect(() => {
    console.log('🔍 selectedAgents changed:', Array.from(selectedAgents))
  }, [selectedAgents])

  // Debug: Monitor selectedClients changes
  React.useEffect(() => {
    console.log('🔍 selectedClients changed:', Array.from(selectedClients))
  }, [selectedClients])

  // Debug: Monitor isLoadingCompany changes
  React.useEffect(() => {
    console.log('🔍 isLoadingCompany changed:', isLoadingCompany)
  }, [isLoadingCompany])

  // Prevent body scroll when modal is open (but allow main content scrolling when selection panels are open)
  React.useEffect(() => {
    if (isOpen || isAddAgentDrawerOpen) {
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
  }, [isOpen, isAddAgentDrawerOpen])

  React.useEffect(() => {
    if (isAddAgentDrawerOpen || showAgentSelection) {
      console.log('🔍 Agent selection opened - resetting pagination state')
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
      console.log('🔍 About to fetch agents with reset state')
      fetchAgents(1, false, '')
    }
  }, [isAddAgentDrawerOpen, showAgentSelection])

  React.useEffect(() => {
    if (showClientSelection) {
      console.log('🔍 Client selection opened - resetting pagination state')
      // Reset pagination state when client selection is shown
      setCurrentClientPage(1)
      setHasMoreClients(true)
      setTotalClientCount(0)
      // Reset search when opening client selection
      setClientSearch('')
      // Fetch clients on first load
      console.log('🔍 About to fetch clients with reset state')
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
  const [showRequiredFieldsWarning, setShowRequiredFieldsWarning] = React.useState(false)
  const [missingFields, setMissingFields] = React.useState<string[]>([])
  
  // Tab state
  const [activeTab, setActiveTab] = React.useState("information")
  
  // Productivity scores state
  const [productivityScores, setProductivityScores] = React.useState<any[]>([])
  const [productivityStats, setProductivityStats] = React.useState<any>(null)
  const [productivityLoading, setProductivityLoading] = React.useState(false)
  const [productivityError, setProductivityError] = React.useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = React.useState<number>(() => {
    const now = new Date()
    return now.getMonth() + 1
  })
  const [selectedYear, setSelectedYear] = React.useState<number>(() => {
    const now = new Date()
    return Math.max(now.getFullYear(), 2025)
  })

  // Handler functions for removing agents and clients
  const handleRemoveAgent = (agentId: number) => {
    setSelectedAgents(prev => {
      const newSelected = new Set(prev)
      newSelected.delete(agentId)
      return newSelected
    })
    setSelectedAgentsData(prev => prev.filter(a => a.user_id !== agentId))
  }

  const handleRemoveClient = (clientId: number) => {
    setSelectedClients(prev => {
      const newSelected = new Set(prev)
      newSelected.delete(clientId)
      return newSelected
    })
    setSelectedClientsData(prev => prev.filter(c => c.user_id !== clientId))
  }

  // Fetch productivity scores when modal opens or month/year changes
  React.useEffect(() => {
    const fetchProductivityScores = async () => {
      if (!companyToEdit?.id || !user) return
      
      setProductivityLoading(true)
      setProductivityError(null)
      
      try {
        const monthYear = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
        
        console.log('📊 Fetching productivity scores for company:', companyToEdit.id, 'monthYear:', monthYear)
        
        const params = new URLSearchParams({
          companyId: String(companyToEdit.id),
          timeframe: 'monthly',
          monthYear: monthYear
        })
        
        const response = await fetch(`/api/productivity-scores?${params}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch productivity scores: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('✅ Productivity scores data received:', data)
        
        setProductivityScores(data.productivityScores || [])
        setProductivityStats(data.stats || null)
        
      } catch (err) {
        console.error('❌ Productivity scores fetch error:', err)
        setProductivityError(err instanceof Error ? err.message : 'Failed to fetch productivity scores')
        setProductivityScores([])
        setProductivityStats(null)
      } finally {
        setProductivityLoading(false)
      }
    }

    fetchProductivityScores()
  }, [companyToEdit?.id, user, selectedMonth, selectedYear])

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
        (localShift !== null ? localShift : formData.shift) !== companyToEdit.shift ||
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
        shift: (localShift !== null ? localShift : formData.shift) !== companyToEdit.shift,
        logo: logoChanged,
        badge_color: formData.badge_color !== companyToEdit.badge_color,
        status: formData.status !== companyToEdit.status,
        agents: JSON.stringify(Array.from(selectedAgents).sort()) !== JSON.stringify((formData.originalAgentIds || []).sort()),
        clients: JSON.stringify(Array.from(selectedClients).sort()) !== JSON.stringify((formData.originalClientIds || []).sort())
      })
      setHasUnsavedChanges(hasChanges)
    }
  }, [formData, selectedAgents, selectedClients, companyToEdit, existingLogoUrl, localShift])

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
              {(!companyToEdit && isEditingCompany) || (companyToEdit && isEditingCompany) ? (
                <div className="mb-4">
                  <Input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Company Name"
                    className="text-2xl font-semibold h-auto px-3 py-0 !border !border-sidebar-border dark:!border-border !bg-[#ebebeb] dark:!bg-[#0a0a0a] rounded-lg transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                    style={{ minHeight: '2.5rem' }}
                    autoFocus
                    onBlur={() => {
                      if (companyToEdit) {
                        handleCompanySave(formData.company || '')
                      } else {
                        // When adding new company, convert to text mode when losing focus
                        setIsEditingCompany(false)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (companyToEdit) {
                          handleCompanySave(formData.company || '')
                        } else {
                          // When adding new company, convert to text mode on Enter
                          setIsEditingCompany(false)
                        }
                      } else if (e.key === 'Escape') {
                        if (companyToEdit) {
                          handleCompanyCancel()
                        } else {
                          // When adding new company, convert to text mode on Escape
                          setIsEditingCompany(false)
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div 
                  className="text-2xl font-semibold mb-4 px-3 py-0 cursor-pointer hover:bg-[#ebebeb] dark:hover:bg-[#0a0a0a] rounded-lg transition-colors duration-200 flex items-center border border-transparent"
                  style={{ minHeight: '2.5rem' }}
                  onClick={() => {
                    // Always allow editing when clicked
                    setIsEditingCompany(true)
                  }}
                >
                  {formData.company || 'Company Name'}
                </div>
              )}
              
              {/* Company Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
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
                      <Badge 
                        variant="outline" 
                        className="px-3 py-1 font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
                        style={{ 
                          color: theme === 'dark' ? '#ffffff' : (formData.badge_color || '#0EA5E9'),
                          borderColor: `${formData.badge_color || '#0EA5E9'}20`,
                          backgroundColor: `${formData.badge_color || '#0EA5E9'}20`
                        }}
                        title="Click to open color picker"
                      >
                        {formData.badge_color || '#0EA5E9'}
                      </Badge>
                    </ColorPicker>
                  </div>
                </div>

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
                      {serviceOptions.map((option) => {
                        const isCurrentService = formData.service === option.value;
                        return (
                          <PopoverItem
                            key={option.value}
                            variant="primary"
                            isSelected={isCurrentService}
                            onClick={() => handleInputChange('service', option.value)}
                          >
                            {option.value === 'Workforce' ? (
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            ) : option.value === 'One Agent' ? (
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            ) : option.value === 'Team' ? (
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                            )}
                            <span className="text-sm font-medium">{option.label}</span>
                          </PopoverItem>
                        );
                      })}
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Status */}
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
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
                      {[
                        { value: 'Current Client' },
                        { value: 'Lost Client' }
                      ].map((statusOption) => {
                        const isCurrentStatus = formData.status === statusOption.value;
                        return (
                          <PopoverItem
                            key={statusOption.value}
                            variant="primary"
                            isSelected={isCurrentStatus}
                            onClick={() => handleInputChange('status', statusOption.value)}
                          >
                            {statusOption.value === 'Current Client' ? (
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            ) : statusOption.value === 'Lost Client' ? (
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                            )}
                            <span className="text-sm font-medium">{statusOption.value}</span>
                          </PopoverItem>
                        );
                      })}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            


            {/* Scrollable Form Content */}
            <div className="flex-1 px-6 py-5 overflow-y-auto min-h-0" tabIndex={-1}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
                <div className="mb-6 flex-shrink-0">
                  <div className={`rounded-xl p-1 w-fit ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-gray-100/80 border border-gray-200'
                  }`}>
                    <div className="flex gap-1 relative">
                      {[
                        { title: "Information", value: "information" },
                        { title: "Leaderboard", value: "leaderboard" }
                      ].map((tab, idx) => (
                        <button
                          key={tab.value}
                          onClick={() => setActiveTab(tab.value)}
                          className="relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 text-black dark:text-white hover:text-foreground"
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          {activeTab === tab.value && (
                            <motion.div
                              layoutId="modalClickedButton"
                              transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                              className="absolute inset-0 bg-primary/10 rounded-lg"
                            />
                          )}
                          <span className="relative block text-black dark:text-white flex items-center justify-center gap-2">
                            {tab.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Information Tab */}
                <TabsContent value="information" className="space-y-6">
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
                      icon={<IconWorld className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
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
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                }
                              }}
                            >
                              {formData.country || '-'}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 px-2 pb-2 pt-0" align="start" side="bottom" sideOffset={4}>
                            <div className="space-y-1">
                              <div className="sticky top-0 z-10 border-b px-0 py-0">
                                <div className="relative">
                                  <IconSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search countries..."
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                    className="bg-white/0 dark:bg-white/0 pl-8 py-0 border-0 focus:ring-0 shadow-none"
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
                                  <PopoverItem
                                    key={country}
                                    isSelected={formData.country === country}
                                    onClick={() => handleInputChange('country', country)}
                                  >
                                    <span className="text-sm font-medium">{country}</span>
                                  </PopoverItem>
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

                    {/* Shift */}
                    <DataFieldRow
                      icon={<IconClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Shift"
                      fieldName="shift"
                      value={localShift !== null ? localShift : (formData.shift || '')}
                      onSave={() => {}}
                      placeholder="-"
                      customInput={
                        <Popover>
                          <PopoverTrigger asChild>
                            <div 
                              className={`h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center ${
                                (localShift !== null ? localShift : formData.shift) ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                              style={{ backgroundColor: 'transparent' }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                }
                              }}
                            >
                              {(localShift !== null ? localShift : formData.shift) || '-'}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-32 p-1" align="start" side="bottom" sideOffset={4}>
                            {[
                              { value: 'Day', icon: <IconSun className="h-4 w-4 text-muted-foreground" /> },
                              { value: 'Night', icon: <IconMoon className="h-4 w-4 text-muted-foreground" /> }
                            ].map((shiftOption) => (
                                <PopoverItem
                                  key={shiftOption.value}
                                  isSelected={(localShift !== null ? localShift : formData.shift) === shiftOption.value}
                                  onClick={() => {
                                    // Update the shift value
                                    if ((localShift !== null ? localShift : formData.shift) !== shiftOption.value) {
                                      setLocalShift(shiftOption.value)
                                      handleInputChange('shift', shiftOption.value)
                                      console.log('Shift changed to:', shiftOption.value)
                                    }
                                  }}
                                >
                                  <span className="text-sm">{shiftOption.icon}</span>
                                  <span className="text-sm font-medium">{shiftOption.value}</span>
                                </PopoverItem>
                              ))}
                          </PopoverContent>
                        </Popover>
                      }
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
                          <input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" tabIndex={-1} />
                          <label
                            htmlFor="logo"
                            className="w-full cursor-pointer"
                            tabIndex={-1}
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
                                  tabIndex={-1}
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
                                tabIndex={-1}
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
                                tabIndex={-1}
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
                          tabIndex={-1}
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
                      <div className="p-4">
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
                                    tabIndex={-1}
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
                                    className="absolute -top-2 -right-2 w-5 h-5 text-white rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0 shadow-sm border-0"
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
                        tabIndex={-1}
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
                    <div className="p-4">
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
                                    tabIndex={-1}
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
                                    className="absolute -top-2 -right-2 w-5 h-5 text-white rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0 shadow-sm"
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
                </TabsContent>

                {/* Leaderboard Tab */}
                <TabsContent value="leaderboard" className="space-y-6 overflow-y-auto flex-1 min-h-0">
                  <div>
                    <div className="flex items-center justify-between min-h-[40px]">
                      <h3 className="text-lg font-medium text-muted-foreground">Leaderboard</h3>
                    </div>
                    <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                      {productivityLoading ? (
                        <div className="p-6 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-sm text-muted-foreground">Loading productivity scores...</p>
                        </div>
                      ) : productivityError ? (
                        <div className="p-6 text-center">
                          <IconAlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                          <p className="text-sm text-destructive">{productivityError}</p>
                        </div>
                      ) : (
                        <div className="p-0">
                          {/* Top Performers */}
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-semibold flex items-center gap-2">
                                <IconTrophy className="h-5 w-5 text-primary" />
                                Ranks
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Date:</span>
                                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Month" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[
                                      { value: 1, label: 'January' },
                                      { value: 2, label: 'February' },
                                      { value: 3, label: 'March' },
                                      { value: 4, label: 'April' },
                                      { value: 5, label: 'May' },
                                      { value: 6, label: 'June' },
                                      { value: 7, label: 'July' },
                                      { value: 8, label: 'August' },
                                      { value: 9, label: 'September' },
                                      { value: 10, label: 'October' },
                                      { value: 11, label: 'November' },
                                      { value: 12, label: 'December' },
                                    ].map((option) => (
                                      <SelectItem key={option.value} value={option.value.toString()}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                                  <SelectTrigger className="w-24">
                                    <SelectValue placeholder="Year" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(() => {
                                      const currentYear = new Date().getFullYear()
                                      const startYear = 2025
                                      const options = []
                                      for (let year = currentYear; year >= startYear; year--) {
                                        options.push({ value: year, label: year.toString() })
                                      }
                                      return options
                                    })().map((option) => (
                                      <SelectItem key={option.value} value={option.value.toString()}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {productivityScores.map((score: any, index: number) => {
                                const rank = index + 1
                                
                                return (
                                  <div 
                                    key={score.user_id} 
                                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 border-border"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-2 w-8">
                                        <span className={`text-sm font-medium ${
                                          rank === 1 ? 'text-yellow-500' :
                                          rank === 2 ? 'text-gray-500' :
                                          rank === 3 ? 'text-amber-600' :
                                          rank === 4 ? 'text-blue-500' :
                                          rank === 5 ? 'text-purple-500' :
                                          'text-muted-foreground'
                                        }`}>#{rank}</span>
                                      </div>
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={score.profile_picture || undefined} alt={`${score.first_name} ${score.last_name}`} />
                                        <AvatarFallback>
                                          {score.first_name?.[0]}{score.last_name?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium text-sm flex items-center gap-2">
                                          {score.first_name} {score.last_name}
                                          {rank === 1 && <IconCrown className="h-4 w-4 text-yellow-500" />}
                                          {rank === 2 && <IconMedal className="h-4 w-4 text-gray-500" />}
                                          {rank === 3 && <IconTrophy className="h-4 w-4 text-amber-600" />}
                                          {rank === 4 && <IconStar className="h-4 w-4 text-blue-500" />}
                                          {rank === 5 && <IconStar className="h-4 w-4 text-purple-500" />}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{score.department_name || 'No Department'}</div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="flex items-center gap-4">
                                        <div className="text-center">
                                          <div className="text-sm font-medium">{score.productivity_score.toFixed(2)}</div>
                                          <div className="text-xs text-muted-foreground">Points</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="text-sm font-medium">{(() => {
                                            const hours = Math.floor((score.total_active_seconds || 0) / 3600)
                                            const minutes = Math.floor(((score.total_active_seconds || 0) % 3600) / 60)
                                            return `${hours}h ${minutes}m`
                                          })()}</div>
                                          <div className="text-xs text-muted-foreground">Total Active Time</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                              
                              {productivityScores.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                  <p className="text-sm">No productivity data available</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-sidebar">
              <div className="flex items-center gap-3">
                {/* Show Save button only when adding a new company (not editing) AND modal is open */}
                {isOpen && !companyToEdit?.id && (
                  <Button type="submit" form="add-company-form" disabled={isSubmitting || !isFormValid()} size="sm" tabIndex={-1}>
                    {isSubmitting ? 'Saving...' : 'Add Company'}
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
                    tabIndex={-1}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Company'}
              </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-96 flex flex-col border-l border-[#cecece99] dark:border-border h-full bg-[#ececec] dark:bg-[#0a0a0a]">
            <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border flex-shrink-0">
              <h3 className="font-medium">
                {showClientSelection ? 'Select Clients' : showAgentSelection ? 'Select Agents' : 'Activity'}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 bg-[#ececec] dark:bg-[#0a0a0a]">
              {showAgentSelection ? (
                <AgentSelection
                  agents={displayAgents}
                  selectedAgentIds={selectedAgents}
                  onSelectionChange={async (agentId, isSelected) => {
                    const agent = displayAgents.find(a => a.user_id === agentId)
                    if (!agent) return

                    const newSelected = new Set(selectedAgents)
                    if (isSelected) {
                      newSelected.add(agentId)
                      // Only add if not already in selectedAgentsData
                      setSelectedAgentsData(prev => {
                        if (prev.some(a => a.user_id === agentId)) {
                          return prev
                        }
                        return [...prev, agent]
                      })
                    } else {
                      newSelected.delete(agentId)
                      // Remove from selectedAgentsData when unselecting
                      setSelectedAgentsData(prev => prev.filter(a => a.user_id !== agentId))
                    }
                    
                    // Update local state immediately for responsive UI
                    setSelectedAgents(newSelected)
                    
                    // Real-time database update
                    if (companyToEdit?.id) {
                      try {
                        await updateAssignmentRealTime(agentId, isSelected, 'agent')
                        console.log(`✅ Real-time agent assignment updated: ${agentId} ${isSelected ? 'assigned' : 'unassigned'}`)
                      } catch (error) {
                        console.error('❌ Real-time agent update failed:', error)
                        // Error handling is done in updateAssignmentRealTime
                      }
                    }
                  }}
                  onSearchChange={setAgentSearch}
                  searchValue={agentSearch}
                  isLoading={isLoadingAgents}
                  isLoadingMore={isLoadingMore}
                  hasMore={hasMore}
                  onLoadMore={loadMoreAgents}
                  onDone={closeSelectionContainers}
                  currentCompany={companyToEdit?.company}
                  onScroll={(e) => {
                    const target = e.target as HTMLDivElement
                    const { scrollTop, scrollHeight, clientHeight } = target
                    
                    // Debug scroll values
                    console.log('🔍 Agents Scroll Debug:', {
                      scrollTop,
                      scrollHeight,
                      clientHeight,
                      threshold: scrollHeight * 0.8,
                      shouldLoad: scrollTop + clientHeight >= scrollHeight * 0.8,
                      hasMore,
                      isLoadingMore,
                      agentsLength: displayAgents.length,
                      totalCount
                    })
                  }}
                />
              ) : showClientSelection ? (
                <ClientSelection
                  clients={displayClients}
                  selectedClientIds={selectedClients}
                  onSelectionChange={async (clientId, isSelected) => {
                    const client = displayClients.find(c => c.user_id === clientId)
                    if (!client) return

                    const newSelected = new Set(selectedClients)
                    if (isSelected) {
                      newSelected.add(clientId)
                      // Only add if not already in selectedClientsData
                      setSelectedClientsData(prev => {
                        if (prev.some(c => c.user_id === clientId)) {
                          return prev
                        }
                        return [...prev, client]
                      })
                    } else {
                      newSelected.delete(clientId)
                      // Remove from selectedClientsData when unselecting
                      setSelectedClientsData(prev => prev.filter(c => c.user_id !== clientId))
                    }
                    
                    // Update local state immediately for responsive UI
                    setSelectedClients(newSelected)
                    
                    // Real-time database update
                    if (companyToEdit?.id) {
                      try {
                        await updateAssignmentRealTime(clientId, isSelected, 'client')
                        console.log(`✅ Real-time client assignment updated: ${clientId} ${isSelected ? 'assigned' : 'unassigned'}`)
                      } catch (error) {
                        console.error('❌ Real-time client update failed:', error)
                        // Error handling is done in updateAssignmentRealTime
                      }
                    }
                  }}
                  onSearchChange={handleClientSearch}
                  searchValue={clientSearch}
                  isLoading={isLoadingClients}
                  isLoadingMore={isLoadingMoreClients}
                  hasMore={hasMoreClients}
                  onLoadMore={loadMoreClients}
                  onDone={closeSelectionContainers}
                  currentCompany={companyToEdit?.company}
                  onScroll={(e) => {
                    const target = e.target as HTMLDivElement
                    const { scrollTop, scrollHeight, clientHeight } = target
                    
                    // Debug scroll values
                    console.log('🔍 Clients Scroll Debug:', {
                      scrollTop,
                      scrollHeight,
                      clientHeight,
                      threshold: scrollHeight * 0.8,
                      shouldLoad: scrollTop + clientHeight >= scrollHeight * 0.8,
                      hasMoreClients,
                      isLoadingMoreClients,
                      clientsLength: displayClients.length,
                      totalClientCount
                    })
                  }}
                />
              ) : (
                // Activity Content - Shows company activity and recent changes
                <div>
                  {companyToEdit?.id ? (
                    <CompaniesActivityLog 
                      companyId={companyToEdit.id} 
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
              <div className="px-3 pb-3 bg-[#ececec] dark:bg-[#0a0a0a]">
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
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                if (comment.trim() && !isSubmittingComment) {
                                  handleCommentSubmit(e)
                                }
                              }
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
                            tabIndex={-1}
                          />
                          
                          {/* Send button - only show when expanded, inside the textarea container */}
                          {(isCommentFocused || comment.trim()) && (
                            <div className="p-1 flex justify-end animate-in fade-in duration-300">
                              <button
                                type="submit"
                                onClick={handleCommentSubmit}
                                disabled={!comment.trim() || isSubmittingComment}
                                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                tabIndex={-1}
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
            <h2 className="text-lg font-semibold leading-none tracking-tight">Delete Company</h2>
            </div>
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">Are you sure you want to delete this company? This action cannot be undone and will remove all associated data.</p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowDeleteConfirmation(false)}
              tabIndex={-1}
            >
              No
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              tabIndex={-1}
            >
              {isDeleting ? 'Deleting...' : 'Yes'}
            </Button>
        </div>
      </DialogContent>
      </Dialog>

      {/* Required Fields Warning Dialog */}
      <Dialog open={showRequiredFieldsWarning} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[380px] w-[90vw] rounded-xl [&>button]:hidden">
          <div className="flex flex-col space-y-1.5 text-center sm:text-center">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Missing Fields</h2>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">The following required fields are missing. Please fill in all required fields before saving this company.</p>
            <ul className="space-y-1">
              {missingFields.map((field, index) => (
                <li key={index} className="flex items-center gap-2">
                  <IconAlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span>{field} <span style={{ color: 'rgb(239, 68, 68)' }}>(Required)</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowRequiredFieldsWarning(false)}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
