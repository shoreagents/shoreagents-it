"use client"

import { type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useRef, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react"
import { motion, AnimatePresence } from "framer-motion"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon | any
  badge?: number
}

interface NavGroup {
  title: string
  icon?: LucideIcon | any
  items: NavItem[]
}

export function NavMainWithSubgroups({
  items,
  className = "",
}: {
  items: (NavItem | NavGroup)[]
  className?: string
}) {
  const pathname = usePathname()
  const iconRefs = useRef<Record<string, any>>({})
  const [hasInteracted, setHasInteracted] = useState(false)
  
  // Initialize expanded groups from localStorage or default to 'Applicants'
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-expanded-groups')
      if (saved) {
        try {
          return new Set(JSON.parse(saved))
        } catch (e) {
          console.warn('Failed to parse saved sidebar state:', e)
        }
      }
    }
    return new Set(['Applicants'])
  })
  
  const toggleGroup = (groupTitle: string) => {
    setHasInteracted(true)
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupTitle)) {
        newSet.delete(groupTitle)
      } else {
        newSet.add(groupTitle)
      }
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar-expanded-groups', JSON.stringify(Array.from(newSet)))
      }
      
      return newSet
    })
  }
  
  return (
    <SidebarGroup className={className}>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item, index) => {
            const key = item.title

            // Check if it's a group
            if ('items' in item) {
              const isGroupExpanded = expandedGroups.has(item.title)
              const hasActiveChild = item.items.some(subItem => 
                pathname === subItem.url || pathname === subItem.url + "/"
              )
              
              return (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton 
                    onClick={() => toggleGroup(item.title)}
                    tooltip={item.title}
                    className={`text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center relative overflow-visible pr-1`}
                    onMouseEnter={() => iconRefs.current[key]?.startAnimation?.()}
                    onMouseLeave={() => iconRefs.current[key]?.stopAnimation?.()}
                  >
                    <div className="flex items-center gap-2 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
                      {item.icon && (
                        <div className="flex items-center justify-center group-data-[collapsible=icon]:w-full">
                          <item.icon
                            ref={(el: any) => {
                              if (el) iconRefs.current[key] = el
                            }}
                            className="h-5 w-5"
                          />
                        </div>
                      )}
                      <span className="group-data-[collapsible=icon]:hidden flex-1">{item.title}</span>
                      <div className="ml-auto flex items-center justify-center group-data-[collapsible=icon]:hidden">
                        <IconChevronDown 
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isGroupExpanded ? 'rotate-0' : '-rotate-90'
                          }`}
                        />
                      </div>
                    </div>
                  </SidebarMenuButton>
                  
                  {/* Sub-items with visual hierarchy line */}
                  <AnimatePresence>
                    {isGroupExpanded && (
                      <motion.div 
                        className="relative ml-4 group-data-[collapsible=icon]:hidden mt-1"
                        initial={hasInteracted ? { opacity: 0, height: 0, overflow: "hidden" } : undefined}
                        animate={{ opacity: 1, height: "auto", overflow: "visible" }}
                        exit={hasInteracted ? { opacity: 0, height: 0, overflow: "hidden" } : undefined}
                        transition={{ 
                          duration: 0.2, 
                          ease: "easeInOut",
                          opacity: { duration: 0.15 }
                        }}
                      >
                        {/* Vertical line indicator */}
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-border"></div>
                        
                        <div className="ml-4 flex flex-col gap-1">
                          {item.items.map((subItem, subIndex) => {
                            const isActive = pathname === subItem.url || pathname === subItem.url + "/"
                            const isLast = subIndex === item.items.length - 1
                            
                            return (
                              <motion.div 
                                key={subItem.title} 
                                className="relative"
                                initial={hasInteracted ? { opacity: 0, x: -10 } : undefined}
                                animate={{ opacity: 1, x: 0 }}
                                exit={hasInteracted ? { opacity: 0, x: -10 } : undefined}
                                transition={{ 
                                  duration: 0.2, 
                                  delay: hasInteracted ? subIndex * 0.05 : 0,
                                  ease: "easeOut"
                                }}
                              >
                                <SidebarMenuItem>
                                  <SidebarMenuButton 
                                    asChild 
                                    tooltip={subItem.title}
                                    className={`${isActive ? "bg-gray-200 dark:bg-teal-600/30 focus:bg-gray-200 dark:focus:bg-teal-600/30 active:bg-gray-200 dark:active:bg-teal-600/30 text-sidebar-accent-foreground dark:text-white hover:!bg-gray-200 dark:hover:!bg-teal-600/30" : "text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"} group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible:icon]:items-center relative overflow-visible`}
                                  >
                                    <Link href={subItem.url} className="flex items-center gap-2 justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
                                      <div className="flex items-center group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
                                        <span className="group-data-[collapsible=icon]:hidden">{subItem.title}</span>
                                      </div>
                                      {subItem.badge && subItem.badge > 0 && (
                                        <>
                                          {/* Full badge for expanded sidebar */}
                                          <div className="ml-auto flex items-center gap-1 group-data-[collapsible:icon]:hidden">
                                            <span className="text-xs font-medium" style={{ color: 'rgb(239 68 68)' }}>New</span>
                                            <Badge 
                                              variant="outline" 
                                              className="text-xs w-5 h-5 rounded-full flex items-center justify-center p-0 min-w-0 border-0" 
                                              style={{ backgroundColor: 'rgb(239 68 68)', color: 'white' }}
                                            >
                                              {subItem.badge > 99 ? '99+' : subItem.badge}
                                            </Badge>
                                          </div>
                                          {/* Small circle badge for collapsed sidebar */}
                                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center group-data-[collapsible=icon]:flex hidden" style={{ backgroundColor: 'rgb(239 68 68)' }}>
                                            <span className="text-[10px] text-white font-bold">
                                              {subItem.badge > 99 ? '99+' : subItem.badge}
                                            </span>
                                          </div>
                                        </>
                                      )}
                                    </Link>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              </motion.div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SidebarMenuItem>
              )
            }

            // Regular item
            const isActive = pathname === item.url || pathname === item.url + "/" || (item.url === "/" && (pathname === "/" || pathname === "//"))

            return (
              <SidebarMenuItem key={key}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title}
                  className={`${isActive ? "bg-gray-200 dark:bg-teal-600/30 focus:bg-gray-200 dark:focus:bg-teal-600/30 active:bg-gray-200 dark:active:bg-teal-600/30 text-sidebar-accent-foreground dark:text-white hover:!bg-gray-200 dark:hover:!bg-teal-600/30" : "text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"} group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center relative overflow-visible`}
                  onMouseEnter={() => iconRefs.current[key]?.startAnimation?.()}
                  onMouseLeave={() => iconRefs.current[key]?.stopAnimation?.()}
                >
                  <Link href={item.url} className="flex items-center gap-2 group-data-[collapsible=icon]:gap-0 justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
                    {item.icon && (
                      <div className="flex items-center justify-center group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
                        <item.icon
                          ref={(el: any) => {
                            if (el) iconRefs.current[key] = el
                          }}
                          className="h-5 w-5 group-data-[collapsible=icon]:mx-auto"
                        />
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <>
                        {/* Full badge for expanded sidebar */}
                        <div className="ml-auto flex items-center gap-1 group-data-[collapsible=icon]:hidden">
                          <span className="text-xs font-medium" style={{ color: 'rgb(239 68 68)' }}>New</span>
                          <Badge 
                            variant="outline" 
                            className="text-xs w-5 h-5 rounded-full flex items-center justify-center p-0 min-w-0 border-0" 
                            style={{ backgroundColor: 'rgb(239 68 68)', color: 'white' }}
                          >
                            {item.badge > 99 ? '99+' : item.badge}
                          </Badge>
                        </div>
                        {/* Small circle badge for collapsed sidebar */}
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center group-data-[collapsible=icon]:flex hidden" style={{ backgroundColor: 'rgb(239 68 68)' }}>
                          <span className="text-[10px] text-white font-bold">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        </div>
                      </>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
