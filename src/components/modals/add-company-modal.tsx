"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
}

interface CompanyData {
  company: string
  address: string
  phone: string
  country: string
  service: string
  website: string
  logo?: File | null
  badge_color?: string
  status?: string
}

const serviceOptions = [
  { value: 'one agent', label: 'One Agent' },
  { value: 'team', label: 'Team' },
  { value: 'workforce', label: 'Workforce' }
]

const countryOptions = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
]

export function AddCompanyModal({ isOpen, onClose, onCompanyAdded }: AddCompanyModalProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [countrySearch, setCountrySearch] = React.useState('')
  const [isColorPickerOpen, setIsColorPickerOpen] = React.useState(false)
  const [inputWidth, setInputWidth] = React.useState(0)
  const [isAddAgentDrawerOpen, setIsAddAgentDrawerOpen] = React.useState(false)
  const [agents, setAgents] = React.useState<Array<{user_id: number, first_name: string | null, last_name: string | null, employee_id: string | null, job_title: string | null, profile_picture: string | null, member_company: string | null, member_badge_color: string | null}>>([])
  const [selectedAgents, setSelectedAgents] = React.useState<Set<number>>(new Set())
  const [isLoadingAgents, setIsLoadingAgents] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  const [totalCount, setTotalCount] = React.useState(0)
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

  const logoPreviewUrl = React.useMemo(() => {
    if (formData.logo) {
      try {
        return URL.createObjectURL(formData.logo)
      } catch {
        return null
      }
    }
    return null
  }, [formData.logo])

  React.useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
    }
  }, [logoPreviewUrl])

  const filteredCountries = countryOptions.filter(country =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  )

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

  const fetchAgents = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setIsLoadingAgents(true)
      } else {
        setIsLoadingMore(true)
      }
      
      console.log(`Fetching agents page ${page} from API...`)
      
      const response = await fetch(`/api/agents?page=${page}&limit=10`)
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
          totalAgentsAfterUpdate: append ? agents.length + (data.agents?.length || 0) : (data.agents?.length || 0)
        })
        
        // If this is the first page and we have more agents, check if we need to load more
        if (page === 1 && data.pagination?.totalCount > 10) {
          // Use setTimeout to ensure state is updated before checking
          setTimeout(() => {
            const container = document.querySelector('[data-agents-container]') as HTMLDivElement
            if (container) {
              const { scrollHeight, clientHeight } = container
              console.log('Initial load check:', { scrollHeight, clientHeight, hasMore: page < (data.pagination?.totalPages || 1) })
              // If content height is less than container height and we have more agents, load more
              if (scrollHeight <= clientHeight && page < (data.pagination?.totalPages || 1)) {
                console.log('Initial load: Container not scrollable, loading more agents...')
                fetchAgents(2, true)
              }
            }
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
    console.log('loadMoreAgents called:', { hasMore, isLoadingMore, currentPage })
    if (hasMore && !isLoadingMore) {
      console.log('Fetching next page:', currentPage + 1)
      fetchAgents(currentPage + 1, true)
    } else {
      console.log('Cannot load more:', { hasMore, isLoadingMore })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.company || !formData.address || !formData.phone || !formData.country || !formData.service) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Create FormData for API call
      const formDataToSend = new FormData()
      formDataToSend.append('company', formData.company)
      formDataToSend.append('address', formData.address)
      formDataToSend.append('phone', formData.phone)
      formDataToSend.append('country', formData.country)
      formDataToSend.append('service', formData.service)
      formDataToSend.append('website', formData.website)
      if (formData.logo) {
        formDataToSend.append('logo', formData.logo)
      }
      if (formData.badge_color) {
        formDataToSend.append('badge_color', formData.badge_color)
      }
      if (formData.status) {
        formDataToSend.append('status', formData.status)
      }
      
      const response = await fetch('/api/companies', {
        method: 'POST',
        body: formDataToSend
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create company')
      }
      
      const result = await response.json()
      
      console.log('Company created successfully:', result.company)
      
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
  }

  React.useEffect(() => {
    if (isOpen) {
      if (fileInputRef.current) {
        setInputWidth(fileInputRef.current.offsetWidth);
      }
    }
  }, [isOpen])

  // Prevent body scroll when either modal or sheet is open
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
    if (isAddAgentDrawerOpen) {
      // Reset pagination state when sheet opens
      setCurrentPage(1)
      setHasMore(true)
      setTotalCount(0)
      setSelectedAgents(new Set())
      fetchAgents(1, false)
    }
  }, [isAddAgentDrawerOpen])

  // Check if we need to load more agents after initial load
  React.useEffect(() => {
    if (agents.length > 0 && hasMore && !isLoadingAgents && !isLoadingMore) {
      // If we have agents but the container might not be scrollable yet, 
      // check if we should load more to fill the viewport
      const container = document.querySelector('[data-agents-container]') as HTMLDivElement
      if (container) {
        const { scrollHeight, clientHeight } = container
        // If content height is less than container height, load more
        if (scrollHeight <= clientHeight && hasMore) {
          console.log('Container not scrollable, loading more agents...')
          loadMoreAgents()
        }
      }
    }
  }, [agents, hasMore, isLoadingAgents, isLoadingMore])

  // Cleanup function to restore scroll when component unmounts
  React.useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-7xl max-h-[95vh] overflow-hidden p-0 rounded-xl"
        style={{ backgroundColor: theme === 'dark' ? '#111111' : '#f8f9fa' }}
      >
        <DialogTitle className="sr-only">Add New Company</DialogTitle>
        <div className="flex h-[95vh]">
          {/* Left Panel - Form */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Add New Company</h2>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
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
                      label="Service *"
                      fieldName="service"
                      value={formData.service || ''}
                      onSave={(fieldName, value) => handleInputChange(fieldName as keyof CompanyData, value)}
                      placeholder="-"
                      customInput={
                        <Popover>
                          <PopoverTrigger asChild>
                            <div 
                              className="h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center"
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
                      label="Address *"
                      fieldName="address"
                      value={formData.address || ''}
                      onSave={(fieldName, value) => handleInputChange(fieldName as keyof CompanyData, value)}
                      placeholder="-"
                    />

                    {/* Phone */}
                    <DataFieldRow
                      icon={<IconPhone className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Phone *"
                      fieldName="phone"
                      value={formData.phone || ''}
                      onSave={(fieldName, value) => handleInputChange(fieldName as keyof CompanyData, value)}
                      placeholder="-"
                    />

                    {/* Country */}
                    <DataFieldRow
                      icon={<IconGlobe className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Country *"
                      fieldName="country"
                      value={formData.country || ''}
                      onSave={(fieldName, value) => handleInputChange(fieldName as keyof CompanyData, value)}
                      placeholder="-"
                      customInput={
                        <Popover>
                          <PopoverTrigger asChild>
                            <div 
                              className="h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center"
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
                                    className="!bg-sidebar pl-8 border-0 focus:ring-0 shadow-none"
                                    onKeyDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              <div className="max-h-[300px] overflow-y-auto">
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
                            className="h-[33px] flex-1 text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none"
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
                              className="h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center"
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
                            {formData.logo && logoPreviewUrl ? (
                              <LinkPreview
                                url="#"
                                isStatic={true}
                                imageSrc={logoPreviewUrl}
                                width={200}
                                height={200}
                              >
                                <Input
                                  ref={fileInputRef}
                                  placeholder="-"
                                  value={formData.logo ? (() => {
                                    const name = formData.logo.name;
                                    if (name.length <= 20) return name;
                                    const extension = name.split('.').pop();
                                    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
                                    if (nameWithoutExt.length <= 12) return name;
                                    return nameWithoutExt.substring(0, 12) + '...' + extension;
                                  })() : ''}
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
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-muted-foreground">Agents</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddAgentDrawerOpen(true)}
                      >
                        <IconPlus className="h-4 w-4" />
                        Add Agent
                      </Button>
                    </div>
                    
                    {/* Selected Agents Section */}
                    {selectedAgents.size > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Selected Agents ({selectedAgents.size})</h4>
                        <div className="space-y-2">
                          {agents
                            .filter(agent => selectedAgents.has(agent.user_id))
                            .map((agent) => (
                              <div key={agent.user_id} className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={agent.profile_picture || undefined} alt={agent.first_name || 'Agent'} />
                                  <AvatarFallback>
                                    {agent.first_name && agent.last_name 
                                      ? `${agent.first_name.charAt(0)}${agent.last_name.charAt(0)}`
                                      : agent.first_name?.charAt(0) || agent.last_name?.charAt(0) || 'A'
                                    }
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-sm truncate">
                                    {agent.first_name && agent.last_name 
                                      ? `${agent.first_name} ${agent.last_name}` 
                                      : agent.first_name || agent.last_name || 'Unknown Name'
                                    }
                                  </h4>
                                  <span className="text-xs text-muted-foreground">
                                    {agent.employee_id || 'No ID'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    const newSelected = new Set(selectedAgents)
                                    newSelected.delete(agent.user_id)
                                    setSelectedAgents(newSelected)
                                  }}
                                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                >
                                  <IconX className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="rounded-lg border border-[#cecece99] dark:border-border">
                      {/* Agent Fields */}
                      <div className="p-4 space-y-4">

                                               {/* Agents List */}
                         <div className="text-center py-6 text-muted-foreground">
                           <IconUser className="h-8 w-8 mx-auto mb-2 opacity-50" />
                           <p className="text-sm">No Agents Added Yet</p>
                         </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-sidebar">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Reset
              </Button>
              <Button type="submit" form="add-company-form" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Company'}
              </Button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-96 flex flex-col border-l border-[#cecece99] dark:border-border h-full bg-[#ebebeb] dark:bg-[#0a0a0a]">
            <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border flex-shrink-0">
              <h3 className="font-medium">Preview</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 bg-[#ebebeb] dark:bg-[#0a0a0a]">
              <div className="rounded-lg p-4 bg-sidebar border space-y-4">
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
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

                      {/* Add Agent Sheet */}
                <Sheet open={isAddAgentDrawerOpen} onOpenChange={setIsAddAgentDrawerOpen}>
          <SheetContent className="overflow-hidden [&>button]:hidden">
            <div className="w-full h-full flex flex-col">
            <SheetHeader className="flex-shrink-0">
              <SheetTitle>Select Agent</SheetTitle>
              <button
                onClick={() => setIsAddAgentDrawerOpen(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 bg-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:text-muted-foreground"
              >
                <IconX className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </button>
            </SheetHeader>
            
            
            <div 
              data-agents-container
              className="flex-1 overflow-y-auto pr-4 py-4 min-h-0 min-h-[400px]"
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
              {/* Agents List */}
              {isLoadingAgents ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading agents...</p>
                </div>
                              ) : agents.length > 0 ? (
                 <>

                   
                                       <div className="space-y-2">
                     {agents.map((agent) => (
                       <div 
                         key={agent.user_id}
                         className={`p-3 border rounded-lg transition-all duration-200 ${
                           agent.member_company 
                             ? 'opacity-50 cursor-not-allowed bg-muted/30' 
                             : `cursor-pointer ${
                                 selectedAgents.has(agent.user_id)
                                   ? 'border-primary/50 bg-primary/5'
                                   : 'hover:border-primary/50 hover:bg-primary/5'
                               }`
                         }`}
                         onClick={() => {
                           if (agent.member_company) return // Disable selection for agents with members
                           
                           const newSelected = new Set(selectedAgents)
                           if (newSelected.has(agent.user_id)) {
                             newSelected.delete(agent.user_id)
                           } else {
                             newSelected.add(agent.user_id)
                           }
                           setSelectedAgents(newSelected)
                         }}
                       >
                                                <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
                         <div className="relative">
                           <Avatar className="w-10 h-10">
                             <AvatarImage src={agent.profile_picture || undefined} alt={agent.first_name || 'Agent'} />
                             <AvatarFallback>
                               {agent.first_name && agent.last_name 
                                 ? `${agent.first_name.charAt(0)}${agent.last_name.charAt(0)}`
                                 : agent.first_name?.charAt(0) || agent.last_name?.charAt(0) || 'A'
                               }
                             </AvatarFallback>
                           </Avatar>
                           {selectedAgents.has(agent.user_id) && !agent.member_company && (
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
                                 ? agent.member_badge_color || '#6B7280'
                                 : '#6B7280'
                             }}
                             title={agent.member_company || 'No Member'}
                           >
                             {agent.member_company || 'No Member'}
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
                       <p className="text-xs">All Agents Loaded ({totalCount} Total)</p>
                     </div>
                   )}
                 </>
               ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <IconUser className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No agents found</p>
                  <p className="text-xs">No agents are currently available</p>
                </div>
              )}
            </div>
            {/* Action Buttons - Fixed at bottom */}
            <div className="flex-shrink-0 p-4 border-t">
              {selectedAgents.size > 0 && (
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
                    // 3. Close the sheet
                    // 4. Show success message
                    
                    setIsAddAgentDrawerOpen(false)
                  }}
                >
                  Add Selected Agents ({selectedAgents.size})
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </Dialog>
  )
}
