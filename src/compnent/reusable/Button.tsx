import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'secondary', 
  icon,
  size = 'md'
}) => {
  const baseStyles = "rounded-md font-medium flex items-center gap-2 transition-colors";
  const variants = {
    primary: "bg-teal-600 text-white hover:bg-teal-700",
    secondary: "text-gray-600 hover:bg-gray-100 border border-gray-300",
    danger: "text-red-600 hover:bg-red-50"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm"
  };

  return (
    <button 
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]}`}
    >
      {icon}
      {children}
    </button>
  );
};
