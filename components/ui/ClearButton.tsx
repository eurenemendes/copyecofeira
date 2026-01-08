
import React from 'react';

interface ClearButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const ClearButton: React.FC<ClearButtonProps> = ({ onClick, label = "Limpar", className = "" }) => {
  return (
    <button 
      onClick={onClick} 
      className={`bg-red-500 text-white font-black px-6 py-3 rounded-xl hover:scale-105 flex items-center justify-center space-x-2 transition-all shadow-lg shadow-red-500/20 active:scale-95 ${className}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      <span>{label}</span>
    </button>
  );
};
