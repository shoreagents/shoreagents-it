'use client'

import React from 'react';
import { supabase } from '@/lib/supabase'

interface DashboardProps {
  email?: string;
  onLogout?: () => void;
}

export default function Dashboard({ email = '', onLogout }: DashboardProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    if (onLogout) {
      onLogout()
    }
  }

  return (
    <div className="min-h-screen bg-[#e5e1e6] p-6 flex flex-col gap-6">
      {/* Header Bar */}
      <header className="bg-[#7EAC0B] rounded-2xl px-6 py-3 flex items-center justify-between">
        <span className="text-white font-semibold text-lg truncate max-w-xs">{email}</span>
            <button
              onClick={handleLogout}
          className="bg-white hover:bg-gray-100 text-[#7EAC0B] font-semibold px-4 py-2 rounded-md transition-colors"
            >
              Logout
            </button>
      </header>

      {/* Main Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Discount Card */}
          <div className="bg-white rounded-2xl shadow min-h-[180px] p-0">
            <div className="w-full flex items-start justify-between p-0 m-0">
              <img src="/images/Sophos-Logo.png" alt="Sophos Logo" className="h-4 object-contain ml-4 mt-4 mb-3" />
              <span className="mr-4 mt-4 mb-3 text-gray-400 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
            <hr className="border-gray-300 border-t-1 w-full m-0" />
          </div>
          {/* Ticket Card */}
          <div className="bg-white rounded-2xl p-4 shadow min-h-[180px]" />
        </div>

        {/* Center Column */}
        <div className="flex flex-col gap-6">
          {/* Upcoming Flights Card */}
          <div className="bg-white rounded-2xl p-4 shadow min-h-[180px]" />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Map Card */}
          <div className="bg-white rounded-2xl p-4 shadow min-h-[180px]" />
          {/* Pro Plan Card */}
          <div className="bg-emerald-900 rounded-2xl p-6 shadow min-h-[180px]" />
        </div>
      </div>
    </div>
  );
} 