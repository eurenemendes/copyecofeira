import React from 'react';

interface InputClearButtonProps {
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const InputClearButton: React.FC<InputClearButtonProps> = ({ 
  onClick, 
  className = "",
  size = 'md'
}) => {
  const sizeClasses = {
    sm: "p-2 rounded-lg",
    md: "p-2.5 sm:p-4 rounded-lg sm:rounded-xl",
    lg: "p-3 sm:p-6 rounded-xl sm:rounded-2xl"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-4 h-4 sm:w-6 sm:h-6",
    lg: "w-5 h-5 sm:w-7 sm:h-7"
  };

  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }} 
      className={`bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center ${sizeClasses[size]} ${className}`}
      aria-label="Limpar campo"
    >
      <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
};