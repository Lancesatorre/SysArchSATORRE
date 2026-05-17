import React from 'react';

export default function LoadingScreen({ message = "Loading Command Center..." }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          {/* Background Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-[#3c096c]/08" />
          {/* Spinning Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-t-[#3c096c] border-r-[#ff9100] animate-spin" />
          {/* Ambient Glow */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#3c096c] to-[#ff9100] opacity-20 blur-md animate-pulse" />
        </div>
        <p className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-[#3c096c]/70 animate-pulse mt-2 select-none">
          {message}
        </p>
      </div>
    </div>
  );
}
