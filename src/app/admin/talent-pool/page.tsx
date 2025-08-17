"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { IconSearch, IconMail, IconPhone, IconWorld, IconEye, IconCopy, IconMapPin, IconBriefcase, IconStar, IconCalendar, IconUser } from "@tabler/icons-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Types
interface Education {
  major?: string
  years: string
  degree: string
  location: string
  institution: string
}

interface Experience {
  company?: string
  organization?: string
  duration: string
  location: string
  position: string
  description: string
}

interface Reference {
  name: string
  position: string
  institution: string
  email: string
  phone: string
  location: string
}

interface Candidate {
  name: string
  email: string
  phone: string
  skills: string[]
  summary: string
  website: string
  location: string
  education: Education[]
  languages: string[]
  reference: Reference
  experience: Experience[]
}

// Mock data
const candidates: Candidate[] = [
  {
    "name": "Lovell Siron",
    "email": "lovellsiron918@gmail.com",
    "phone": "+63 920 846-6915",
    "skills": ["Java","Python","PHP","HTML/CSS","Javascript","SQL","Adobe Photoshop","Illustrator","Lightroom","GIMP","Filmora","Adobe Premiere","Microsoft Office Suite (Word, Excel, Powerpoint)"],
    "summary": "To seek employment as a Web Developer and Graphic Designer, coming with strong graphic design knowledge in Adobe Photoshop and Illustrator, and the ability to work with different programming languages such as HTML, CSS, Javascript, and PHP to create attractive and engaging websites.",
    "website": "https://www.lovellsiron.com/",
    "location": "Porac, Pampanga, Philippines",
    "education": [
      {"major": "Web Development","years": "2018-2022","degree": "Bachelor of Science in Information Technology","location": "Angeles, Pampanga","institution": "Holy Angel University"},
      {"major": "Science, Technology, Engineering, and Mathematics","years": "2016-2018","degree": "Senior High School","location": "Angeles, Pampanga","institution": "Holy Angel University"},
      {"years": "2012-2016","degree": "Junior High School","location": "Angeles, Pampanga","institution": "Holy Angel University"}
    ],
    "languages": ["Java","Python","PHP","HTML/CSS","Javascript","SQL"],
    "reference": {"name": "Kevin Aldrin G. Espinosa, MIT","email": "kevinaldrin.espinosa@live.com","phone": "(045) - 888-8691 local 1387","location": "Angeles City","position": "Assistant Professor, Program Coordinator, BS Information Technology","institution": "Holy Angel University"},
    "experience": [
      {"company": "FiAm Software Technology","duration": "2021","location": "Angeles City, Pampanga","position": "Intern","description": "Worked as a web developer intern for 3 months. In charge of making websites applying content management system such as wordpress and grav."},
      {"duration": "2020-2021","location": "Holy Angel University","position": "Councilor","description": "Head of Creative Multimedia Arts Team. In charge of publication materials on social media of the council and graphic designing on events such as posters and teasers.","organization": "School of Computing Student Council"}
    ]
  },
  {
    "name": "Maria Santos",
    "email": "maria.santos@email.com",
    "phone": "+63 915 123-4567",
    "skills": ["React","Node.js","TypeScript","MongoDB","AWS","Docker","Git","Figma","Adobe XD","Sketch","User Research","Prototyping","Agile Methodologies"],
    "summary": "Full-stack developer with 5+ years of experience building scalable web applications. Specialized in React ecosystem and cloud infrastructure. Passionate about creating user-centered digital experiences.",
    "website": "https://mariasantos.dev/",
    "location": "Makati, Metro Manila, Philippines",
    "education": [
      {"major": "Computer Science","years": "2015-2019","degree": "Bachelor of Science in Computer Science","location": "Quezon City","institution": "University of the Philippines"},
      {"major": "Web Development","years": "2019-2020","degree": "Postgraduate Certificate","location": "Singapore","institution": "NUS School of Computing"}
    ],
    "languages": ["React","Node.js","TypeScript","JavaScript","Python"],
    "reference": {"name": "Dr. Roberto Cruz, PhD","email": "roberto.cruz@up.edu.ph","phone": "+63 2 8123-4567","location": "Quezon City","position": "Associate Professor, Department of Computer Science","institution": "University of the Philippines"},
    "experience": [
      {"company": "TechCorp Philippines","duration": "2021-2024","location": "Makati, Metro Manila","position": "Senior Full-Stack Developer","description": "Led development of enterprise applications using React, Node.js, and AWS. Mentored junior developers and implemented CI/CD pipelines."},
      {"company": "StartupXYZ","duration": "2019-2021","location": "Singapore","position": "Frontend Developer","description": "Built responsive web applications and collaborated with design team on user experience improvements."}
    ]
  },
  {
    "name": "Carlos Rodriguez",
    "email": "carlos.rodriguez@email.com",
    "phone": "+63 917 987-6543",
    "skills": ["Python","Machine Learning","TensorFlow","PyTorch","Data Analysis","SQL","Pandas","NumPy","Scikit-learn","Jupyter","Tableau","Power BI","Statistics"],
    "summary": "Data Scientist with expertise in machine learning and statistical analysis. Experienced in building predictive models and creating data-driven insights for business decisions.",
    "website": "https://carlosrodriguez.ai/",
    "location": "Cebu City, Cebu, Philippines",
    "education": [
      {"major": "Statistics","years": "2016-2020","degree": "Bachelor of Science in Statistics","location": "Cebu City","institution": "University of San Carlos"},
      {"major": "Data Science","years": "2020-2022","degree": "Master of Science in Data Science","location": "Manila","institution": "Ateneo de Manila University"}
    ],
    "languages": ["Python","R","SQL","JavaScript"],
    "reference": {"name": "Prof. Ana Martinez, PhD","email": "ana.martinez@usc.edu.ph","phone": "+63 32 234-5678","location": "Cebu City","position": "Professor, Department of Mathematics and Statistics","institution": "University of San Carlos"},
    "experience": [
      {"company": "DataInsights Inc.","duration": "2022-2024","location": "Cebu City, Cebu","position": "Senior Data Scientist","description": "Developed machine learning models for customer segmentation and predictive analytics. Reduced customer churn by 25% through data-driven insights."},
      {"company": "Cebu Analytics","duration": "2020-2022","location": "Cebu City, Cebu","position": "Data Analyst","description": "Performed data analysis and created dashboards for business intelligence. Automated reporting processes saving 15 hours per week."}
    ]
  }
]

// Skill categories
const skillCategories = {
  "Programming": ["Java", "Python", "PHP", "HTML/CSS", "Javascript", "SQL", "React", "Node.js", "TypeScript", "R"],
  "Graphic Design": ["Adobe Photoshop", "Illustrator", "Lightroom", "GIMP", "Figma", "Adobe XD", "Sketch"],
  "Video/Other": ["Filmora", "Adobe Premiere"],
  "Office": ["Microsoft Office Suite (Word, Excel, Powerpoint)"],
  "Data Science": ["Machine Learning", "TensorFlow", "PyTorch", "Data Analysis", "Pandas", "NumPy", "Scikit-learn", "Jupyter", "Tableau", "Power BI", "Statistics"],
  "Cloud & DevOps": ["AWS", "Docker", "Git", "CI/CD"],
  "Design & UX": ["User Research", "Prototyping", "Agile Methodologies"]
}

export default function TalentPoolPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [skillFilter, setSkillFilter] = useState<string[]>([])
  const [experienceFilter, setExperienceFilter] = useState("")
  const [sortBy, setSortBy] = useState("name-az")
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)

  // Get all unique skills for filter
  const allSkills = useMemo(() => {
    const skills = new Set<string>()
    candidates.forEach(candidate => {
      candidate.skills.forEach(skill => skills.add(skill))
    })
    return Array.from(skills).sort()
  }, [])

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    let filtered = candidates.filter(candidate => {
      const matchesSearch = searchQuery === "" || 
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
        candidate.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.education.some(edu => edu.institution.toLowerCase().includes(searchQuery.toLowerCase())) ||
        candidate.experience.some(exp => exp.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesLocation = locationFilter === "" || 
        candidate.location.toLowerCase().includes(locationFilter.toLowerCase())

      const matchesSkills = skillFilter.length === 0 || 
        skillFilter.some(skill => candidate.skills.includes(skill))

      const matchesExperience = experienceFilter === "" || 
        candidate.experience.some(exp => 
          exp.position.toLowerCase().includes(experienceFilter.toLowerCase()) ||
          exp.description.toLowerCase().includes(experienceFilter.toLowerCase())
        )

      return matchesSearch && matchesLocation && matchesSkills && matchesExperience
    })

    // Sort candidates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-az":
          return a.name.localeCompare(b.name)
        case "name-za":
          return b.name.localeCompare(a.name)
        case "most-skills":
          return b.skills.length - a.skills.length
        case "recently-added":
          return 0 // Since we don't have added date, keep original order
        default:
          return 0
      }
    })

    return filtered
  }, [searchQuery, locationFilter, skillFilter, experienceFilter, sortBy])

  const handleSkillToggle = (skill: string) => {
    setSkillFilter(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const copyProfileToClipboard = (candidate: Candidate) => {
    navigator.clipboard.writeText(JSON.stringify(candidate, null, 2))
  }

  const getSkillCategory = (skill: string) => {
    for (const [category, skills] of Object.entries(skillCategories)) {
      if (skills.includes(skill)) return category
    }
    return "Other"
  }

  const groupedSkills = (candidate: Candidate) => {
    const grouped: Record<string, string[]> = {}
    candidate.skills.forEach(skill => {
      const category = getSkillCategory(skill)
      if (!grouped[category]) grouped[category] = []
      grouped[category].push(skill)
    })
    return grouped
  }

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-x-auto">
        <AppHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex-1 flex-col gap-2 @container/main">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">Talent Pool</h1>
                    <p className="text-sm text-muted-foreground">Search and manage talent candidates.</p>
                  </div>
                </div>
                
                {/* Search and Filters */}
                <div className="space-y-4 mb-8">
                  {/* Search Input */}
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by name, skills, location, education, experience..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filters Row */}
                  <div className="flex flex-wrap gap-4">
                    {/* Location Filter */}
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        placeholder="Filter by location..."
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                      />
                    </div>

                    {/* Skill Filter */}
                    <div className="flex-1 min-w-[200px]">
                      <Select value={skillFilter.join(",")} onValueChange={(value) => setSkillFilter(value ? value.split(",") : [])}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select skills..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allSkills.map(skill => (
                            <SelectItem key={skill} value={skill}>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={skillFilter.includes(skill)}
                                  onChange={() => handleSkillToggle(skill)}
                                  className="mr-2"
                                />
                                {skill}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Experience Filter */}
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        placeholder="Filter by experience role..."
                        value={experienceFilter}
                        onChange={(e) => setExperienceFilter(e.target.value)}
                      />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="min-w-[180px]">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name-az">Name A-Z</SelectItem>
                          <SelectItem value="name-za">Name Z-A</SelectItem>
                          <SelectItem value="most-skills">Most Skills</SelectItem>
                          <SelectItem value="recently-added">Recently Added</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Results Count */}
                <div className="mb-6">
                  <p className="text-muted-foreground">
                    Showing {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Candidates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCandidates.map((candidate, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold">{candidate.name}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2">{candidate.summary}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <IconMapPin className="h-4 w-4" />
                          {candidate.location}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Contact Buttons */}
                        <div className="flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" asChild>
                                  <a href={`mailto:${candidate.email}`}>
                                    <IconMail className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Send Email</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" asChild>
                                  <a href={`tel:${candidate.phone}`}>
                                    <IconPhone className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Call</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" asChild>
                                  <a href={candidate.website} target="_blank" rel="noopener noreferrer">
                                    <IconWorld className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Visit Website</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {/* Skills */}
                        <div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {candidate.skills.slice(0, 8).map((skill, skillIndex) => (
                              <Badge key={skillIndex} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {candidate.skills.length > 8 && (
                              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                                +{candidate.skills.length - 8} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div className="text-center">
                            <div className="font-semibold">{candidate.skills.length}</div>
                            <div>Skills</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{candidate.education.length}</div>
                            <div>Education</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{candidate.experience.length}</div>
                            <div>Experience</div>
                          </div>
                        </div>

                        {/* View Profile Button */}
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button 
                              className="w-full" 
                              onClick={() => setSelectedCandidate(candidate)}
                            >
                              <IconEye className="h-4 w-4 mr-2" />
                              View Profile
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
                            {selectedCandidate && (
                              <div className="space-y-6">
                                <SheetHeader>
                                  <SheetTitle className="text-2xl">{selectedCandidate.name}</SheetTitle>
                                  <p className="text-muted-foreground">{selectedCandidate.summary}</p>
                                </SheetHeader>

                                {/* Contact Info */}
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={`mailto:${selectedCandidate.email}`}>
                                      <IconMail className="h-4 w-4 mr-2" />
                                      Email
                                    </a>
                                  </Button>
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={`tel:${selectedCandidate.phone}`}>
                                      <IconPhone className="h-4 w-4 mr-2" />
                                      Call
                                    </a>
                                  </Button>
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={selectedCandidate.website} target="_blank" rel="noopener noreferrer">
                                      <IconWorld className="h-4 w-4 mr-2" />
                                      Website
                                    </a>
                                  </Button>
                                </div>

                                {/* Skills Section */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-3">Skills</h3>
                                  {Object.entries(groupedSkills(selectedCandidate)).map(([category, skills]) => (
                                    <div key={category} className="mb-3">
                                      <h4 className="font-medium text-muted-foreground mb-2">{category}</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {skills.map((skill, index) => (
                                          <Badge key={index} variant="secondary">
                                            {skill}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Experience Section */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-3">Experience</h3>
                                  <div className="space-y-4">
                                    {selectedCandidate.experience.map((exp, index) => (
                                      <div key={index} className="border-l-2 border-muted pl-4">
                                        <div className="flex items-start justify-between mb-2">
                                          <div>
                                            <h4 className="font-medium">{exp.position}</h4>
                                            <p className="text-sm text-muted-foreground">
                                              {exp.company || exp.organization}
                                            </p>
                                          </div>
                                          <div className="text-right text-sm text-muted-foreground">
                                            <div>{exp.duration}</div>
                                            <div>{exp.location}</div>
                                          </div>
                                        </div>
                                        <p className="text-sm">{exp.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Education Section */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-3">Education</h3>
                                  <div className="space-y-4">
                                    {selectedCandidate.education.map((edu, index) => (
                                      <div key={index} className="border-l-2 border-muted pl-4">
                                        <div className="flex items-start justify-between mb-2">
                                          <div>
                                            <h4 className="font-medium">{edu.degree}</h4>
                                            {edu.major && <p className="text-sm text-muted-foreground">{edu.major}</p>}
                                            <p className="text-sm text-muted-foreground">{edu.institution}</p>
                                          </div>
                                          <div className="text-right text-sm text-muted-foreground">
                                            <div>{edu.years}</div>
                                            <div>{edu.location}</div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Reference Section */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-3">Reference</h3>
                                  <div className="border-l-2 border-muted pl-4">
                                    <h4 className="font-medium">{selectedCandidate.reference.name}</h4>
                                    <p className="text-sm text-muted-foreground">{selectedCandidate.reference.position}</p>
                                    <p className="text-sm text-muted-foreground">{selectedCandidate.reference.institution}</p>
                                    <p className="text-sm">{selectedCandidate.reference.email}</p>
                                    <p className="text-sm">{selectedCandidate.reference.phone}</p>
                                    <p className="text-sm text-muted-foreground">{selectedCandidate.reference.location}</p>
                                  </div>
                                </div>

                                {/* Sticky Footer */}
                                <div className="sticky bottom-0 bg-background border-t pt-4 mt-6">
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" asChild>
                                      <a href={`mailto:${selectedCandidate.email}`}>
                                        <IconMail className="h-4 w-4 mr-2" />
                                        Email
                                      </a>
                                    </Button>
                                    <Button size="sm" variant="outline" asChild>
                                      <a href={`tel:${selectedCandidate.phone}`}>
                                        <IconPhone className="h-4 w-4 mr-2" />
                                        Call
                                      </a>
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => copyProfileToClipboard(selectedCandidate)}
                                    >
                                      <IconCopy className="h-4 w-4 mr-2" />
                                      Copy Profile
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </SheetContent>
                        </Sheet>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* No Results */}
                {filteredCandidates.length === 0 && (
                  <div className="text-center py-12">
                    <IconUser className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No candidates found</h3>
                    <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
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
