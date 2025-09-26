"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { IconSearch, IconX } from "@tabler/icons-react"

export interface Client {
  user_id: number
  first_name: string | null
  last_name: string | null
  profile_picture: string | null
  member_company: string | null
  member_badge_color: string | null
}

export interface ClientSelectionProps {
  clients: Client[]
  selectedClientIds: Set<number>
  onSelectionChange: (clientId: number, isSelected: boolean) => void
  onSearchChange: (search: string) => void
  searchValue: string
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  onLoadMore: () => void
  onDone: () => void
  currentCompany?: string | null
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
}

export function ClientSelection({
  clients,
  selectedClientIds,
  onSelectionChange,
  onSearchChange,
  searchValue,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onDone,
  currentCompany,
  onScroll
}: ClientSelectionProps) {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const { scrollTop, scrollHeight, clientHeight } = target
    
    // Load more when user scrolls to 80% of the content
    if (scrollTop + clientHeight >= scrollHeight * 0.8 && hasMore && !isLoadingMore) {
      onLoadMore()
    }
    
    // Call custom scroll handler if provided
    if (onScroll) {
      onScroll(e)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter */}
      <div className="space-y-3 flex-shrink-0">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
            tabIndex={-1}
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Clients List */}
      <div 
        data-client-list
        className="space-y-4 flex-1 overflow-y-auto min-h-0 px-2 py-4"
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="p-4 border rounded-lg animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-6 bg-muted rounded flex-shrink-0"></div>
                </div>
              </div>
            ))}
          </div>
        ) : clients.length > 0 ? (
          <>
            <div className="space-y-3">
              {clients.map((client) => (
                <div 
                  key={client.user_id}
                   className={`px-4 py-2 border border-gray-300 dark:border-border rounded-lg transition-all duration-200 ${
                    client.member_company && client.member_company !== currentCompany
                      ? 'opacity-50 cursor-not-allowed bg-muted/30' 
                      : `cursor-pointer ${
                          selectedClientIds.has(client.user_id)
                            ? 'border-primary/50 bg-primary/5'
                            : 'hover:border-primary/50 hover:bg-primary/5'
                        }`
                  }`}
                  onClick={() => {
                    // Disable selection for clients assigned to other companies
                    if (client.member_company && client.member_company !== currentCompany) return
                    
                    const wasSelected = selectedClientIds.has(client.user_id)
                    onSelectionChange(client.user_id, !wasSelected)
                  }}
                >
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={client.profile_picture || undefined} alt={client.first_name || 'Client'} />
                        <AvatarFallback>
                          {client.first_name && client.last_name 
                            ? `${client.first_name.charAt(0)}${client.last_name.charAt(0)}`
                            : client.first_name?.charAt(0) || client.last_name?.charAt(0) || 'C'
                          }
                        </AvatarFallback>
                      </Avatar>
                      {selectedClientIds.has(client.user_id) && (!client.member_company || client.member_company === currentCompany) && (
                        <div className="absolute inset-0 rounded-full" style={{ backgroundColor: '#73a2bb80' }}></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {client.first_name && client.last_name 
                          ? `${client.first_name} ${client.last_name}` 
                          : client.first_name || client.last_name || 'Unknown Name'
                        }
                      </h4>
                      {!selectedClientIds.has(client.user_id) && client.member_company && client.member_company !== currentCompany && (
                        <Badge 
                          variant="outline"
                          className="text-xs px-2 py-0.5 font-medium inline-block mt-1 truncate max-w-[120px]"
                          style={{ 
                            color: client.member_badge_color || '#6B7280',
                            borderColor: client.member_badge_color ? `${client.member_badge_color}30` : '#6B7280',
                            backgroundColor: client.member_badge_color ? `${client.member_badge_color}20` : 'transparent'
                          }}
                          title={client.member_company || undefined}
                        >
                          {client.member_company}
                        </Badge>
                      )}
                    </div>
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
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm font-medium">No Clients Found</p>
          </div>
        )}
      </div>

      {/* Done Button */}
      <div className="flex-shrink-0">
        <Button
          onClick={onDone}
          className="w-full"
          tabIndex={-1}
        >
          Done
        </Button>
      </div>
    </div>
  )
}
