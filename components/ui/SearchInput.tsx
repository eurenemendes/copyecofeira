import React from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  iconClassName?: string;
  inputClassName?: string;
  hideIconOnMobile?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onFocus,
  onKeyDown,
  placeholder = "O que você procura?",
  iconClassName = "text-brand",
  inputClassName = "",
  hideIconOnMobile = true
}) => {
  return (
    <div className="flex items-center flex-grow">
      <div className={hideIconOnMobile ? "hidden sm:block" : "block"}>
        <svg className={`w-5 h-5 sm:w-7 sm:h-7 ${iconClassName}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        onFocus={onFocus} 
        onKeyDown={onKeyDown} 
        className={`w-full bg-transparent border-none focus:ring-0 py-3 sm:py-6 text-base sm:text-xl font-bold dark:text-white placeholder-gray-400 text-center sm:text-left outline-none ${hideIconOnMobile ? 'pl-0 sm:pl-4' : 'pl-4 sm:pl-8'} ${inputClassName}`} 
      />
    </div>
  );
};