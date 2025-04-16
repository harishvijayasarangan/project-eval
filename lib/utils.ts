import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Enhanced logging utility for developers
export const logger = {
  // Log levels
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`ℹ️ INFO: ${message}`, data ? data : '');
    }
  },
  
  warn: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️ WARNING: ${message}`, data ? data : '');
    }
  },
  
  error: (message: string, error?: any) => {
    // Always log errors, even in production
    console.error(`🔴 ERROR: ${message}`);
    
    if (error) {
      if (error instanceof Error) {
        console.error(`  Message: ${error.message}`);
        console.error(`  Stack: ${error.stack}`);
      } else {
        console.error('  Details:', error);
      }
    }
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 DEBUG: ${message}`, data ? data : '');
    }
  },
  
  // For timing operations
  time: (label: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.time(`⏱️ ${label}`);
    }
  },
  
  timeEnd: (label: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.timeEnd(`⏱️ ${label}`);
    }
  }
};
