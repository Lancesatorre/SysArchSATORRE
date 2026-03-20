import React from 'react'

export default function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-[#1a0030]/70 backdrop-blur-md flex items-center justify-center z-[9999]">

      <div className="relative bg-white rounded-3xl shadow-2xl shadow-[#3c096c]/30 px-10 py-10 flex flex-col items-center gap-6 w-80 overflow-hidden">

        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3c096c] via-violet-500 to-[#ff9100]" />

        {/* Animated bars loader */}
        <div className="flex items-end gap-1.5 h-12">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-2.5 rounded-full bg-[#3c096c]"
              style={{
                animation: `barBounce 1s ease-in-out infinite`,
                animationDelay: `${i * 0.12}s`,
                height: '100%',
              }}
            />
          ))}
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="font-black text-[#1a0030] text-lg tracking-tight">{message}</p>
          <p className="text-gray-400 text-xs font-medium mt-1 uppercase tracking-widest">Please wait</p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#3c096c] to-[#ff9100] rounded-full"
            style={{ animation: 'progressSlide 1.6s ease-in-out infinite' }}
          />
        </div>

        {/* Keyframes */}
        <style>{`
          @keyframes barBounce {
            0%, 100% { transform: scaleY(0.3); opacity: 0.4; }
            50%       { transform: scaleY(1);   opacity: 1;   }
          }
          @keyframes progressSlide {
            0%   { width: 0%;    margin-left: 0%; }
            50%  { width: 70%;   margin-left: 15%; }
            100% { width: 0%;    margin-left: 100%; }
          }
        `}</style>
      </div>
    </div>
  )
}