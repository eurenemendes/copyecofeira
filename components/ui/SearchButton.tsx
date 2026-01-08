
import React from 'react';

interface SearchButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const SearchButton: React.FC<SearchButtonProps> = ({ 
  onClick, 
  label = "Buscar", 
  className = "" 
}) => {
  return (
    <button 
      onClick={onClick} 
      className={`bg-brand hover:bg-brand-dark text-white font-[900] py-3 sm:py-6 px-10 sm:px-16 rounded-xl sm:rounded-[2rem] transition-all shadow-xl shadow-brand/30 hover:scale-105 active:scale-95 text-sm sm:text-base ${className}`}
    >
      {label}
    </button>
  );
};
