"use client";

import React from 'react';
import { useToastStore, Toast as ToastType } from '@/store/toastStore';
import { X, CheckCircle, AlertCircle, Info as InfoIcon, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const Toast: React.FC<{ toast: ToastType; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-semantic-success" />,
    error: <AlertCircle className="h-5 w-5 text-semantic-error" />,
    info: <InfoIcon className="h-5 w-5 text-semantic-info" />,
    warning: <AlertTriangle className="h-5 w-5 text-semantic-warning" />,
  };

  const bgColors = {
    success: 'bg-semantic-successBg border-semantic-success/20',
    error: 'bg-semantic-errorBg border-semantic-error/20',
    info: 'bg-semantic-infoBg border-semantic-info/20',
    warning: 'bg-semantic-warningBg border-semantic-warning/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`mb-3 flex w-full max-w-sm items-start rounded-lg border p-4 shadow-lg backdrop-blur-md pointer-events-auto ${bgColors[toast.type]}`}
    >
      <div className="mr-3 flex-shrink-0">{icons[toast.type]}</div>
      <div className="mr-2 flex-1">
        <h4 className="text-sm font-medium text-text-primary">{toast.message}</h4>
        {toast.description && (
          <p className="mt-1 text-sm leading-6 text-text-secondary">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-auto flex-shrink-0 text-text-tertiary transition-colors hover:text-text-primary focus:outline-none"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export const ToastProvider: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col items-end overflow-hidden p-4 pb-20 sm:max-w-sm sm:p-6 sm:pb-6">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export const ToastContainer = ToastProvider;