"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { IconTrophy } from "@tabler/icons-react"
import { LeaderboardModal } from "@/components/modals/leaderboard-modal"

interface AgentRecord {
  user_id: number
  email: string
  user_type: string
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  nickname: string | null
  profile_picture: string | null
  phone: string | null
  birthday: string | null
  city: string | null
  address: string | null
  gender: string | null
  employee_id: string | null
  job_title: string | null
  work_email: string | null
  shift_period: string | null
  shift_schedule: string | null
  shift_time: string | null
  work_setup: string | null
  employment_status: string | null
  hire_type: string | null
  staff_source: string | null
  start_date: string | null
  exit_date: string | null
  company_id: number | null
  company_name: string | null
  company_badge_color: string | null
  department_id: number | null
  department_name: string | null
  station_id: string | null
}

interface LeaderboardModalDemoProps {
  agentData?: AgentRecord
}

export function LeaderboardModalDemo({ agentData }: LeaderboardModalDemoProps) {
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = React.useState(false)

  // Example agent data for demo purposes
  const demoAgentData: AgentRecord = {
    user_id: 1,
    email: "john.doe@example.com",
    user_type: "Agent",
    first_name: "John",
    middle_name: null,
    last_name: "Doe",
    nickname: null,
    profile_picture: null,
    phone: "+1234567890",
    birthday: "1990-01-01",
    city: "New York",
    address: "123 Main St",
    gender: "Male",
    employee_id: "EMP001",
    job_title: "Customer Service Agent",
    work_email: "john.doe@company.com",
    shift_period: "Day",
    shift_schedule: "Monday-Friday",
    shift_time: "9:00 AM - 5:00 PM",
    work_setup: "Remote",
    employment_status: "Active",
    hire_type: "Full-time",
    staff_source: "Direct Hire",
    start_date: "2023-01-01",
    exit_date: null,
    company_id: 1,
    company_name: "Example Company",
    company_badge_color: "#3B82F6",
    department_id: 1,
    department_name: "Customer Service",
    station_id: "ST001"
  }

  const agentToUse = agentData || demoAgentData

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Leaderboard Modal Demo</h2>
        <p className="text-muted-foreground mb-4">
          Click the button below to open the leaderboard modal for {agentToUse.first_name} {agentToUse.last_name}
        </p>
      </div>
      
      <div className="flex justify-center">
        <Button 
          onClick={() => setIsLeaderboardModalOpen(true)}
          className="flex items-center gap-2"
        >
          <IconTrophy className="h-4 w-4" />
          View Leaderboard Performance
        </Button>
      </div>

      <LeaderboardModal
        isOpen={isLeaderboardModalOpen}
        onClose={() => setIsLeaderboardModalOpen(false)}
        agentId={agentToUse.user_id.toString()}
        agentData={agentToUse}
      />
    </div>
  )
}
