import React, { forwardRef, InputHTMLAttributes, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            className={`h-11 w-full rounded-md border bg-bg-overlay px-4 text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-border-strong disabled:cursor-not-allowed disabled:opacity-50
            ${error ? 'border-semantic-error focus:ring-semantic-error/50' : 'border-border-default hover:border-border-strong'}
            ${className}`}
            {...props}
          />
        </div>
        {(error || hint) && (
          <p className={`text-xs leading-5 ${error ? 'text-semantic-error' : 'text-text-tertiary'}`}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
