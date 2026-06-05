import React, { forwardRef, HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: 'none' | 'elevate' | 'btc' | 'sol';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', padding = 'md', hover = 'none', children, ...props }, ref) => {
    const baseStyles = 'overflow-hidden rounded-xl border border-border-default bg-bg-surface';
    
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const hovers = {
      none: '',
      elevate: 'transition-all duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-lg',
      btc: 'transition-all duration-300 hover:-translate-y-1 hover:border-btc-500/50 hover:shadow-btc',
      sol: 'transition-all duration-300 hover:-translate-y-1 hover:border-sol-500/50 hover:shadow-sol',
    };

    const combinedClasses = `${baseStyles} ${paddings[padding]} ${hovers[hover]} ${className}`;

    return (
      <div ref={ref} className={combinedClasses} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Add these after Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`mb-4 flex flex-col space-y-1.5 ${className}`} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => (
    <h3 ref={ref} className={`font-display text-display-sm font-semibold tracking-[-0.02em] text-text-primary ${className}`} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => (
    <p ref={ref} className={`text-sm leading-6 text-text-secondary ${className}`} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={className} {...props} />
  )
);
CardContent.displayName = 'CardContent';