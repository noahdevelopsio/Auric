import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'btc' | 'sol' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-display font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-border-strong disabled:cursor-not-allowed disabled:opacity-40';
    
    const variants = {
      primary: 'bg-text-primary text-bg-base hover:bg-text-secondary shadow-sm',
      secondary: 'bg-bg-surface border border-border-default text-text-primary hover:bg-bg-elevated hover:border-border-strong',
      outline: 'border border-border-default bg-transparent text-text-primary hover:border-border-strong hover:bg-bg-elevated',
      ghost: 'bg-transparent text-text-primary hover:bg-bg-elevated',
      btc: 'bg-btc-500 text-bg-base hover:bg-btc-600 shadow-btc',
      sol: 'bg-gradient-to-br from-sol-purple to-sol-teal text-bg-base hover:opacity-90 shadow-sol',
      danger: 'border border-semantic-error/30 bg-semantic-errorBg text-semantic-error hover:bg-semantic-errorBg/80',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm rounded-md',
      md: 'h-10 px-4 text-base rounded-md',
      lg: 'h-12 px-6 text-lg rounded-md',
      xl: 'h-14 px-8 text-xl rounded-lg',
    };

    const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={combinedClasses}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
