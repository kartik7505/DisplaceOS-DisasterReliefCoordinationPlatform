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

export const STATUS_LABELS_HI: Record<RequestStatus, string> = {
  pending: "लंबित",
  approved: "स्वीकृत",
  allocated: "आवंटित",
  dispatched: "प्रेषित",
  delivered: "वितरित",
  cancelled: "रद्द",
};

export const CATEGORY_ICONS: Record<SupplyCategory, string> = {
  food: "🍚",
  water: "💧",
  medicine: "💊",
  shelter: "⛺",
  clothing: "🧥",
  hygiene: "🧼",
  tools: "🔨",
  other: "📦",
};

export const CATEGORY_LABELS_HI: Record<SupplyCategory, string> = {
  food: "खाद्यान्न (Food)",
  water: "पेयजल (Water)",
  medicine: "दवाएं व उपचार (Medicine)",
  shelter: "आश्रय व तिरपाल (Shelter)",
  clothing: "कंबल व वस्त्र (Clothing)",
  hygiene: "स्वच्छता किट (Hygiene)",
  tools: "बचाव उपकरण (Tools)",
  other: "अन्य सामग्री (Other)",
};

export const PRIORITY_LABELS: Record<number, { label: string; color: string; labelHi: string }> = {
  1: { label: "CRITICAL", color: "text-red-400", labelHi: "अति गंभीर" },
  2: { label: "HIGH", color: "text-orange-400", labelHi: "उच्च प्राथमिकता" },
  3: { label: "MEDIUM", color: "text-amber-400", labelHi: "मध्यम" },
  4: { label: "LOW", color: "text-blue-400", labelHi: "सामान्य" },
  5: { label: "MINIMAL", color: "text-slate-400", labelHi: "न्यूनतम" },
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  regional_coordinator: "Regional Coordinator",
  camp_manager: "Camp Manager",
  volunteer: "Field Volunteer",
};

export const ROLE_LABELS_HI: Record<string, string> = {
  admin: "प्रशासक (State Logistics)",
  regional_coordinator: "क्षेत्रीय समन्वयक (Division Lead)",
  camp_manager: "शिविर प्रबंधक (Camp Manager)",
  volunteer: "स्वयंसेवक (Field Volunteer)",
};

export const DEMO_BANNER = "⚠️ SYNTHETIC DEMO — Uttarakhand Relief Coordination (Fictional Operations)";

// Format numbers in Indian numbering system (e.g. 1,50,000)
export function formatNumberIN(num: number | string | undefined | null): string {
  if (num === undefined || num === null || isNaN(Number(num))) return "0";
  return Number(num).toLocaleString("en-IN");
}

// Format currency in Indian Rupees (₹)
export function formatCurrencyINR(num: number | string | undefined | null): string {
  if (num === undefined || num === null || isNaN(Number(num))) return "₹0";
  return "₹" + Number(num).toLocaleString("en-IN");
}

// Display timestamps in Asia/Kolkata (IST) time zone
export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return (
      d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }) + " IST"
    );
  } catch {
    return iso;
  }
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
