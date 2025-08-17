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

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"
import { ColorPicker } from "@/components/ui/color-picker"


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
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [formData, setFormData] = React.useState<CompanyData>({
    company: '',
    address: '',
    phone: '',
    country: '',
    service: '',
    website: '',
    logo: null,
    badge_color: '',
    status: 'Current Client'
  })

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
        badge_color: '',
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
      badge_color: '',
      status: 'Current Client'
    })
  }

  React.useEffect(() => {
    if (isOpen && fileInputRef.current) {
      setInputWidth(fileInputRef.current.offsetWidth);
    }
  }, [isOpen])

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl overflow-hidden p-0 rounded-xl bg-background dark:bg-[#111111]">
        <DialogTitle className="sr-only">Add New Company</DialogTitle>
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Add New Company</h2>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            <form id="add-company-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Name & Service */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Name *</Label>
                  <div className="relative">
                    <IconBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company"
                      placeholder="Enter company name"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service">Service *</Label>
                  <Select value={formData.service} onValueChange={(value) => handleInputChange('service', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Address, Phone & Country */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <div className="relative">
                    <IconMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      placeholder="Enter company address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <IconPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10"
                      type="tel"
                      inputMode="numeric"
                      onKeyDown={(e) => {
                        // Allow: backspace, delete, tab, escape, enter, and navigation keys
                        if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode) ||
                            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                            (e.keyCode === 65 && e.ctrlKey === true) ||
                            (e.keyCode === 67 && e.ctrlKey === true) ||
                            (e.keyCode === 86 && e.ctrlKey === true) ||
                            (e.keyCode === 88 && e.ctrlKey === true)) {
                          return;
                        }
                        // Ensure that it is a number and stop the keypress
                        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) &&
                            (e.keyCode < 96 || e.keyCode > 105)) {
                          e.preventDefault();
                        }
                      }}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="p-0">
                      <div className="sticky top-0 z-10 border-b px-0 py-0">
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
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Badge Color & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="badge_color">
                    Badge Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <ColorPicker
                        color={formData.badge_color}
                        onChange={(color) => handleInputChange('badge_color', color)}
                        open={isColorPickerOpen}
                        onOpenChange={setIsColorPickerOpen}
                      >
                        <div 
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full border border-border cursor-pointer shadow-sm" 
                          style={{ backgroundColor: formData.badge_color || '#3B82F6' }}
                          title="Click to open color picker"
                        />
                      </ColorPicker>
                      <Input
                        id="badge_color"
                        placeholder="e.g., #3B82F6"
                        value={formData.badge_color}
                        onChange={(e) => handleInputChange('badge_color', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Current Client">Current Client</SelectItem>
                      <SelectItem value="Lost Client">Lost Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Website & Company Logo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <IconLink className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      placeholder="Enter website URL"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Company Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <div className="flex">
                        <input
                          ref={fileInputRef}
                          type="text"
                          placeholder="Choose file..."
                          value={formData.logo ? (() => {
                            const name = formData.logo.name;
                            if (name.length <= 20) return name;
                            const extension = name.split('.').pop();
                            const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
                            if (nameWithoutExt.length <= 12) return name;
                            return nameWithoutExt.substring(0, 12) + '...' + extension;
                          })() : ''}
                          readOnly
                          disabled
                          className="flex-1 h-9 px-3 border border-l border-t border-b border-sidebar-border bg-sidebar text-muted-foreground rounded-l-lg text-sm shadow-sm transition-colors dark:bg-sidebar dark:text-muted-foreground dark:border-border cursor-default"
                        />
                                                  <label
                            htmlFor="logo"
                            className="flex items-center justify-center h-9 px-4 border border-l-0 border-sidebar-border bg-[#ebebeb] rounded-r-lg cursor-pointer hover:bg-[#e3e3e3] transition-colors text-sm font-medium dark:bg-[#0a0a0a] dark:hover:bg-[#121212] dark:border-border"
                            title="Choose logo file"
                          >
                          Browse
                        </label>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-sidebar">
            <Button type="button" variant="ghost" onClick={resetForm}>
              Reset
            </Button>
            <Button type="submit" form="add-company-form" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Company'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
