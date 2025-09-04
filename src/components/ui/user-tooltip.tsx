"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "next-themes"

interface User {
  user_id: number
  first_name: string | null
  last_name: string | null
  profile_picture: string | null
  employee_id: string | null
}

interface UserTooltipProps {
  user: User
  showEmployeeId?: boolean
  className?: string
}

export function UserTooltip({ user, showEmployeeId = true, className = "" }: UserTooltipProps) {
  const { theme } = useTheme()
  
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown'
  const initials = ((user.first_name || 'U')[0] + (user.last_name || 'N')[0]).toUpperCase()
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div className={`flex items-center justify-center gap-2 cursor-pointer ${className}`}>
            <Avatar className="h-7 w-7">
              <AvatarImage 
                src={user.profile_picture ?? undefined} 
                alt={fullName} 
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-sm px-3 py-2">
          <span className="font-medium">{fullName}</span>
          {showEmployeeId && user.employee_id && (
            <Badge
              variant="outline"
              className="border ml-2"
              style={
                theme === 'dark'
                  ? { backgroundColor: '#44464880', borderColor: '#444648', color: '#ffffff' }
                  : { backgroundColor: '#44464814', borderColor: '#a5a5a540', color: '#444648' }
              }
            >
              {user.employee_id}
            </Badge>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
