import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary:
    "bg-cissp-teal text-cissp-dark hover:bg-[#7AD3E1] shadow-[0_0_0_1px_rgba(95,195,212,0.4),0_8px_24px_-8px_rgba(95,195,212,0.5)]",
  secondary:
    "bg-cissp-card border border-cissp-border text-cissp-text-secondary hover:bg-cissp-card-hover hover:border-cissp-border-hover hover:text-cissp-text",
  ghost: "text-cissp-text-secondary hover:text-cissp-text hover:bg-white/5",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-[15px]",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`bg-cissp-card border border-cissp-border rounded-2xl backdrop-blur-sm ${className}`}
      {...props}
    />
  );
}

export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`text-[11px] uppercase tracking-[0.16em] text-cissp-text-dim font-semibold ${className}`}
    >
      {children}
    </div>
  );
}

export function PageContainer({
  children,
  width = "max-w-3xl",
}: {
  children: ReactNode;
  width?: string;
}) {
  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className={`mx-auto ${width} animate-fade-up`}>{children}</div>
    </main>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-cissp-text-secondary mt-1.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" role="status">
      <div className="h-8 w-8 rounded-full border-2 border-cissp-border border-t-cissp-teal animate-spin" />
      <div className="text-sm text-cissp-text-muted">{label}</div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center text-center px-6 py-14">
      <div className="h-12 w-12 rounded-xl bg-cissp-teal/10 border border-cissp-teal/20 text-cissp-teal flex items-center justify-center mb-4">
        {icon}
      </div>
      <div className="text-white font-semibold text-lg">{title}</div>
      {description && (
        <p className="text-cissp-text-muted text-sm mt-1.5 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}

/* Icons (stroke-based, 24x24 viewBox) */

function Icon({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Icons = {
  Shield: (p: { size?: number }) => (
    <Icon {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  ),
  Clock: (p: { size?: number }) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Icon>
  ),
  ArrowLeft: (p: { size?: number }) => (
    <Icon {...p}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </Icon>
  ),
  ArrowRight: (p: { size?: number }) => (
    <Icon {...p}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </Icon>
  ),
  Bookmark: (p: { size?: number }) => (
    <Icon {...p}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </Icon>
  ),
  Refresh: (p: { size?: number }) => (
    <Icon {...p}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
    </Icon>
  ),
  Upload: (p: { size?: number }) => (
    <Icon {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </Icon>
  ),
  History: (p: { size?: number }) => (
    <Icon {...p}>
      <path d="M3 3v18h18" />
      <path d="m7 15 4-4 3 3 5-6" />
    </Icon>
  ),
  Check: (p: { size?: number }) => (
    <Icon {...p}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  ),
  X: (p: { size?: number }) => (
    <Icon {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Icon>
  ),
  Lightbulb: (p: { size?: number }) => (
    <Icon {...p}>
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />
    </Icon>
  ),
  Grid: (p: { size?: number }) => (
    <Icon {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Icon>
  ),
  Menu: (p: { size?: number }) => (
    <Icon {...p}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Icon>
  ),
  Logout: (p: { size?: number }) => (
    <Icon {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </Icon>
  ),
  File: (p: { size?: number }) => (
    <Icon {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </Icon>
  ),
};
