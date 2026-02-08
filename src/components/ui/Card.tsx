import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-800 ${className}`}>
      {title && <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-white">{title}</h2>}
      {children}
    </div>
  );
}