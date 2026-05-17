import React from 'react'
import Navbar from './Navbar'
import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-[#cbd5e1] relative transition-colors duration-300">

      {/* Top-left purple glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#3c096c]/15 blur-3xl pointer-events-none dark:hidden z-0" />

      {/* Top-right faint orange */}
      <div className="absolute -top-10 right-0 w-72 h-72 rounded-full bg-[#ff9100]/10 blur-3xl pointer-events-none dark:hidden z-0" />

      {/* Bottom-left soft violet */}
      <div className="absolute bottom-0 -left-10 w-64 h-64 rounded-full bg-violet-300/15 blur-3xl pointer-events-none dark:hidden z-0" />

      {/* Bottom-right warm glow */}
      <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-[#ff9100]/10 blur-3xl pointer-events-none dark:hidden z-0" />

      {/* Content */}
      <div className="relative pt-3">
        <Navbar />
        <main className="px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10">
          <Outlet />
        </main>
      </div>

    </div>
  )
}