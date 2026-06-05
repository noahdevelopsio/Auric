"use client";

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = React.useId();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Focus trap and restore
  useEffect(() => {
    let previousActive: Element | null = null;
    function getFocusable(container: HTMLElement | null) {
      if (!container) return [] as HTMLElement[];
      const selectors = ['a[href]', 'button:not([disabled])', 'textarea:not([disabled])', 'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])'];
      return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(','))).filter(Boolean);
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const container = dialogRef.current;
      if (!container) return;
      const focusable = getFocusable(container);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    }

    if (isOpen) {
      previousActive = document.activeElement;
      document.addEventListener('keydown', handleKey);
      // focus first focusable in dialog
      requestAnimationFrame(() => {
        const focusable = getFocusable(dialogRef.current!);
        if (focusable.length) focusable[0].focus();
        else dialogRef.current?.focus();
      });
    }

    return () => {
      document.removeEventListener('keydown', handleKey);
      if (previousActive instanceof HTMLElement) previousActive.focus();
    };
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    full: 'max-w-[calc(100%-2rem)]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex sm:items-center items-end justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden border border-border-default bg-bg-surface shadow-xl sm:mx-0 sm:rounded-xl rounded-t-xl ${maxWidthClasses[maxWidth]}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            ref={dialogRef}
            tabIndex={-1}
          >
            {(title || showCloseButton) && (
              <div className="flex shrink-0 items-center justify-between border-b border-border-subtle p-6">
                {title ? (
                  typeof title === 'string' ? (
                    <h2 id={titleId} className="font-display text-display-md tracking-[-0.02em] text-text-primary">{title}</h2>
                  ) : (
                    // If title is a node, attempt to pass id via cloning
                    React.isValidElement(title) ? React.cloneElement(title as React.ReactElement, { id: titleId }) : title
                  )
                ) : (
                  <div /> /* Spacer */
                )}
                
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="-mr-2 rounded-full p-2 text-text-tertiary transition-colors hover:bg-bg-elevated hover:text-text-primary focus:outline-none"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            
            <div className="overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
