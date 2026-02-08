import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]';
  
  const variants = {
    // Primary: Light (Hitam) | Dark (Putih)
    primary: 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 focus:ring-neutral-500',
    
    // Secondary: Tetap Oranye (Amber)
    secondary: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500',
    
    // Danger: Tetap Merah
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    
    // Outline: Border menyesuaikan teks dan garis tema
    outline: 'border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:ring-neutral-400',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}