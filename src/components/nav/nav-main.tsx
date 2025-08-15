"use client"

import { type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useRef } from "react"
import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon | any
  }[]
}) {
  const pathname = usePathname()
  const iconRefs = useRef<Record<string, any>>({})
  
  return (
    <SidebarGroup>
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
                  className={`${isActive ? "bg-gray-200 dark:bg-teal-600/30 focus:bg-gray-200 dark:focus:bg-teal-600/30 active:bg-gray-200 dark:active:bg-teal-600/30 text-sidebar-accent-foreground dark:text-white hover:!bg-gray-200 dark:hover:!bg-teal-600/30" : "text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"} group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center`}
                  onMouseEnter={() => iconRefs.current[key]?.startAnimation?.()}
                  onMouseLeave={() => iconRefs.current[key]?.stopAnimation?.()}
                >
                  <Link href={item.url} className="flex items-center justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
                    {item.icon && (
                      <item.icon
                        ref={(el: any) => {
                          if (el) iconRefs.current[key] = el
                        }}
                        className="h-5 w-5"
                      />
                    )}
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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
