"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator, SelectGroup, SelectLabel } from "@/components/ui/select"
import { IconSearch, IconX } from "@tabler/icons-react"
import { useTheme } from "next-themes"

export interface Agent {
  user_id: number
  first_name: string | null
  last_name: string | null
  employee_id: string | null
  job_title: string | null
  profile_picture: string | null
  company_name: string | null
  company_badge_color: string | null
}

export interface AgentSelectionProps {
  agents: Agent[]
  selectedAgentIds: Set<number>
  onSelectionChange: (agentId: number, isSelected: boolean) => void
  onSearchChange: (search: string) => void
  searchValue: string
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  onLoadMore: () => void
  onDone: () => void
  currentCompany?: string | null
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
  showDisabledStyling?: boolean
  onSelectAll?: () => void
  onDeselectAll?: () => void
  totalCount?: number
  companyFilter?: string
  onCompanyFilterChange?: (companyId: string) => void
  companyOptions?: { id: number; company: string }[]
}

export function AgentSelection({
  agents,
  selectedAgentIds,
  onSelectionChange,
  onSearchChange,
  searchValue,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onDone,
  currentCompany,
  onScroll,
  showDisabledStyling = true,
  onSelectAll,
  onDeselectAll,
  totalCount,
  companyFilter = 'all',
  onCompanyFilterChange,
  companyOptions = []
}: AgentSelectionProps) {
  const { theme } = useTheme()

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
      <div className="space-y-3 flex-shrink-0 pb-2">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or employee ID..."
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
        
        {/* Select All Badge and Company Filter */}
        <div className="flex items-center justify-between gap-3">
          {/* Company Dropdown */}
          {onCompanyFilterChange && (
            <div className="w-48">
              <Select value={companyFilter} onValueChange={onCompanyFilterChange}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  <SelectItem value="none">No Assigned Company</SelectItem>
                  {companyOptions.length > 0 && (
                    <>
                      <SelectSeparator className="bg-border mx-2" />
                      <SelectGroup>
                        <SelectLabel className="text-muted-foreground">Companies</SelectLabel>
                        {companyOptions.map((company) => (
                          <SelectItem key={company.id} value={String(company.id)}>
                            {company.company}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Select All Badge */}
          {(onSelectAll || onDeselectAll) && (
            <div className="relative">
              <input
                type="checkbox"
                id="select-all-agents"
                checked={(() => {
                  // During loading, don't show as checked
                  if (isLoading) return false
                  
                  // Check if all agents in current filter are selected
                  const allCurrentAgentsSelected = agents.length > 0 && 
                    agents.every(agent => selectedAgentIds.has(agent.user_id))
                  
                  return allCurrentAgentsSelected
                })()}
                onChange={(e) => {
                  if (e.target.checked) {
                    onSelectAll?.()
                  } else {
                    onDeselectAll?.()
                  }
                }}
                className="sr-only"
                tabIndex={-1}
              />
              <div 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all duration-200 ${
                  isLoading 
                    ? 'bg-muted/20 border-border text-muted-foreground/50 cursor-not-allowed'
                    : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50 hover:border-primary/50 cursor-pointer'
                }`}
                onClick={() => {
                  // Don't allow interaction during loading
                  if (isLoading) return
                  
                  // Check if all agents in current filter are selected
                  const allCurrentAgentsSelected = agents.length > 0 && 
                    agents.every(agent => selectedAgentIds.has(agent.user_id))
                  
                  if (allCurrentAgentsSelected) {
                    onDeselectAll?.()
                  } else {
                    onSelectAll?.()
                  }
                }}
              >
                <div 
                  className={`relative h-4 w-4 rounded-full border transition-all duration-200 ${
                    isLoading 
                      ? 'border-current opacity-50'
                      : (() => {
                          // Check if all agents in current filter are selected
                          const allCurrentAgentsSelected = agents.length > 0 && 
                            agents.every(agent => selectedAgentIds.has(agent.user_id))
                          return allCurrentAgentsSelected
                        })()
                        ? 'bg-teal-600 border-teal-600'
                        : 'border-current'
                  }`}
                >
                  {!isLoading && (() => {
                    // Check if all agents in current filter are selected
                    const allCurrentAgentsSelected = agents.length > 0 && 
                      agents.every(agent => selectedAgentIds.has(agent.user_id))
                    return allCurrentAgentsSelected
                  })() && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">Select All</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agents List */}
      <div 
        data-agent-list
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
        ) : agents.length > 0 ? (
          <>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div 
                  key={agent.user_id}
                   className={`px-4 py-2 border border-gray-300 dark:border-border rounded-lg transition-all duration-200 ${
                    showDisabledStyling && agent.company_name && agent.company_name !== currentCompany
                      ? 'opacity-50 cursor-not-allowed bg-muted/30' 
                      : `cursor-pointer ${
                          selectedAgentIds.has(agent.user_id)
                            ? 'border-primary/50 bg-primary/5'
                            : 'hover:border-primary/50 hover:bg-primary/5'
                        }`
                  }`}
                  onClick={() => {
                    // Disable selection for agents assigned to other companies (only if showDisabledStyling is true)
                    if (showDisabledStyling && agent.company_name && agent.company_name !== currentCompany) return
                    
                    const wasSelected = selectedAgentIds.has(agent.user_id)
                    onSelectionChange(agent.user_id, !wasSelected)
                  }}
                >
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={agent.profile_picture || undefined} alt={agent.first_name || 'Agent'} />
                        <AvatarFallback>
                          {agent.first_name && agent.last_name 
                            ? `${agent.first_name.charAt(0)}${agent.last_name.charAt(0)}`
                            : agent.first_name?.charAt(0) || agent.last_name?.charAt(0) || 'A'
                          }
                        </AvatarFallback>
                      </Avatar>
                      {selectedAgentIds.has(agent.user_id) && (!currentCompany || !agent.company_name || agent.company_name === currentCompany) && (
                        <div className="absolute inset-0 rounded-full" style={{ backgroundColor: '#73a2bb80' }}></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {agent.first_name && agent.last_name 
                          ? `${agent.first_name} ${agent.last_name}` 
                          : agent.first_name || agent.last_name || 'Unknown Name'
                        }
                      </h4>
                      {agent.company_name && agent.company_name !== currentCompany && (
                        <Badge 
                          variant="outline"
                          className="text-xs px-2 py-0.5 font-medium inline-block mt-1 truncate max-w-[120px]"
                          style={{ 
                            color: agent.company_badge_color || '#6B7280',
                            borderColor: agent.company_badge_color ? `${agent.company_badge_color}30` : '#6B7280',
                            backgroundColor: agent.company_badge_color ? `${agent.company_badge_color}20` : 'transparent'
                          }}
                          title={agent.company_name || undefined}
                        >
                          {agent.company_name}
                        </Badge>
                      )}
                    </div>
                    {agent.employee_id && (
                      <Badge 
                        variant="outline" 
                        className="text-xs px-2 py-0.5 border flex-shrink-0"
                        style={
                          theme === 'dark'
                            ? { backgroundColor: '#44464880', borderColor: '#444648', color: '#ffffff' }
                            : { backgroundColor: '#44464814', borderColor: '#a5a5a540', color: '#444648' }
                        }
                      >
                        {agent.employee_id}
                      </Badge>
                    )}
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
            <p className="text-sm font-medium">No Agents Found</p>
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