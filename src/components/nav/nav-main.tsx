"use client"

import { type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useRef } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  className = "",
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon | any
    badge?: number
    badgeLabel?: string
  }[]
  className?: string
}) {
  const pathname = usePathname()
  const iconRefs = useRef<Record<string, any>>({})
  
  return (
    <SidebarGroup className={className}>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || pathname === item.url + "/" || (item.url === "/" && (pathname === "/" || pathname === "//"))
            const key = item.title

            return (
              <SidebarMenuItem key={key}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title}
                  className={`${isActive ? "bg-teal-600/50 dark:bg-teal-600/30 focus:bg-teal-600/50 dark:focus:bg-teal-600/30 active:bg-teal-600/50 dark:active:bg-teal-600/30 text-sidebar-accent-foreground dark:text-sidebar-accent-foreground" : "text-sidebar-accent-foreground hover:bg-primary/5 hover:text-sidebar-accent-foreground"} ${isActive ? "hover:!bg-teal-600/50 dark:hover:!bg-teal-600/30" : ""} group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center relative overflow-visible`}
                  onMouseEnter={() => iconRefs.current[key]?.startAnimation?.()}
                  onMouseLeave={() => iconRefs.current[key]?.stopAnimation?.()}
                >
                  <Link href={item.url} className="flex items-center gap-2 justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
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
                    <div className="flex items-center group-data-[collapsible=icon]:hidden">
                      <span>{item.title}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <>
                        {/* Full badge for expanded sidebar */}
                        <div className="ml-auto flex items-center gap-1 group-data-[collapsible=icon]:hidden">
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
