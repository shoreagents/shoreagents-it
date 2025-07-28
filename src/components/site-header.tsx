"use client"

import {
  LogOutIcon,
} from "lucide-react"
import { usePathname } from "next/navigation"


import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"


const user = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.svg",
}

export function SiteHeader() {
  const pathname = usePathname()
  
  const getPageTitle = () => {
    // Handle SSR where pathname might be undefined
    if (!pathname) {
      return "Dashboard"
    }
    
    switch (pathname) {
      case "/":
        return "Dashboard"
      case "/tickets/":
        return "Tickets"
      case "/onboarding/":
        return "Onboarding & Offboarding"
      default:
        return "Dashboard"
    }
  }

  return (
    <header className="sticky top-0 z-50 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear rounded-t-lg rounded-tr-lg">
      <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-base font-medium">{getPageTitle()}</h1>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
