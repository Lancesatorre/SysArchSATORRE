import React from 'react'
import Navbar from './Navbar';
import { Outlet } from "react-router-dom";

export default function 
() {
  return (
    <div className="min-h-screen bg-gradient-to-br  from-gray-400 to-white">

      <div className="relative z-10 pt-3">
        <Navbar />
        <main className="px-10">
          <Outlet />
        </main>
      </div>

    </div>

  );
}
