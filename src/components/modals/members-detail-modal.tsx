"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconGlobe, IconCreditCard, IconPlus, IconUpload, IconX, IconSearch, IconLink } from "@tabler/icons-react"
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
  const [showResetConfirmation, setShowResetConfirmation] = React.useState(false)
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

  const handleInputChange = (field: keyof CompanyData, value: string | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    handleInputChange('logo', file)
  }

  const fetchAgents = async (page = 1, append = false, searchQuery = '') => {
    try {
      if (page === 1) {
        setIsLoadingAgents(true)
      } else {
        setIsLoadingMore(true)
      }
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
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
        
        // Only load one more page initially if we have very few agents and no search
        if (page === 1 && !searchQuery.trim() && data.pagination?.totalCount > 10 && data.agents.length < 5) {
          // Load just one more page to ensure we have enough agents to make scrolling possible
          setTimeout(() => {
            console.log('Initial load: Very few agents, loading one more page...')
            fetchAgents(2, true, searchQuery)
          }, 100)
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

    try {
      setIsSubmitting(true)
      
      // Create FormData for API call
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
      
      let response
      let result
      
      if (companyToEdit?.id) {
        // Update existing company
        response = await fetch(`/api/members/${companyToEdit.id}`, {
          method: 'PATCH',
          body: formDataToSend
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update company')
        }
        
        result = await response.json()
        console.log('Company updated successfully:', result.company)
      } else {
        // Create new company
        response = await fetch('/api/members', {
          method: 'POST',
          body: formDataToSend
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create company')
        }
        
        result = await response.json()
        console.log('Company created successfully:', result.company)
      }
      
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

  const resetForm = () => {
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
    // Reset agent search and selection state
    setAgentSearch('')
    setShowAgentSelection(false)
    
    // Reset client selection
    setSelectedClients(new Set())
    setSelectedClientsData([])
    setShowClientSelection(false)
    setClientSearch('')
    
    // Close confirmation dialog
    setShowResetConfirmation(false)
  }

  const handleResetClick = () => {
    setShowResetConfirmation(true)
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
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setIsLoadingClients(false)
      setIsLoadingMoreClients(false)
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

  const closeAllSelections = () => {
    setShowAgentSelection(false)
    setShowClientSelection(false)
  }

  React.useEffect(() => {
    if (isOpen) {
      if (fileInputRef.current) {
        setInputWidth(fileInputRef.current.offsetWidth);
      }
      
      // If editing a company, populate the form
      if (companyToEdit) {
        setFormData({
          company: companyToEdit.company || '',
          address: companyToEdit.address || '',
          phone: companyToEdit.phone || '',
          country: companyToEdit.country || '',
          service: companyToEdit.service || '',
          website: Array.isArray(companyToEdit.website) && companyToEdit.website.length > 0 ? companyToEdit.website[0] : (companyToEdit.website as string) || '',
          logo: null, // Logo editing not yet implemented - would need to handle file conversion
          logoUrl: typeof companyToEdit.logo === 'string' ? companyToEdit.logo : companyToEdit.logoUrl,
          badge_color: companyToEdit.badge_color || '#0EA5E9',
          status: companyToEdit.status || 'Current Client',
          id: companyToEdit.id,
          originalAgentIds: companyToEdit.originalAgentIds, // Store original agent IDs
          originalClientIds: companyToEdit.originalClientIds // Store original client IDs
        })
        // Set existing logo URL for display
        const logoUrl = typeof companyToEdit.logo === 'string' ? companyToEdit.logo : companyToEdit.logoUrl
        setExistingLogoUrl(logoUrl || null)
        
        // Load company agents if editing
        if (companyToEdit.id) {
          fetchCompanyAgents(companyToEdit.id)
          // Also load clients
          fetchCompanyClients(companyToEdit.id)
        }
      } else {
        // Reset form for new company
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
      }
    } else {
      // Reset agent selection when modal closes
      setSelectedAgents(new Set())
      setSelectedAgentsData([])
      setShowAgentSelection(false)
      setAgentSearch('')
      
      // Reset client selection when modal closes
      setSelectedClients(new Set())
      setSelectedClientsData([])
      setShowClientSelection(false)
      setClientSearch('')
    }
  }, [isOpen, companyToEdit])

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
    }
  }, [])

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
            <div className="flex items-center justify-start px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
              {companyToEdit && existingLogoUrl ? (
                                  <img 
                    src={existingLogoUrl} 
                    alt={companyToEdit.company}
                    className="h-12 w-auto object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
              ) : (
                <h2 className="text-xl font-semibold">
                  {companyToEdit ? 'Edit Company' : 'Add Company'}
                </h2>
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
                    <div className="rounded-lg border border-[#cecece99] dark:border-border">
                    {/* Company Name */}
                    <DataFieldRow
                      icon={<IconBuilding className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Company Name *"
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
                      onSave={(fieldName, value) => handleInputChange(fieldName as keyof CompanyData, value)}
                      placeholder="-"
                      customInput={
                        <Input
                          value={formData.phone || ''}
                          onChange={(e) => {
                            // Only allow numbers, spaces, dashes, and parentheses
                            const value = e.target.value.replace(/[^0-9\s\-\(\)]/g, '')
                            handleInputChange('phone', value)
                          }}
                          onKeyDown={(e) => {
                            // Allow: backspace, delete, tab, escape, enter, and navigation keys
                            if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode) ||
                                // Allow: numbers, space, dash, parentheses
                                /[0-9\s\-\(\)]/.test(e.key)) {
                              return
                            }
                            e.preventDefault()
                          }}
                          className="h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none"
                          placeholder="-"
                          inputMode="tel"
                          pattern="[0-9\s\-\(\)]+"
                        />
                      }
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
                      label="Company Logo"
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
                      <h3 className="text-lg font-medium text-muted-foreground">Agents</h3>
                      {!showAgentSelection && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={openAgentSelection}
                        >
                          <IconPlus className="h-4 w-4" />
                          Add Agents
                        </Button>
                      )}
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
                            <h4 className="text-sm font-medium text-muted-foreground">Selected Agents ({selectedAgents.size})</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedAgentsData.map((agent) => (
                                <div key={agent.user_id} className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg min-w-0">
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
                                    onClick={() => {
                                      const newSelected = new Set(selectedAgents)
                                      newSelected.delete(agent.user_id)
                                      setSelectedAgents(newSelected)
                                      
                                      // Also remove from selectedAgentsData immediately
                                      setSelectedAgentsData(prev => prev.filter(a => a.user_id !== agent.user_id))
                                    }}
                                    className="text-muted-foreground hover:text-foreground transition-colors p-1 flex-shrink-0"
                                  >
                                    <IconX className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <IconUser className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No Agents Added Yet</p>
                          </div>
                        )}
                      </div>
                  </div>
                </div>

                {/* Clients Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between min-h-[40px]">
                    <h3 className="text-lg font-medium text-muted-foreground">Clients</h3>
                    {!showClientSelection && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openClientSelection}
                      >
                        <IconPlus className="h-4 w-4" />
                        Add Clients
                      </Button>
                    )}
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
                          <h4 className="text-sm font-medium text-muted-foreground">Selected Clients ({selectedClients.size})</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedClientsData.map((client) => (
                              <div key={client.user_id} className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg min-w-0">
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
                                  onClick={() => {
                                    const newSelected = new Set(selectedClients)
                                    newSelected.delete(client.user_id)
                                    setSelectedClients(newSelected)
                                    
                                    // Also remove from selectedClientsData immediately
                                    setSelectedClientsData(prev => prev.filter(c => c.user_id !== client.user_id))
                                  }}
                                  className="text-muted-foreground hover:text-foreground transition-colors p-1 flex-shrink-0"
                                >
                                  <IconX className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <IconUser className="h-8 w-8 mx-auto mb-2 opacity-50" />
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
            <div className="flex items-center justify-start gap-3 px-6 py-4 border-t bg-sidebar">
              <Button type="submit" form="add-company-form" disabled={isSubmitting || !isFormValid()}>
                {isSubmitting ? 'Saving...' : companyToEdit ? 'Save Changes' : 'Save Changes'}
              </Button>
              <Button type="button" variant="ghost" onClick={handleResetClick}>
                Reset
              </Button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-96 flex flex-col border-l border-[#cecece99] dark:border-border h-full bg-[#ebebeb] dark:bg-[#0a0a0a]">
            <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border flex-shrink-0">
              <h3 className="font-medium">
                {showClientSelection ? 'Select Clients' : showAgentSelection ? 'Select Agents' : 'Preview'}
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
                              onClick={() => {
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
                          <p className="text-sm">
                            {agentSearch ? 'No Agents Found' : 'No agents found'}
                          </p>
                          <p className="text-xs">
                            {!agentSearch && 'No agents are currently available'}
                          </p>
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
                          
                          closeAllSelections()
                        }}
                      >
                        Done
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={closeAllSelections}
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
                  <div className="space-y-4 flex-1 overflow-y-auto min-h-0 px-2 py-2">
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
                        <IconUser className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium">No Clients Found</p>
                        <p className="text-xs">Try adjusting your search criteria</p>
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
                          
                          closeAllSelections()
                        }}
                      >
                        Done
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={closeAllSelections}
                      >
                        Done
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                // Company Preview Content
                <div className="rounded-lg p-4 bg-sidebar border space-y-4">
                  {isLoadingCompany ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Skeleton className="h-3 w-3" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          {logoPreviewUrl ? (
                            <AvatarImage src={logoPreviewUrl} alt={formData.company || 'Logo'} />
                          ) : (
                            <AvatarFallback>{(formData.company || 'C').slice(0, 2).toUpperCase()}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{formData.company || 'Company Name'}</div>
                          <div className="text-xs text-muted-foreground truncate">{formData.service || 'Service'}</div>
                        </div>
                      </div>
                      {formData.country && (
                        <div className="text-sm flex items-center gap-2">
                          <IconMapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{formData.country}</span>
                        </div>
                      )}
                      {formData.phone && (
                        <div className="text-sm flex items-center gap-2">
                          <IconPhone className="h-4 w-4 text-muted-foreground" />
                          <span>{formData.phone}</span>
                        </div>
                      )}
                      {formData.website && (
                        <div className="text-sm flex items-center gap-2">
                          <IconLink className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{formData.website}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Badge:</span>
                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: formData.badge_color || '#3B82F6' }} />
                      </div>
                      <div className="text-xs text-muted-foreground">Status: {formData.status}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
        <DialogContent className="sm:max-w-[380px] w-[90vw] rounded-xl [&>button]:hidden">
          <div className="flex flex-col space-y-1.5 text-center sm:text-center">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Confirm Reset</h2>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">Are you sure you want to reset the form? This will clear all entered data and cannot be undone.</p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowResetConfirmation(false)}
            >
              No
            </Button>
            <Button 
              variant="default" 
              onClick={resetForm}
            >
              Yes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
