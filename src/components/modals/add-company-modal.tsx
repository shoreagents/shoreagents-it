"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconGlobe, IconCreditCard, IconPlus, IconUpload } from "@tabler/icons-react"
import { ColorPicker } from "@/components/ui/color-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"

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
  website: string[]
  logo?: File | null
  badge_color?: string
  status?: string
}

const serviceOptions = [
  { value: 'workforce', label: 'Workforce', color: 'bg-blue-100 text-blue-800' },
  { value: 'one agent', label: 'One Agent', color: 'bg-red-100 text-red-800' },
  { value: 'team', label: 'Team', color: 'bg-yellow-100 text-yellow-800' }
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
  const [formData, setFormData] = React.useState<CompanyData>({
    company: '',
    address: '',
    phone: '',
    country: '',
    service: '',
    website: [''],
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
      
                 // Here you would typically make an API call to create the company
           // const formDataToSend = new FormData()
           // formDataToSend.append('company', formData.company)
           // formDataToSend.append('address', formData.address)
           // formDataToSend.append('phone', formData.phone)
           // formDataToSend.append('country', formData.country)
           // formDataToSend.append('service', formData.service)
           // formData.website.forEach((url, index) => {
           //   if (url.trim()) {
           //     formDataToSend.append(`website[${index}]`, url)
           //   }
           // })
           // if (formData.logo) {
           //   formDataToSend.append('logo', formData.logo)
           // }
           // if (formData.badge_color) {
           //   formDataToSend.append('badge_color', formData.badge_color)
           // }
           // if (formData.status) {
           //   formDataToSend.append('status', formData.status)
           // }
      
      // const response = await fetch('/api/companies', {
      //   method: 'POST',
      //   body: formDataToSend
      // })
      
      // if (!response.ok) throw new Error('Failed to create company')
      
      // const newCompany = await response.json()
      
      console.log('Company created successfully:', formData)
      
      // Call the callback if provided
      if (onCompanyAdded) {
        onCompanyAdded(formData)
      }
      
      // Reset form and close modal
      setFormData({
        company: '',
        address: '',
        phone: '',
        country: '',
        service: '',
        website: [''],
        logo: null,
        badge_color: '',
        status: 'Current Client'
      })
      onClose()
      
    } catch (error) {
      console.error('Error creating company:', error)
      alert('Failed to create company. Please try again.')
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
      website: [''],
      logo: null,
      badge_color: '',
      status: 'Current Client'
    })
  }

  return (
    <TooltipProvider>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 rounded-xl" style={{ 
          backgroundColor: theme === 'dark' ? '#111111' : '#f8f9fa' 
        }}>
          <div className="flex flex-col h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
              <div className="flex items-center gap-3">
                <IconBuilding className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">Add New Company</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                                     {/* Company Basic Information */}
                     <Card>
                       <CardHeader>
                         <CardTitle className="text-lg flex items-center gap-2">
                           <IconBuilding className="h-5 w-5" />
                           Company Information
                         </CardTitle>
                       </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Name *</Label>
                        <Input
                          id="company"
                          placeholder="Enter company name"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          required
                        />
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
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={option.color}>
                                    {option.label}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                                             <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                               <Label htmlFor="badge_color">Badge Color</Label>
                                                                                             <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <ColorPicker
                                    color={formData.badge_color}
                                    onChange={(color) => handleInputChange('badge_color', color)}
                                    open={isColorPickerOpen}
                                    onOpenChange={setIsColorPickerOpen}
                                  >
                                    <div 
                                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full border border-border cursor-pointer" 
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

                         {/* Company Logo */}
                         <div className="space-y-2">
                           <Label htmlFor="logo">Company Logo</Label>
                           <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2">
                               <Input
                                 id="logo"
                                 type="file"
                                 accept="image/*"
                                 onChange={handleLogoUpload}
                                 className="max-w-xs"
                               />
                               <span className="text-sm text-muted-foreground">Upload logo (optional)</span>
                             </div>
                             {formData.logo && (
                               <div className="flex items-center gap-2">
                                 <Avatar className="h-12 w-12">
                                   <AvatarImage src={URL.createObjectURL(formData.logo)} alt="Preview" />
                                   <AvatarFallback>LO</AvatarFallback>
                                 </Avatar>
                                 <span className="text-sm text-muted-foreground">{formData.logo.name}</span>
                               </div>
                             )}
                           </div>
                         </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconPhone className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          placeholder="Enter phone number"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          required
                        />
                      </div>
                                                 <div className="space-y-2">
                             <Label htmlFor="website">Website(s)</Label>
                             <div className="space-y-2">
                               {formData.website.map((url, index) => (
                                 <div key={index} className="flex gap-2">
                                   <Input
                                     placeholder="Enter website URL"
                                     value={url}
                                     onChange={(e) => {
                                       const newWebsites = [...formData.website]
                                       newWebsites[index] = e.target.value
                                       setFormData(prev => ({ ...prev, website: newWebsites }))
                                     }}
                                     type="url"
                                   />
                                   {formData.website.length > 1 && (
                                     <Button
                                       type="button"
                                       variant="outline"
                                       size="sm"
                                       onClick={() => {
                                         const newWebsites = formData.website.filter((_, i) => i !== index)
                                         setFormData(prev => ({ ...prev, website: newWebsites }))
                                       }}
                                       className="px-2"
                                     >
                                       ✕
                                     </Button>
                                   )}
                                 </div>
                               ))}
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 onClick={() => setFormData(prev => ({ ...prev, website: [...prev.website, ''] }))}
                                 className="text-xs"
                               >
                                 + Add Another Website
                               </Button>
                             </div>
                           </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconMapPin className="h-5 w-5" />
                      Location Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address">Address *</Label>
                        <Input
                          id="address"
                          placeholder="Enter company address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                                                 <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                                                        <SelectTrigger>
                               <SelectValue placeholder="Select Country" />
                             </SelectTrigger>
                           <SelectContent className="p-0">
                             <div className="sticky top-0 z-10 border-b p-1">
                               <Input
                                 placeholder="Search countries..."
                                 value={countrySearch}
                                 onChange={(e) => setCountrySearch(e.target.value)}
                                 className="mb-2"
                               />
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
                  </CardContent>
                </Card>

                

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Reset Form
                  </Button>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Company'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
