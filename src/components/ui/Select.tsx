'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: readonly SelectOption[] | SelectOption[];
  helperText?: string;
  value?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (e: { target: { name?: string; value: string } }) => void;
}

const Select = React.forwardRef<HTMLInputElement, SelectProps>(
  ({ label, error, options, helperText, className = '', required, value, onChange, name, disabled, placeholder = "Select an option", ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Cari label berdasarkan value yang terpilih
    const selectedOption = options.find((opt) => opt.value === value);

    // Handle klik di luar komponen untuk menutup dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
      if (onChange) {
        // Simulasi event object agar kompatibel dengan form library standar
        onChange({ target: { name, value: optionValue } });
      }
      setIsOpen(false);
    };

    return (
      <div className="w-full" ref={containerRef}>
        {label && (
          <label className="block text-sm font-medium text-neutral-700 dark:text-white mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Hidden Input untuk memastikan Ref dan Form submission tetap berjalan 
            jika menggunakan library seperti React Hook Form
          */}
          <input
            type="hidden"
            name={name}
            value={value}
            ref={ref}
            required={required}
          />

          {/* Trigger Button (Tampilan Input Utama) */}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`
              w-full px-4 py-2.5 pr-10 text-left relative flex items-center justify-between
              bg-white dark:bg-neutral-900
              border border-neutral-300 dark:border-neutral-800
              rounded-lg
              transition-all
              focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-transparent
              ${disabled ? 'bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed opacity-50' : 'cursor-pointer'}
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
          >
            <span className={`block truncate ${!selectedOption ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown 
                className={`w-5 h-5 text-neutral-400 dark:text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              />
            </div>
          </button>

          {/* Dropdown Menu (Style disesuaikan dengan Navbar Dropdown) */}
          {isOpen && (
            <div className="absolute z-40 w-full mt-2 overflow-hidden origin-top-right">
                {/* STYLE UPDATE:
                   Menggunakan style yang sama persis dengan dropdown navbar Anda:
                   - backdrop-blur-md
                   - dark:bg-neutral-900/60 (transparan)
                   - rounded-xl
                   - shadow-lg
                */}
              <div className="bg-white dark:bg-neutral-900/60 backdrop-blur-md rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 py-2 ">
                {options.length > 0 ? (
                  options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`
                        w-full px-4 py-3 text-left text-sm flex items-center justify-between group transition-colors
                        ${option.value === value 
                          ? 'bg-neutral-100 dark:bg-neutral-800/50 text-neutral-900 dark:text-white font-medium' 
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        }
                      `}
                    >
                      <span>{option.label}</span>
                      {option.value === value && (
                        <Check className="w-4 h-4 text-neutral-900 dark:text-white" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 text-center">
                    No options available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            {helperText}
          </p>
        )}

        {error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;