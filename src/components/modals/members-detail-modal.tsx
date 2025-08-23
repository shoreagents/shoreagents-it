"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconGlobe, IconCreditCard, IconPlus, IconUpload, IconX, IconSearch, IconLink, IconMinus, IconActivity, IconSend } from "@tabler/icons-react"
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
  // Redis storage fields for selected agents and clients
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

const countryOptions = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
]

export function AddCompanyModal({ isOpen, onClose, onCompanyAdded, companyToEdit }: AddCompanyModalProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  
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
  const [comment, setComment] = React.useState("")
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)
  const [commentsList, setCommentsList] = React.useState<Array<{id: string, comment: string, user_name: string, created_at: string}>>([])
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
  
  // Smart Sync state
  const [redisKey, setRedisKey] = React.useState<string>('')
  const [lastRedisSave, setLastRedisSave] = React.useState<Date | null>(null)
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
    return formData.logoUrl || existingLogoUrl
  }, [formData.logo, formData.logoUrl, existingLogoUrl])

  React.useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
    }
  }, [logoPreviewUrl])

  const filteredCountries = countryOptions.filter(country =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  )

  // Use agents directly since we're now doing server-side search
  const displayAgents = agents

  // Manual save function
  const handleSave = async () => {
    if (!companyToEdit?.id) return
    
    try {
      console.log('💾 Starting manual save...')
      console.log('🔍 Current selected agents:', Array.from(selectedAgents))
      console.log('🔍 Current selected clients:', Array.from(selectedClients))
      
      // Create data for Redis
      const redisData = {
        ...formData,
        logo: null, // Don't store File object in Redis
        logoUrl: formData.logoUrl || existingLogoUrl,
        selectedAgentIds: Array.from(selectedAgents),
        selectedClientIds: Array.from(selectedClients),
        selectedAgentsData: selectedAgentsData,
        selectedClientsData: selectedClientsData
      }
      
      // Save to Redis
      const redisResponse = await fetch('/api/redis/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: redisKey,
          data: redisData,
          expiry: 3600 // 1 hour expiry
        })
      })
      
      if (redisResponse.ok) {
        console.log('✅ Redis save successful')
        
        // Update database
        await updateDatabase(formData)
        
        // Update agent and client assignments
        await updateAssignments()
        
        // Reset unsaved changes flag
        setHasUnsavedChanges(false)
        
        console.log('✅ Manual save completed successfully')
      } else {
        console.error('❌ Redis save failed')
        throw new Error('Redis save failed')
      }
      
    } catch (error) {
      console.error('❌ Manual save error:', error)
      alert('Failed to save changes. Please try again.')
    }
  }

  // Update database function
  const updateDatabase = async (data: CompanyData) => {
    if (!companyToEdit?.id) return
    
    try {
      console.log('🔄 Updating database...')
      
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
      }
      
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

  // Update assignments function
  const updateAssignments = async () => {
    if (!companyToEdit?.id) return
    
    try {
      console.log('🔄 Updating assignments...')
      
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
        
        const agentResults = await Promise.all(agentUpdatePromises)
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
        
        const clientResults = await Promise.all(clientUpdatePromises)
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
          
          const agentRemoveResults = await Promise.all(agentRemovePromises)
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
          
          const clientRemoveResults = await Promise.all(clientRemovePromises)
          const clientRemoveSuccessCount = clientRemoveResults.filter(Boolean).length
          
          if (clientRemoveSuccessCount === deselectedClientIds.length) {
            console.log('✅ All deselected client assignments removed from database')
          } else {
            console.warn(`⚠️ ${clientRemoveSuccessCount}/${deselectedClientIds.length} deselected client assignments removed`)
          }
        }
      }
      
      console.log('✅ All assignments updated successfully')
      
    } catch (error) {
      console.error('❌ Assignment update error:', error)
      throw error
    }
  }

  // Load data from Redis
  const loadFromRedis = async () => {
    if (!redisKey) return
    
    try {
      const response = await fetch(`/api/redis/get?key=${redisKey}`)
      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          setFormData(result.data)
          
          // Restore selected agents and clients from Redis
          if (result.data.selectedAgentIds) {
            setSelectedAgents(new Set(result.data.selectedAgentIds))
          }
          if (result.data.selectedClientIds) {
            setSelectedClients(new Set(result.data.selectedClientIds))
          }
          if (result.data.selectedAgentsData) {
            setSelectedAgentsData(result.data.selectedAgentsData)
          }
          if (result.data.selectedClientsData) {
            setSelectedClientsData(result.data.selectedClientsData)
          }
          
          // Debug: Log what was loaded from Redis
          console.log('🔍 Redis data loaded:', {
            company: result.data.company,
            originalAgentIds: result.data.originalAgentIds,
            selectedAgentIds: result.data.selectedAgentIds,
            originalClientIds: result.data.originalClientIds,
            selectedClientIds: result.data.selectedClientIds
          })
          
          console.log('Loaded unsaved changes from Redis including agents/clients selections')
          return true
        }
      }
    } catch (error) {
      console.error('Failed to load from Redis:', error)
    }
    return false
  }

  const handleInputChange = (field: keyof CompanyData, value: string | File | null) => {
    const newData = {
      ...formData,
      [field]: value
    }
    
    setFormData(newData)
    
    // No more auto-save timer - user must click save button
    console.log(`📝 Field '${field}' updated to:`, value)
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
        const companyClients = data.agents || []
        
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

    // For editing mode, just close - user must save manually
    if (companyToEdit?.id) {
      console.log('Edit mode - closing without auto-save. User must click Save Changes first.')
      onClose()
      return
    }

    try {
      setIsSubmitting(true)
      
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
      if (formData.badge_color) {
        formDataToSend.append('badge_color', formData.badge_color)
      }
      if (formData.status) {
        formDataToSend.append('status', formData.status)
      }
      
      // Create new company
      const response = await fetch('/api/members', {
        method: 'POST',
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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !companyToEdit?.id || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      // For now, just add to local state (you can implement API call later)
      const newComment = {
        id: Date.now().toString(),
        comment: comment.trim(),
        user_name: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        created_at: new Date().toISOString()
      }
      
      setCommentsList((prev) => [newComment, ...prev])
      setComment("")
      console.log('Comment submitted successfully:', newComment)
    } catch (error) {
      console.error('Error submitting comment:', error)
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
      onClose()
      
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
        const newClients = data.agents || [] // Note: API returns 'agents' field for clients
        
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
      
      // Generate Redis key for this editing session
      if (companyToEdit?.id) {
        const sessionKey = `company_edit:${companyToEdit.id}:${Date.now()}`
        setRedisKey(sessionKey)
        console.log('Generated Redis key:', sessionKey)
      }
      
      // If editing a company, populate the form
      if (companyToEdit) {
        // Load data from database
        const loadCompanyData = async () => {
          const sessionKey = `company_edit:${companyToEdit.id}:${Date.now()}`
          setRedisKey(sessionKey)
          
          // Try to load from Redis first (preserves unsaved work)
          const hasRedisData = await loadFromRedis()
          
          if (hasRedisData) {
            // ✅ Redis has unsaved work - preserve it
            console.log('✅ Loaded unsaved changes from Redis')
          } else {
            // ❌ No Redis data - load from database
            console.log('🔄 No Redis data - loading fresh from database')
            
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
            
            // Set form data with fresh database data
            setFormData(freshData)
            setLastRedisSave(new Date())
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
                const companyClients = clientsData.agents || []
                const clientIds = companyClients.map((client: any) => client.user_id)
                
                setSelectedClients(new Set(clientIds))
                setSelectedClientsData(companyClients)
                
                // Set original client IDs for tracking deselection
                setFormData(prev => ({
                  ...prev,
                  originalClientIds: clientIds
                }))
                
                console.log('✅ Set original client IDs:', clientIds)
              }
            }
          }
        }
        
        loadCompanyData()
      }
    }
  }, [isOpen, companyToEdit])

  // Remove the syncQueue effect
  // React.useEffect(() => { ... }, [syncQueue])

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
  }, [isOpen, isAddAgentDrawerOpen, showAgentSelection])

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
  }, [companyToEdit?.id, redisKey, formData])

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)

  // Update hasUnsavedChanges when form data or selections change
  React.useEffect(() => {
    if (companyToEdit?.id) {
      // Check if there are any changes compared to original data
      const hasChanges = 
        formData.company !== companyToEdit.company ||
        formData.address !== companyToEdit.address ||
        formData.phone !== companyToEdit.phone ||
        formData.country !== companyToEdit.country ||
        formData.service !== companyToEdit.service ||
        formData.website !== (Array.isArray(companyToEdit.website) ? companyToEdit.website[0] : companyToEdit.website) ||
        formData.badge_color !== companyToEdit.badge_color ||
        formData.status !== companyToEdit.status ||
        selectedAgents.size > 0 ||
        selectedClients.size > 0
      
      setHasUnsavedChanges(hasChanges)
    }
  }, [formData, selectedAgents, selectedClients, companyToEdit])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              
              {/* Save Button */}
              {companyToEdit?.id && (
                <Button 
                  onClick={handleSave}
                  className={`${
                    hasUnsavedChanges 
                      ? 'bg-primary hover:bg-primary/90 text-white' 
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                  size="sm"
                  disabled={!hasUnsavedChanges}
                >
                  {hasUnsavedChanges ? '💾 Save Changes' : '✅ All Changes Saved'}
                </Button>
              )}
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
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
                </div>
              ) : (
                <form id="add-company-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Information Section */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-muted-foreground">Information</h3>
                    {/* Company Information Container */}
                    <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                    {/* Company Name */}
                    <DataFieldRow
                      icon={<IconBuilding className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Name *"
                      fieldName="company"
                      value={formData.company || ''}
                      onSave={(fieldName, value) => handleInputChange(fieldName as keyof CompanyData, value)}
                      placeholder="-"
                    />

                    {/* Service */}
                    <DataFieldRow
                      icon={<IconBriefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Service"
                      fieldName="service"
                      value={formData.service || ''}
                      onSave={(fieldName, value) => handleInputChange(fieldName as keyof CompanyData, value)}
                      placeholder="-"
                      customInput={
                        <Popover>
                          <PopoverTrigger asChild>
                            <div 
                              className={`h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center ${
                                formData.service ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                              style={{ backgroundColor: 'transparent' }}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                }
                              }}
                            >
                              {formData.service ? serviceOptions.find(opt => opt.value === formData.service)?.label || formData.service : '-'}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2" align="start" side="bottom" sideOffset={4}>
                            <div className="space-y-1">
                              {serviceOptions.map((option) => (
                                <div 
                                  key={option.value}
                                  className={`flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 ${
                                    formData.service === option.value 
                                      ? 'bg-primary/10 text-primary border border-primary/20 pointer-events-none cursor-default' 
                                      : 'cursor-pointer hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground'
                                  }`}
                                  onClick={() => handleInputChange('service', option.value)}
                                >
                                  <span className="text-sm font-medium">{option.label}</span>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      }
                    />

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
                        // Allow: backspace, delete, tab, escape, enter, and navigation keys
                        if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode) ||
                            // Allow: numbers, space, dash, parentheses
                            /[0-9\s\-\(\)]/.test(e.key)) {
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

                    {/* Badge Color */}
                    <DataFieldRow
                      icon={<IconTag className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Badge Color"
                      fieldName="badge_color"
                      value={formData.badge_color || ''}
                      onSave={(fieldName, value) => handleInputChange(fieldName as keyof CompanyData, value)}
                      placeholder="-"
                      customInput={
                        <div className="flex items-center gap-2 w-full">
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
                          <Input
                            id="badge_color"
                            placeholder="-"
                            value={formData.badge_color || ''}
                            onChange={(e) => handleInputChange('badge_color', e.target.value)}
                            className="h-[33px] flex-1 text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none placeholder:text-muted-foreground"
                          />
                        </div>
                      }
                    />

                    {/* Status */}
                    <DataFieldRow
                      icon={<IconCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Status"
                      fieldName="status"
                      value={formData.status || ''}
                      onSave={(fieldName, value) => handleInputChange(fieldName as keyof CompanyData, value)}
                      placeholder="-"
                      customInput={
                        <Popover>
                          <PopoverTrigger asChild>
                            <div 
                              className={`h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center ${
                                formData.status ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                              style={{ backgroundColor: 'transparent' }}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                }
                              }}
                            >
                              {formData.status || '-'}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2" align="start" side="bottom" sideOffset={4}>
                            <div className="space-y-1">
                              {[
                                { value: 'Current Client' },
                                { value: 'Lost Client' }
                              ].map((statusOption) => (
                                <div 
                                  key={statusOption.value}
                                  className={`flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 ${
                                    formData.status === statusOption.value 
                                      ? 'bg-primary/10 text-primary border border-primary/20 pointer-events-none cursor-default' 
                                      : 'cursor-pointer hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground'
                                  }`}
                                  onClick={() => handleInputChange('status', statusOption.value)}
                                >
                                  <span className="text-sm font-medium">{statusOption.value}</span>
                                </div>
                              ))}
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
                        <div className="flex items-center gap-2 w-full">
                          <input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          <label
                            htmlFor="logo"
                            className="w-full cursor-pointer"
                          >
                            {(formData.logo || logoPreviewUrl) ? (
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
                        </div>
                      }
                    />
                  </div>
                </div>

                                  {/* Agents Section */}
                  <div className="space-y-2">
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
                                      setSelectedAgents(newSelected)
                                      
                                      // Also remove from selectedAgentsData immediately
                                      setSelectedAgentsData(prev => prev.filter(a => a.user_id !== agent.user_id))
                                      
                                      // Trigger Redis save for agent removal
                                      if (companyToEdit?.id && redisKey) {
                                        // Use the updated selection state directly
                                        const newData = { 
                                          ...formData,
                                          selectedAgentIds: Array.from(newSelected),
                                          selectedAgentsData: selectedAgentsData.filter(a => a.user_id !== agent.user_id)
                                        }
                                        
                                        // Database update will happen when save button is clicked
                                        console.log(`📝 Agent ${agent.user_id} deselected from local state (will be saved when you click Save Changes)`)
                                        
                                        // Auto-save removed - user must click save button
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
                            <p className="text-sm">No Agents Added Yet</p>
                          </div>
                        )}
                      </div>
                  </div>
                </div>

                {/* Clients Section */}
                <div className="space-y-2">
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
                                    <span className="text-xs text-muted-foreground truncate block">
                                      {client.member_company || 'No Member'}
                                    </span>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      const newSelected = new Set(selectedClients)
                                      newSelected.delete(client.user_id)
                                      setSelectedClients(newSelected)
                                      
                                      // Also remove from selectedClientsData immediately
                                      setSelectedClientsData(prev => prev.filter(c => c.user_id !== client.user_id))
                                      
                                      // Trigger Redis save for client removal
                                      if (companyToEdit?.id && redisKey) {
                                        // Use the updated selection state directly
                                        const newData = { 
                                          ...formData,
                                          selectedClientIds: Array.from(newSelected),
                                          selectedClientsData: selectedClientsData.filter(c => c.user_id !== client.user_id)
                                        }
                                        
                                        // Database update will happen when save button is clicked
                                        console.log(`📝 Client ${client.user_id} deselected from local state (will be saved when you click Save Changes)`)
                                        
                                        // Auto-save removed - user must click save button // Reduced delay since we're using the updated state directly
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
                          <p className="text-sm">No Clients Added Yet</p>
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
                {!companyToEdit && (
                  <Button type="submit" form="add-company-form" disabled={isSubmitting || !isFormValid()}>
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                )}

                {companyToEdit && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
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
                                    if (newSelected.has(agent.user_id)) {
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
                                    setSelectedAgents(newSelected)
                                    
                                    // Trigger Redis save for agent selection changes
                                    if (companyToEdit?.id && redisKey) {
                                      // Use the updated selection state directly
                                      const newData = { 
                                        ...formData,
                                        selectedAgentIds: Array.from(newSelected),
                                        selectedAgentsData: newSelected.has(agent.user_id) 
                                          ? [...selectedAgentsData, agent].filter((a, index, arr) => 
                                              arr.findIndex(item => item.user_id === a.user_id) === index
                                            )
                                          : selectedAgentsData.filter(a => a.user_id !== agent.user_id)
                                      }
                                      
                                      // Database update will happen when save button is clicked
                                      if (!newSelected.has(agent.user_id)) {
                                        console.log(`📝 Agent ${agent.user_id} deselected from local state (will be saved when you click Save Changes)`)
                                      }
                                      
                                      // Auto-save removed - user must click save button
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
                  
                  {/* End of List Indicator */}
                  {!hasMore && agents.length > 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-xs">
                        {agentSearch 
                          ? `Showing ${displayAgents.length} of ${totalCount} Agents`
                          : `All Agents Loaded (${totalCount} Total)`
                        }
                      </p>
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
                              onClick={() => {
                                // Disable selection for clients assigned to other companies
                                if (client.member_company && client.member_company !== companyToEdit?.company) return
                                
                                const newSelected = new Set(selectedClients)
                                if (newSelected.has(client.user_id)) {
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
                                setSelectedClients(newSelected)
                                
                                // Trigger Redis save for client selection changes
                                if (companyToEdit?.id && redisKey) {
                                  // Use the updated selection state directly
                                  const newData = { 
                                    ...formData,
                                    selectedClientIds: Array.from(newSelected),
                                    selectedClientsData: newSelected.has(client.user_id) 
                                      ? [...selectedClientsData, client].filter((c, index, arr) => 
                                          arr.findIndex(item => item.user_id === c.user_id) === index
                                        )
                                      : selectedClientsData.filter(c => c.user_id !== client.user_id)
                                  }
                                  // Auto-save removed - user must click save button
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
                                {client.member_company && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs px-2 py-0.5 border flex-shrink-0"
                                    style={
                                      theme === 'dark'
                                        ? { backgroundColor: '#44464880', borderColor: '#444648', color: '#ffffff' }
                                        : { backgroundColor: '#44464814', borderColor: '#a5a5a540', color: '#444648' }
                                    }
                                  >
                                    {client.member_company}
                                  </Badge>
                                )}
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
                        
                        {/* End of List Indicator */}
                        {!hasMoreClients && displayClients.length > 0 && (
                          <div className="text-center py-4 text-muted-foreground">
                            <p className="text-xs">
                              {clientSearch 
                                ? `Showing ${displayClients.length} of ${totalClientCount} Clients`
                                : `All Clients Loaded (${totalClientCount} Total)`
                              }
                            </p>
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
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Activity log will appear here when editing a company</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comment Input Section - Outside main content */}
            {!showAgentSelection && !showClientSelection && (
              <div className="px-3 pb-3 bg-[#ebebeb] dark:bg-[#0a0a0a]">
                <div className="flex gap-3 bg-sidebar rounded-lg p-3 border">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src="" alt="Current User" />
                    <AvatarFallback className="text-xs">
                      CU
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <form onSubmit={handleCommentSubmit}>
                      <Input 
                        placeholder="Write a comment..." 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="text-sm h-9"
                        disabled={isSubmittingComment}
                      />
                    </form>
                  </div>
                  <Button 
                    size="sm" 
                    className="rounded-lg bg-teal-600 hover:bg-teal-700 hover:border-teal-700 h-9 px-3" 
                    onClick={handleCommentSubmit}
                    disabled={!comment.trim() || isSubmittingComment}
                    type="submit"
                  >
                    {isSubmittingComment ? (
                      <>
                        <IconClock className="h-4 w-4 mr-1 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <IconSend className="h-4 w-4 mr-1" />
                        Send
                      </>
                    )}
                  </Button>
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
            <h2 className="text-lg font-semibold leading-none tracking-tight">Confirm Delete</h2>
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
