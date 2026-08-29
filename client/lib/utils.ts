import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function to merge class names with Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format 2-digit padded numbers or 2 decimal places for floats
export function padTwo(num: number | string): string {
  const n = typeof num === "number" ? num : parseFloat(String(num));
  if (!isNaN(n) && !Number.isInteger(n)) {
    return n.toFixed(2);
  }
  return String(num).padStart(2, "0");
}

// Format timestamp for agent logging
export function formatLogTime(date = new Date()): string {
  return date.toTimeString().split(" ")[0];
}

// Agent badge CSS class mapping
export function agentBadgeClass(agent: string): string {
  const map: Record<string, string> = {
    PLANNER: "badge-planner",
    SYNTHESIZER: "badge-synthesizer",
    EXECUTOR: "badge-executor",
    VALIDATOR: "badge-validator",
  };
  return map[agent] || "badge-default";
}

// Utility function to format a number with currency
export function formatCurrency(
  amount: number,
  currency = "USD",
  options?: Omit<Intl.NumberFormatOptions, "style" | "currency">
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    ...options,
  }).format(amount);
}

// Utility function to generate a unique ID
export function generateUniqueId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

// Utility function to truncate text
export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Utility function to format date
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

// Utility function to debounce function calls
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Utility function to throttle function calls
export function throttle<T extends (...args: any[]) => void>(func: T, limit: number) {
  let inThrottle = false;
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
