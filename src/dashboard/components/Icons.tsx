
import React from 'react';

type IconProps = { className?: string };

// Nota: Reemplaza estas URLs con tus propias imágenes alojadas en Firebase o cualquier otro servicio.
const ICON_URLS = {
    calculator: 'https://i.ibb.co/6D3C7p0/calculator.png',
    taxPercent: 'https://i.ibb.co/mH0j6Yt/tax-percent.png',
    scale: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/impuesto.png?alt=media&token=49a1780a-4689-4764-9396-9a37bc2dc879',
    documentChartBar: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/reporte.png?alt=media&token=b4107f20-a3b8-46bc-acfa-e59a8a90f594',
    arrowUpTray: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/subir.png?alt=media&token=29d56651-6aa2-4ed2-b4eb-6415094a87c2',
    document: 'https://i.ibb.co/N1Zg9b7/document.png',
    shoppingCart: 'https://i.ibb.co/WcWzXFw/shopping-cart.png',
    banknotes: 'https://i.ibb.co/F8zB2B8/banknotes.png',
    shieldCheck: 'https://i.ibb.co/gJBhmzP/shield-check.png',
    userGroup: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/silueta-de-multiples-usuarios.png?alt=media&token=a0ce23ed-fa75-4fcc-8553-99d1e7d60440',
    checkCircle: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/lista-de-verificacion.png?alt=media&token=a0e57e33-61ca-4b8a-8b26-d2eda5aa7ec5',
    exclamationCircle: 'https://i.ibb.co/M6Y5v1G/exclamation-circle.png',
    clock: 'https://i.ibb.co/MfZgC7c/clock.png',
    chevronDown: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/flecha-hacia-abajo-para-navegar.png?alt=media&token=0b510044-fe96-4272-ac6f-1678a07b3b3f',
    documentMagnifyingGlass: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/correccion-de-pruebas.png?alt=media&token=cc589d9e-b75c-402d-be84-318d24a8eeb7',
    arrowsRightLeft: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/benchmarking.png?alt=media&token=f0943887-1331-4dc3-9327-1f8e355dee4e',
    users: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/silueta-de-multiples-usuarios.png?alt=media&token=a0ce23ed-fa75-4fcc-8553-99d1e7d60440',
    check: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/lista-de-verificacion.png?alt=media&token=a0e57e33-61ca-4b8a-8b26-d2eda5aa7ec5',
    databaseSearch: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/lupa.png?alt=media&token=73b952c9-eeb6-433d-8dee-13162bfd7ce0',
    pin: 'https://i.ibb.co/dK5Z5Y7/pin.png',
    logout: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/cerrar-sesion.png?alt=media&token=88249ee1-9498-4778-8d1b-494b78ea250b',
    paperClip: 'https://i.ibb.co/sW2vC2z/paper-clip.png',
    photo: 'https://i.ibb.co/ZJpPqfB/photo.png',
    review: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/correccion-de-pruebas.png?alt=media&token=cc589d9e-b75c-402d-be84-318d24a8eeb7',
    propertyTax: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/impuesto-sobre-la-propiedad.png?alt=media&token=e505a63f-417f-466c-9e5b-98c57021b1ae',
    clients: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/silueta-de-multiples-usuarios.png?alt=media&token=a0ce23ed-fa75-4fcc-8553-99d1e7d60440',
    copy: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/copiar-el-simbolo-de-interfaz-de-dos-hojas-de-papel.png?alt=media&token=e99ddc84-f5c6-4825-b5eb-c219e9d82163',
    drive: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/google-drive.png?alt=media&token=1a735893-6288-48a9-9478-66dc919e49ca',
    coherence: 'https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/coherencia.png?alt=media&token=e2dfd552-4459-4be8-8ea1-77483190ac79',
};

export const EyeIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

export const EyeSlashIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const ConfigIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 016 0z" />
    </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

export const TrendingUpIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
    </svg>
);

export const BoltIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
);

export const TagIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
);

export const CircleStackIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
);

export const ArchiveBoxIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.03 1.121 0 1.131.094 1.976 1.057 1.976 2.192V7.5m-9.75 0h14.25M5.625 7.5h12.75a2.25 2.25 0 0 1 2.25 2.25v6.75a2.25 2.25 0 0 1-2.25-2.25H5.625a2.25 2.25 0 0 1-2.25-2.25v-6.75a2.25 2.25 0 0 1 2.25 2.25Z" />
    </svg>
);

export const HistoryIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


export const CoherenceIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.coherence} alt="Coherence Icon" className={className} />
);

export const DriveIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <img src={ICON_URLS.drive} alt="Google Drive Icon" className={className} />
);

export const CalendarIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export const TasksIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

export const CalculatorIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.calculator} alt="Calculator Icon" className={className} />
);

export const TaxPercentIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.taxPercent} alt="Tax Percent Icon" className={className} />
);

export const ScaleIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.scale} alt="Scale Icon" className={className} />
);

export const DocumentChartBarIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.documentChartBar} alt="Document Chart Bar Icon" className={className} />
);

export const ArrowUpTrayIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <img src={ICON_URLS.arrowUpTray} alt="Upload Icon" className={className} />
);

export const DocumentIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.document} alt="Document Icon" className={className} />
);

export const ShoppingCartIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.shoppingCart} alt="Shopping Cart Icon" className={className} />
);

export const BanknotesIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.banknotes} alt="Banknotes Icon" className={className} />
);

export const ShieldCheckIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.shieldCheck} alt="Shield Check Icon" className={className} />
);

export const UserGroupIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.userGroup} alt="User Group Icon" className={className} />
);

export const CheckCircleIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <img src={ICON_URLS.checkCircle} alt="Check Circle Icon" className={className} />
);

export const CheckBadgeIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm4.45 6.45a.75.75 0 10-1.1 1.1l1.69 1.69a.75.75 0 001.1 0l4.25-4.25a.75.75 0 01.1-1.1L14.134 11.41l-1.082-1.16z" clipRule="evenodd" />
    </svg>
);

export const ExclamationCircleIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <img src={ICON_URLS.exclamationCircle} alt="Exclamation Circle Icon" className={className} />
);

export const ClockIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <img src={ICON_URLS.clock} alt="Clock Icon" className={className} />
);

export const ChevronDownIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);
export const ChevronUpIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
    </svg>
);


export const DocumentMagnifyingGlassIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <img src={ICON_URLS.documentMagnifyingGlass} alt="Document Search Icon" className={className} />
);

export const ArrowsRightLeftIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <img src={ICON_URLS.arrowsRightLeft} alt="Arrows Right Left Icon" className={className} />
);

export const UsersIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <img src={ICON_URLS.users} alt="Users Icon" className={className} />
);

export const XMarkIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

export const DatabaseSearchIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.databaseSearch} alt="Database Search Icon" className={className} />
);

export const PinIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.pin} alt="Pin Icon" className={className} />
);

export const LogoutIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.logout} alt="Logout Icon" className={className} />
);

export const PaperClipIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.paperClip} alt="PaperClip Icon" className={className} />
);

export const PhotoIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.photo} alt="Photo Icon" className={className} />
);

export const ReviewIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.review} alt="Review Icon" className={className} />
);

export const PropertyTaxIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.propertyTax} alt="Property Tax Icon" className={className} />
);

export const RevisionesIcon: React.FC<IconProps> = ({ className }) => (
    <img src="https://firebasestorage.googleapis.com/v0/b/revision-contable.firebasestorage.app/o/calculadora.png?alt=media&token=4a84cee9-fbb5-4cef-b760-2d66d09ca973" alt="Revisiones Icon" className={className} />
);

export const ClientsIcon: React.FC<IconProps> = ({ className }) => (
    <img src={ICON_URLS.clients} alt="Clients Icon" className={className} />
);

export const CopyIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
    <img src={ICON_URLS.copy} alt="Copy Icon" className={className} />
);

export const PlusIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const DeleteIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.077-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

export const EditIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 19.07a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
    </svg>
);

export const ListBulletIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 17.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
);

export const LockClosedIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25 2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
);

export const TableCellsIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 18.375V5.625ZM21 9.375A.375.375 0 0 0 20.625 9h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375-.375v-1.5Zm0 3.75a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375.375v-1.5Zm0 3.75a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375.375v-1.5Zm10.875 18.75a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375.375v-1.5Zm0 3.75h7.5a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375.375v-1.5Zm-9-3.75h7.5a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375.375v-1.5Z" clipRule="evenodd" />
    </svg>
);

export const ChartPieIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
    </svg>
);
