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
  const baseStyles = 'rounded-lg font-medium transition-colors focus:outline-none focus:ring-1 cursor-pointer';
  
  const variants = {
    primary: 'bg-gradient-to-b from-neutral-300/10 via-neutral-300/5 to-neutral-800/20 text-white shadow-lg shadow-black/10 hover:bg-neutral-800 focus:ring-neutral-300',
    secondary: 'bg-secondary text-white hover:bg-amber-600 focus:ring-amber-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-300',
    outline: 'border-2 border-neutral-800 text-white hover:bg-neutral-800 hover:text-white focus:ring-neutral-300',
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