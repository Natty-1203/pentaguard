import * as React from "react"
import { cn } from "@/src/lib/utils"

export type StatusVariant =
  | "active"
  | "inactive"
  | "pending"
  | "underReview"
  | "approved"
  | "rejected"
  | "filed"
  | "paid"
  | "expired"
  | "suspended"
  | "trial"
  | "processing";

export type StatusBadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  status: StatusVariant;
  label?: string;
  pill?: boolean;
};

const statusConfig: Record<StatusVariant, { bg: string; text: string; dot: string; border: string; label: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-100/50", label: "Active" },
  inactive: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400", border: "border-gray-200/50", label: "Inactive" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200/50", label: "Pending" },
  underReview: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400", border: "border-orange-200/50", label: "Under Review" },
  approved: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", border: "border-green-200/50", label: "Approved" },
  rejected: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200/50", label: "Rejected" },
  filed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200/50", label: "Filed" },
  paid: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500", border: "border-teal-200/50", label: "Paid" },
  expired: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", border: "border-rose-200/50", label: "Expired" },
  suspended: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-600", border: "border-orange-200/50", label: "Suspended" },
  trial: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", border: "border-purple-200/50", label: "Trial" },
  processing: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-400", border: "border-indigo-200/50", label: "Processing" },
};

function StatusBadge({ className, status, label, pill = false, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  if (!config) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 border px-3 py-1 text-sm font-semibold transition-colors",
        pill ? "rounded-full" : "rounded-md",
        config.bg,
        config.text,
        config.border,
        className
      )}
      {...props}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {label || config.label}
    </div>
  )
}

export { StatusBadge }
