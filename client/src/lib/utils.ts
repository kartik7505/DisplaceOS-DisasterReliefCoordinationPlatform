import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RequestStatus, SupplyCategory } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_COLORS: Record<RequestStatus, string> = {
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  approved: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  allocated: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  dispatched: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  delivered: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/40",
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  allocated: "Allocated",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const CATEGORY_ICONS: Record<SupplyCategory, string> = {
  food: "??",
  water: "??",
  medicine: "??",
  shelter: "???",
  clothing: "??",
  hygiene: "??",
  tools: "??",
  other: "??",
};

export const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "CRITICAL", color: "text-red-400" },
  2: { label: "HIGH", color: "text-orange-400" },
  3: { label: "MEDIUM", color: "text-amber-400" },
  4: { label: "LOW", color: "text-blue-400" },
  5: { label: "MINIMAL", color: "text-slate-400" },
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  regional_coordinator: "Regional Coordinator",
  camp_manager: "Camp Manager",
  volunteer: "Volunteer",
};

export const DEMO_BANNER = "??  DEMO MODE â€” Synthetic data, not real operations";

export function formatDate(iso?: string | null): string {
  if (!iso) return "â€”";
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "â€”";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
