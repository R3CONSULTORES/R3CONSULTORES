import React from 'react';

// Common props
type IconProps = { className?: string };

// --- CUSTOM R3 PREMIUM ICONS ---
// We use carefully crafted paths to give a high-end feel. 
// These icons avoid generic stock looks and stay within the brand's premium identity.

export const HomeIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ClientsIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 11V14M14 17H20" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 21v-2a4 4 0 00-3-3.85" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TasksIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 2v4M8 2v4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const HistoryIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.05 11a9 9 0 11.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 11V6h5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TrendingUpIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M23 6l-9.5 9.5-5-5L1 18" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 6h6v6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const RevisionesIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M20 7h-9M14 11H4M17 15h-6" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3" y="4" width="18" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BriefcaseIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DocumentSearchIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="11.5" cy="15.5" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 19l-2.1-2.1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BoltIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckBadgeIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 11h2v2H7zM11 11h2v2h-2zM15 11h2v2h-2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const EyeSlashIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 12a3 3 0 01-3-3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ExclamationCircleIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 8v4M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DriveIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M7 10h10l-5-7L7 10z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 3v18M7 10l-5 8h20l-5-8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArchiveBoxIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <rect x="3" y="11" width="18" height="10" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 7H3a2 2 0 01-2-2V3a2 2 0 012-2h18a2 2 0 012 2v2a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v2h4v-2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M19 14l-7 7-7-7M12 3v18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Fallbacks to maintain compatibility during migration
export const ConfigIcon = HomeIcon;
export const CalculatorIcon = TrendingUpIcon;
export const TaxPercentIcon = RevisionesIcon;
export const ScaleIcon = RevisionesIcon;
export const DocumentChartBarIcon = RevisionesIcon;
export const ArrowUpTrayIcon = PlusIcon;
export const DocumentIcon = RevisionesIcon;
export const ShoppingCartIcon = RevisionesIcon;
export const BanknotesIcon = RevisionesIcon;
export const ShieldCheckIcon = RevisionesIcon;
export const UserGroupIcon = ClientsIcon;
export const CheckCircleIcon = TasksIcon;
export const DatabaseSearchIcon = DocumentSearchIcon;
export const PinIcon = HomeIcon;
export const PaperClipIcon = PlusIcon;
export const PhotoIcon = PlusIcon;
export const ReviewIcon = DocumentSearchIcon;
export const PropertyTaxIcon = RevisionesIcon;
export const CopyIcon = PlusIcon;
export const DeleteIcon = PlusIcon;
export const SearchIcon = DocumentSearchIcon;
export const EditIcon = PlusIcon;
export const ListBulletIcon = RevisionesIcon;
export const LockClosedIcon = PlusIcon;
export const TableCellsIcon = RevisionesIcon;
export const ChartPieIcon = TrendingUpIcon;
export const ChevronDownIcon = ArrowRightIcon;
export const ChevronUpIcon = ArrowRightIcon;
export const DocumentMagnifyingGlassIcon = DocumentSearchIcon;
export const ArrowsRightLeftIcon = ArrowRightIcon;
export const UsersIcon = ClientsIcon;
export const XMarkIcon = PlusIcon;
export const CheckIcon = TasksIcon;
