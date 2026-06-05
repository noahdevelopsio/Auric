import React, { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'outline' | 'btc' | 'sol' | 'success' | 'warning' | 'error' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ 
  className = '', 
  variant = 'neutral', 
  children, 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border';
  
  const variants = {
    neutral: 'bg-bg-elevated border-border-default text-text-secondary',
    outline: 'bg-transparent border-border-default text-text-primary',
    btc: 'bg-btc-glow border-btc-500/30 text-btc-500',
    sol: 'bg-sol-glow border-sol-500/30 text-sol-500',
    success: 'bg-semantic-successBg border-semantic-success/30 text-semantic-success',
    warning: 'bg-semantic-warningBg border-semantic-warning/30 text-semantic-warning',
    error: 'bg-semantic-errorBg border-semantic-error/30 text-semantic-error',
    info: 'bg-semantic-infoBg border-semantic-info/30 text-semantic-info',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
