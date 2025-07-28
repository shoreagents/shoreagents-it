"use client"

import { type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  className,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
  className?: string
}) {
  const pathname = usePathname()
  
  return (
    <SidebarGroup className={className}>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || pathname === item.url + "/"
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title}
                  className={isActive ? "bg-gray-200 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-800 focus:bg-gray-200 dark:focus:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-800 text-sidebar-accent-foreground" : "text-sidebar-accent-foreground hover:text-sidebar-accent-foreground"}
                >
                  <a href={item.url}>
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
