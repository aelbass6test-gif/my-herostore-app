import React, { useState, useEffect } from 'react';
// FIX: Updating react-router-dom import to be compatible with v5.
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, ShoppingCart, Eye, PhoneForwarded,
    Archive, Package, ClipboardList, ListOrdered, Star, Grid3x3, Users, Truck, Percent, 
    Wallet as WalletIcon, ArrowRightLeft, LayoutGrid, Brush, FileText, Globe, BarChart2, Shield, 
    AppWindow, Settings2, CreditCard, Landmark, Users2, Code, Receipt, ChevronRight, X, UserCog, History, Megaphone, MessageSquare 
} from 'lucide-react';
import { Store as StoreType } from '../types';

interface SidebarProps {
  activeStore: StoreType | undefined;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeStore, isOpen, onClose }) => {
    const location = useLocation();
    
    // Close sidebar when route changes (on mobile)
    useEffect(() => {
        if (onClose) onClose();
    }, [location.pathname]);

    const navItems = [
        { type: 'link', to: '/', label: 'الرئيسية', icon: <LayoutDashboard size={20} /> },
        { type: 'link', to: '/confirmation-queue', label: 'تأكيد الطلبات', icon: <PhoneForwarded size={20} /> },
        { type: 'link', to: '/orders', label: 'الطلبات', icon: <ShoppingCart size={20} /> },
        { type: 'link', to: '/abandoned-carts', label: 'السلّات المتروكة', icon: <Archive size={20} /> },
        {
            type: 'group',
            title: 'المنتجات والمخزون',
            links: [
                { to: '/products', label: 'المنتجات', icon: <Package size={20} /> },
                { to: '/suppliers', label: 'الموردين والمخزون', icon: <UserCog size={20} /> }, // New
                { to: '/product-options', label: 'خيارات المنتجات', icon: <ClipboardList size={20} /> },
                { to: '/product-attributes', label: 'خصائص المنتجات', icon: <ListOrdered size={20} /> },
                { to: '/reviews', label: 'تقييمات وآراء العملاء', icon: <Star size={20} /> },
                { to: '/collections', label: 'المجموعات', icon: <Grid3x3 size={20} /> },
            ]
        },
        { type: 'link', to: '/customers', label: 'العملاء', icon: <Users size={20} /> },
        {
            type: 'group',
            title: 'التسويق والنمو',
            links: [
                { to: '/marketing', label: 'مساعد التسويق الذكي', icon: <Megaphone size={20} /> },
                { to: '/discounts', label: 'كوبونات الخصم', icon: <Percent size={20} /> },
            ]
        },
         {
            type: 'group',
            title: 'التواصل',
            links: [
                { to: '/whatsapp', label: 'واتساب', icon: <MessageSquare size={20} /> },
            ]
        },
        { type: 'link', to: '/shipping', label: 'الشحن', icon: <Truck size={20} /> },
        {
            type: 'group',
            title: 'المحفظة',
            links: [
                { to: '/wallet', label: 'المحفظة', icon: <WalletIcon size={20} /> },
                { to: '/collections-report', label: 'التحصيلات', icon: <Receipt size={20} /> },
                { to: '/withdrawals', label: 'عمليات السحب', icon: <ArrowRightLeft size={20} /> },
            ]
        },
        {
            type: 'group',
            title: 'إدارة المتجر',
            links: [
                { to: '/design-templates', label: 'قوالب التصميم', icon: <LayoutGrid size={20} /> },
                { to: '/customize-store', label: 'المظهر', icon: <Brush size={20} /> },
                { to: '/pages', label: 'الصفحات', icon: <FileText size={20} /> }, // New Page Implementation
                { to: '/domain', label: 'النطاق', icon: <Globe size={20} /> },
            ]
        },
        { type: 'link', to: '/reports', label: 'التحليلات الذكية', icon: <BarChart2 size={20} /> },
        { type: 'link', to: '/activity-logs', label: 'سجل النشاط', icon: <History size={20} /> }, // New
        { type: 'link', to: '/legal-pages', label: 'الصفحات القانونية', icon: <Shield size={20} /> },
        { type: 'link', to: '/apps', label: 'التطبيقات', icon: <AppWindow size={20} /> },
        {
            type: 'group',
            title: 'الإعدادات',
            links: [
                { to: '/settings', label: 'عام', icon: <Settings2 size={20} /> },
                { to: '/settings/payment', label: 'الدفع', icon: <CreditCard size={20} /> },
                { to: '/settings/tax', label: 'الضريبة', icon: <Landmark size={20} /> },
                { to: '/settings/employees', label: 'الموظفون وربط المتجر', icon: <Users2 size={20} /> },
                { to: '/settings/developer', label: 'أدوات المُطورين', icon: <Code size={20} /> },
            ]
        }
    ];

    const SidebarContent = () => (
        <div className="h-full flex flex-col p-4">
            <div className="py-4 px-2 mb-4 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                        <span>متاجري</span>
                        <ChevronRight size={12}/>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white truncate max-w-[180px]" title={activeStore?.name}>
                        {activeStore?.name || '...'}
                    </h2>
                </div>
                {onClose && <button onClick={onClose} className="md:hidden text-slate-400"><X size={24}/></button>}
            </div>
            
            <Link to="/store" className="flex items-center justify-center gap-2 w-full mb-6 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-teal-600 dark:text-teal-400 rounded-lg font-bold hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:border-teal-200 dark:hover:border-teal-700 transition-all">
                <Eye size={16}/>
                <span>معاينة المتجر</span>
            </Link>

            <nav className="flex-1 space-y-1 overflow-y-auto pb-20 no-scrollbar">
                {navItems.map((item, index) => {
                    if (item.type === 'link') {
                        return (
                             <NavLink 
                                to={item.to} 
                                key={item.to + index} 
                                end={item.to === '/'} 
                                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-bold ${isActive ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    }
                    if (item.type === 'group') {
                        return (
                            <div key={item.title}>
                                <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider mt-4 mb-1">
                                    {item.title}
                                </div>
                                {item.links.map(link => (
                                    <NavLink 
                                        to={link.to} 
                                        key={link.to} 
                                        end={link.to === '/'}
                                        className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-bold ${isActive ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                                    >
                                        {link.icon}
                                        <span>{link.label}</span>
                                    </NavLink>
                                ))}
                            </div>
                        );
                    }
                    return null;
                })}
            </nav>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex-col sticky top-20">
                <SidebarContent />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
                    <div className="relative w-64 bg-white dark:bg-slate-900 h-full shadow-2xl animate-in slide-in-from-right duration-300">
                        <SidebarContent />
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;
