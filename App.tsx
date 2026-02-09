
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, ChevronDown, Globe, LogOut, Settings as SettingsIcon, Bell, HelpCircle, Wind, Store as StoreIcon, ShieldAlert, Menu, Mail, CheckCircle, XCircle, Inbox, Download, Database, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// ... (imports)
import Dashboard from './components/Dashboard';
import OrdersList from './components/OrdersList';
import SettingsPage from './components/SettingsPage';
import ProductsPage from './components/ProductsPage';
import ChatBot from './components/ChatBot';
import WalletPage from './components/WalletPage';
import CollectionsReportPage from './components/CollectionsReportPage';
import AccountSettingsPage from './components/AccountSettingsPage';
import CreateStorePage from './components/CreateStorePage';
import ManageSitesPage from './components/ManageSitesPage';
import CongratsModal from './components/CongratsModal';
import Sidebar from './components/Sidebar';
import GlobalLoader from './components/GlobalLoader';
import GlobalSaveIndicator, { SaveStatus } from './components/GlobalSaveIndicator';
import { Order, Settings as SettingsType, Wallet, User, Store, OrderItem, Product, Employee, PERMISSIONS, Invitation, PlaceOrderData, StoreData, CustomerProfile } from './types';
import { INITIAL_SETTINGS } from './constants';
import SignUpPage from './components/SignUpPage';
import OtpVerificationPage from './components/OtpVerificationPage';
import StorefrontPage from './components/StorefrontPage';
import StoreCustomizationPage from './components/StoreCustomizationPage';
import CheckoutPage from './components/CheckoutPage';
import OrderSuccessPage from './components/OrderSuccessPage';
import ShippingPage from './components/ShippingPage';
import EmployeesPage from './components/EmployeesPage';
import ComingSoonPage from './components/ComingSoonPage';
import AdminPage from './components/AdminPage';
import DiscountsPage from './components/DiscountsPage';
import AbandonedCartsPage from './components/AbandonedCartsPage';
import CustomersPage from './components/CustomersPage';
import ActivityLogsPage from './components/ActivityLogsPage';
import SuppliersPage from './components/SuppliersPage';
import AnalyticsPage from './components/AnalyticsPage';
import PagesManager from './components/PagesManager';
import ReviewsPage from './components/ReviewsPage';
import ExpensesPage from './components/ExpensesPage';
import ProductOptionsPage from './components/ProductOptionsPage';
import PaymentSettingsPage from './components/PaymentSettingsPage';
import CollectionsPage from './components/CollectionsPage';
import OrderTrackingPage from './components/OrderTrackingPage';
import MarketingPage from './components/MarketingPage';
import ConfirmationQueuePage from './components/ConfirmationQueuePage';
import WelcomeLoader from './components/WelcomeLoader';
import WhatsAppPage from './components/WhatsAppPage';

import { getStoreData, saveStoreData, getGlobalData, saveGlobalData, checkSupabaseConnection } from './services/databaseService';

interface AppData {
  users: User[];
  allStoresData: Record<string, StoreData>;
  loyaltyData: Record<string, number>;
}

// ... (ManagementHeader component remains the same)
const ManagementHeader: React.FC<{
  currentUser: User | null;
  onLogout: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  invitations: Invitation[];
  onAcceptInvitation: (storeId: string) => void;
  onDeclineInvitation: (storeId: string) => void;
  accessibleStores: Store[];
  activeStoreId: string | null;
  setActiveStoreId: (id: string) => void;
  isAdminImpersonating?: boolean;
  onStopImpersonating?: () => void;
  onToggleSidebar: () => void;
  connectionMode: 'live' | 'mock';
  installPrompt: any;
  onInstall: () => void;
  isConnected: boolean;
}> = ({ currentUser, onLogout, isDarkMode, setIsDarkMode, invitations, onAcceptInvitation, onDeclineInvitation, accessibleStores, activeStoreId, setActiveStoreId, isAdminImpersonating, onStopImpersonating, onToggleSidebar, connectionMode, installPrompt, onInstall, isConnected }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isStoreMenuOpen, setStoreMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const storeMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (storeMenuRef.current && !storeMenuRef.current.contains(event.target as Node)) {
        setStoreMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getUserInitials = (name: string) => {
    const names = name.split(' ');
    return names.length > 1 && names[names.length - 1] 
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() 
      : name.substring(0, 2).toUpperCase();
  };
  
  const activeStore = accessibleStores.find(s => s.id === activeStoreId);
  const otherStores = accessibleStores.filter(s => s.id !== activeStoreId);

  return (
    <header className={`border-b px-4 md:px-6 h-20 flex items-center justify-between sticky top-0 z-40 transition-colors ${isAdminImpersonating ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
      <div className="flex items-center gap-2 md:gap-4">
        {currentUser && activeStoreId && (
            <button onClick={onToggleSidebar} className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">
                <Menu size={24} />
            </button>
        )}

        <Link to="/" className="flex items-center gap-2">
          <Wind className="w-8 h-8 text-pink-500" />
          <span className="font-black text-2xl text-slate-800 dark:text-white hidden md:inline">wuilt</span>
        </Link>
        
        {isConnected ? (
            <div className="hidden md:flex items-center gap-1.5 text-xs font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full transition-all">
                <Wifi size={12} className="text-emerald-600" />
                <span>متصل بقاعدة البيانات</span>
            </div>
        ) : (
            <div className="hidden md:flex items-center gap-1.5 text-xs font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full transition-all" title="يتم حفظ البيانات في المتصفح مؤقتاً">
                <WifiOff size={12} className="text-amber-600" />
                <span>وضع عدم الاتصال</span>
            </div>
        )}
        
        {isAdminImpersonating && (
            <div className="bg-blue-600 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                <ShieldAlert size={12}/> <span className="hidden md:inline">وضع المدير العام</span>
            </div>
        )}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
        <div className="hidden md:flex items-center gap-6 text-sm font-bold">
          <a href="#" className="text-slate-600 dark:text-slate-300 hover:text-pink-500 transition-colors">مواقعي</a>
          <NavLink
            to="/manage-sites"
            className={({ isActive }) => 
              `transition-colors ${isActive ? 'text-pink-500' : 'text-slate-600 dark:text-slate-300 hover:text-pink-500'}`
            }
          >
            متاجري
          </NavLink>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {isAdminImpersonating ? (
             <button onClick={onStopImpersonating} className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm shadow-md hover:bg-red-700 transition-all">
                <LogOut size={14}/> <span className="hidden md:inline">إنهاء الجلسة</span>
             </button>
        ) : (
            <>
              {installPrompt && (
                <button onClick={onInstall} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm shadow-md hover:bg-indigo-700 transition-all animate-bounce">
                  <Download size={14}/> <span className="hidden md:inline">تثبيت التطبيق</span>
                </button>
              )}
              <a href="#" className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-pink-500 transition-colors">
                  <HelpCircle size={18}/> <span>مركز المساعدة</span>
              </a>
            </>
        )}
        
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
        </button>

        <div className="relative" ref={notificationsRef}>
          <button onClick={() => setIsNotificationsOpen(p => !p)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
            <Bell size={20}/>
            {invitations.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                {invitations.length}
              </span>
            )}
          </button>
          {isNotificationsOpen && (
            <div className="absolute left-0 top-14 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200 z-50 p-2">
              <div className="p-2 font-bold text-sm border-b border-slate-100 dark:border-slate-700 mb-2">الإشعارات</div>
              {invitations.length === 0 ? (
                <div className="text-center text-sm text-slate-400 p-6 flex flex-col items-center gap-2">
                    <Inbox size={32} className="opacity-50"/>
                    <p className="font-bold">لا توجد إشعارات جديدة.</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {invitations.map(inv => (
                    <div key={inv.storeId} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 rounded-full mt-1">
                                <Mail size={16} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                                    <span className="font-bold text-slate-800 dark:text-white">{inv.inviterName}</span> دعاك للانضمام إلى متجر <span className="font-bold text-slate-800 dark:text-white">{inv.storeName}</span>.
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => {onAcceptInvitation(inv.storeId); setIsNotificationsOpen(false);}} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-600 transition-all active:scale-95">
                                        <CheckCircle size={14}/> قبول
                                    </button>
                                    <button onClick={() => {onDeclineInvitation(inv.storeId); setIsNotificationsOpen(false);}} className="flex-1 flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all active:scale-95">
                                        <XCircle size={14}/> رفض
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {activeStore && (
          <div className="relative hidden md:block" ref={storeMenuRef}>
            <button onClick={() => setStoreMenuOpen(p => !p)} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 min-w-[150px] justify-between">
              <span className="truncate max-w-[120px]">{activeStore.name}</span> <ChevronDown size={16}/>
            </button>
            {isStoreMenuOpen && (
              <div className="absolute left-0 top-14 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200 p-2 z-50">
                {otherStores.map(store => (
                    <button key={store.id} onClick={() => { setActiveStoreId(store.id); setStoreMenuOpen(false); }} className="w-full text-right flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-sm">
                        <StoreIcon size={16}/> <span>{store.name}</span>
                    </button>
                ))}
                {otherStores.length > 0 && <div className="w-full h-px bg-slate-700 my-1"></div>}
                <Link to="/manage-sites" onClick={() => setStoreMenuOpen(false)} className="w-full text-right flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-sm">
                    إدارة كل المتاجر
                </Link>
              </div>
            )}
          </div>
        )}
        
        <div className="relative" ref={userMenuRef}>
          <button onClick={() => setIsUserMenuOpen(prev => !prev)} className="flex items-center gap-2">
            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full font-bold flex items-center justify-center text-sm border-2 ring-1 ring-slate-300 dark:ring-slate-600 ${isAdminImpersonating ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-white dark:border-slate-900'}`}>
              {currentUser ? getUserInitials(currentUser.fullName) : '..'}
            </div>
            <ChevronDown size={16} className="text-slate-500 hidden md:block" />
          </button>
          {isUserMenuOpen && (
            <div className="absolute left-0 top-14 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200 p-2 z-50">
              <div className="p-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center text-sm">
                  {currentUser ? getUserInitials(currentUser.fullName) : '..'}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{currentUser?.fullName}</p>
                  <p className="text-xs text-slate-500 truncate max-w-[150px]">{currentUser?.email}</p>
                </div>
              </div>
              <div className="w-full h-px bg-slate-100 dark:bg-slate-700 my-2"></div>
              <Link to="/account-settings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm">
                 <SettingsIcon size={16}/> <span>إعدادات الحساب</span>
              </Link>
              <Link to="/manage-sites" onClick={() => setIsUserMenuOpen(false)} className="flex md:hidden items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm">
                 <StoreIcon size={16}/> <span>متاجري</span>
              </Link>
              <button onClick={onLogout} className="w-full text-right flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-red-500 font-bold text-sm">
                <LogOut size={16}/> <span>خروج</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const AuthenticatedApp: React.FC<{
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  users: User[];
  setUsers: (updater: React.SetStateAction<User[]>) => void;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogout: () => void;
  orders: Order[];
  settings: SettingsType;
  wallet: Wallet;
  cart: OrderItem[];
  customers: CustomerProfile[]; // Add customers prop
  liveBalance: number;
  setOrders: (updater: React.SetStateAction<Order[]>) => void;
  setWallet: (updater: React.SetStateAction<Wallet>) => void;
  setSettings: (updater: React.SetStateAction<SettingsType>) => void;
  onAddToCart: (product: Product) => void;
  onUpdateCartQuantity: (productId: string, newQuantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onPlaceOrder: (data: PlaceOrderData) => string;
  activeStoreId: string | null;
  setActiveStoreId: React.Dispatch<React.SetStateAction<string | null>>;
  onStoreCreated: (store: Store) => void;
  showCongratsModal: boolean;
  setShowCongratsModal: React.Dispatch<React.SetStateAction<boolean>>;
  allStoresData: Record<string, StoreData>;
  setAllStoresData: (updater: React.SetStateAction<Record<string, StoreData>>) => void;
  onAcceptInvitation: (storeId: string) => void;
  onDeclineInvitation: (storeId: string) => void;
  originalAdminUser: User | null;
  onStopImpersonating: () => void;
  addLoyaltyPointsForOrder: (order: Order) => void;
  loyaltyData: Record<string, number>;
  updateCustomerLoyaltyPoints: (phone: string, points: number) => void;
  connectionMode: 'live' | 'mock';
  installPrompt: any;
  onInstall: () => void;
  saveStatus: SaveStatus;
  isConnected: boolean;
  triggerManualSave: () => Promise<{ success: boolean, error?: string } | void>;
}> = (props) => {
  const { currentUser, isDarkMode, setIsDarkMode, handleLogout, activeStoreId, setActiveStoreId, liveBalance, onStoreCreated, showCongratsModal, setShowCongratsModal, allStoresData, users, onAcceptInvitation, onDeclineInvitation, originalAdminUser, onStopImpersonating, addLoyaltyPointsForOrder, loyaltyData, updateCustomerLoyaltyPoints, connectionMode, setAllStoresData, setUsers, installPrompt, onInstall, saveStatus, isConnected, triggerManualSave } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isStorefrontPage = location.pathname.startsWith('/store') || location.pathname.startsWith('/checkout') || location.pathname.startsWith('/order-success') || location.pathname.startsWith('/track-order');
  const isAdminPage = location.pathname.startsWith('/admin');
  
  const isStoreContextual = !!activeStoreId && !['/manage-sites', '/create-store', '/account-settings'].includes(location.pathname);

  // ... (accessibleStores, currentUserInvitations, useEffect for nav logic)

  const accessibleStores = useMemo<Store[]>(() => {
    if (!currentUser) return [];
    const ownedStores = currentUser.stores || [];
    const collaboratingStores: Store[] = [];
    
    for (const owner of users) {
        if (owner.phone === currentUser.phone) continue;
        for (const store of (owner.stores || [])) {
            const storeData = allStoresData[store.id];
            if (storeData?.settings.employees.some(e => e.id === currentUser.phone && e.status === 'active')) {
                collaboratingStores.push(store);
            }
        }
    }
    const all = [...ownedStores, ...collaboratingStores];
    return all.filter((store, index, self) => index === self.findIndex(s => s.id === store.id));
  }, [currentUser, users, allStoresData]);

  const currentUserInvitations = useMemo<Invitation[]>(() => {
    if (!currentUser) return [];
    const invites: Invitation[] = [];
    for (const storeOwner of users) {
        for (const store of (storeOwner.stores || [])) {
            const storeData = allStoresData[store.id];
            if (storeData) {
                const invitedEmployee = storeData.settings.employees.find(
                    emp => emp.id === currentUser.phone && emp.status === 'invited'
                );
                if (invitedEmployee) {
                    invites.push({
                        storeId: store.id,
                        storeName: store.name,
                        inviterName: storeOwner.fullName,
                    });
                }
            }
        }
    }
    return invites;
  }, [currentUser, users, allStoresData]);

  useEffect(() => {
    if (isStorefrontPage || isAdminPage) return;
    if (currentUser?.isAdmin && !originalAdminUser) {
      if (location.pathname !== '/') navigate('/'); // FIX: Only navigate if not already there
      return;
    }
    const hasActiveStore = !!activeStoreId;
    const isOnboardingRoute = location.pathname === '/manage-sites' || location.pathname === '/create-store';
    if (!hasActiveStore && !isOnboardingRoute) {
      navigate('/manage-sites');
    }
  }, [currentUser, activeStoreId, navigate, location.pathname, isStorefrontPage, accessibleStores, isAdminPage, originalAdminUser]);
  
  const activeStore = useMemo(() => 
    accessibleStores.find(s => s.id === activeStoreId),
    [accessibleStores, activeStoreId]
  );
  
  const ownedStores = currentUser?.stores || [];
  const collaboratingStores = accessibleStores.filter(s => !ownedStores.some(os => os.id === s.id));
  
  const PageRoutes = () => (
      <Routes>
        <Route path="/manage-sites" element={<ManageSitesPage ownedStores={ownedStores} collaboratingStores={collaboratingStores} setActiveStoreId={props.setActiveStoreId} users={users} setUsers={setUsers} allStoresData={allStoresData} setAllStoresData={setAllStoresData} />} />
        <Route path="/" element={<Dashboard orders={props.orders} settings={props.settings} wallet={{ ...props.wallet, balance: props.liveBalance }} currentUser={currentUser} />} />
        <Route path="/store/*" element={<StorefrontPage settings={props.settings} setSettings={props.setSettings} activeStore={activeStore} cart={props.cart} onAddToCart={props.onAddToCart} onUpdateCartQuantity={props.onUpdateCartQuantity} onRemoveFromCart={props.onRemoveFromCart} />} />
        <Route path="/checkout" element={<CheckoutPage settings={props.settings} cart={props.cart} onPlaceOrder={props.onPlaceOrder} />} />
        <Route path="/order-success/:orderId" element={<OrderSuccessPage orders={props.orders} settings={props.settings} />} />
        <Route path="/track-order" element={<OrderTrackingPage orders={props.orders} />} />
        <Route path="/customize-store" element={<StoreCustomizationPage settings={props.settings} setSettings={props.setSettings} activeStore={activeStore} />} />
        <Route path="/confirmation-queue" element={<ConfirmationQueuePage orders={props.orders} setOrders={props.setOrders} />} />
        <Route path="/orders" element={<OrdersList orders={props.orders} setOrders={props.setOrders} settings={props.settings} setWallet={props.setWallet} addLoyaltyPointsForOrder={addLoyaltyPointsForOrder} activeStore={activeStore} />} />
        <Route path="/collections-report" element={<CollectionsReportPage orders={props.orders} settings={props.settings} />} />
        <Route path="/wallet" element={<WalletPage wallet={props.wallet} setWallet={props.setWallet} orders={props.orders} settings={props.settings} />} />
        <Route path="/products" element={<ProductsPage settings={props.settings} setSettings={props.setSettings as (s: SettingsType) => void} />} />
        <Route path="/chat" element={<ChatBot settings={props.settings} orders={props.orders} />} />
        <Route path="/whatsapp" element={<WhatsAppPage orders={props.orders} />} />
        <Route path="/settings" element={<SettingsPage settings={props.settings} setSettings={props.setSettings} onManualSave={triggerManualSave} />} />
        <Route path="/shipping" element={<ShippingPage settings={props.settings} setSettings={props.setSettings} />} />
        <Route path="/settings/employees" element={<EmployeesPage settings={props.settings} setSettings={props.setSettings} currentUser={props.currentUser} users={props.users} activeStoreId={activeStoreId} />} />
        <Route path="/account-settings" element={<AccountSettingsPage currentUser={props.currentUser} setCurrentUser={props.setCurrentUser} users={props.users} setUsers={props.setUsers} />} />
        <Route path="/create-store" element={<CreateStorePage currentUser={props.currentUser} onStoreCreated={props.onStoreCreated} />} />
        <Route path="/marketing" element={<MarketingPage settings={props.settings} />} />
        <Route path="/discounts" element={<DiscountsPage settings={props.settings} setSettings={props.setSettings} />} />
        <Route path="/abandoned-carts" element={<AbandonedCartsPage settings={props.settings} setSettings={props.setSettings} />} />
        <Route path="/customers" element={<CustomersPage orders={props.orders} loyaltyData={loyaltyData} updateCustomerLoyaltyPoints={updateCustomerLoyaltyPoints} />} />
        <Route path="/activity-logs" element={<ActivityLogsPage logs={props.settings.activityLogs || []} />} />
        <Route path="/suppliers" element={<SuppliersPage settings={props.settings} setSettings={props.setSettings} setWallet={props.setWallet} />} />
        <Route path="/reports" element={<AnalyticsPage orders={props.orders} wallet={props.wallet} settings={props.settings} />} />
        <Route path="/pages" element={<PagesManager settings={props.settings} setSettings={props.setSettings} />} />
        <Route path="/reviews" element={<ReviewsPage settings={props.settings} setSettings={props.setSettings} />} />
        <Route path="/expenses" element={<ExpensesPage wallet={props.wallet} setWallet={props.setWallet} />} />
        <Route path="/product-options" element={<ProductOptionsPage settings={props.settings} setSettings={props.setSettings} />} />
        <Route path="/settings/payment" element={<PaymentSettingsPage settings={props.settings} setSettings={props.setSettings} />} />
        <Route path="/collections" element={<CollectionsPage settings={props.settings} setSettings={props.setSettings} />} />
        <Route path="/product-attributes" element={<ComingSoonPage />} />
        <Route path="/withdrawals" element={<ComingSoonPage />} />
        <Route path="/design-templates" element={<ComingSoonPage />} />
        <Route path="/domain" element={<ComingSoonPage />} />
        <Route path="/legal-pages" element={<ComingSoonPage />} />
        <Route path="/apps" element={<ComingSoonPage />} />
        <Route path="/settings/tax" element={<ComingSoonPage />} />
        <Route path="/settings/developer" element={<ComingSoonPage />} />
      </Routes>
  );

  if (isAdminPage) {
      return <PageRoutes />; 
  }

  return (
    <div className={`${isDarkMode ? 'dark' : ''} font-cairo transition-colors duration-300 h-screen flex flex-col`} dir="rtl">
      {showCongratsModal && <CongratsModal onClose={() => setShowCongratsModal(false)} />}
      <GlobalSaveIndicator status={saveStatus} message={saveStatus === 'saving' ? 'جاري الحفظ...' : saveStatus === 'success' ? 'تم الحفظ بنجاح' : 'حدث خطأ في الحفظ'} />
      
      {isStorefrontPage ? (
        <div className="bg-white dark:bg-slate-950 min-h-screen">
          <PageRoutes />
        </div>
      ) : (
         <>
            <ManagementHeader 
              currentUser={currentUser} 
              onLogout={handleLogout} 
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              invitations={currentUserInvitations}
              onAcceptInvitation={onAcceptInvitation}
              onDeclineInvitation={onDeclineInvitation}
              accessibleStores={accessibleStores}
              activeStoreId={isStoreContextual ? activeStoreId : null}
              setActiveStoreId={setActiveStoreId}
              isAdminImpersonating={!!originalAdminUser}
              onStopImpersonating={onStopImpersonating}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              connectionMode={connectionMode}
              installPrompt={installPrompt}
              onInstall={onInstall}
              isConnected={isConnected}
            />
            <div className="flex flex-1 overflow-hidden">
                {isStoreContextual && (
                    <Sidebar 
                        activeStore={activeStore}
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                )}
                <main className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-950 relative">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 p-4 md:p-6 overflow-y-auto"
                        >
                            <PageRoutes />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
         </>
      )}
    </div>
  );
};


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isStoreDataLoading, setIsStoreDataLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userAwaitingOtp, setUserAwaitingOtp] = useState<User | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [originalAdminUser, setOriginalAdminUser] = useState<User | null>(null);
  const [connectionMode, setConnectionMode] = useState<'live' | 'mock'>('live');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isShowingWelcome, setIsShowingWelcome] = useState(false);
  const [loginPersistence, setLoginPersistence] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isConnected, setIsConnected] = useState(false);

  const [appData, setAppData] = useState<AppData>({ users: [], allStoresData: {}, loyaltyData: {} });

  const [activeStoreId, setActiveStoreId] = useState<string | null>(() => localStorage.getItem('lastActiveStoreId'));
  const { users, allStoresData, loyaltyData } = appData;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      setInstallPrompt(null);
    });
  };

  // 1. Load initial global data AND Check connection
  useEffect(() => {
    const loadInitialData = async () => {
      const connected = await checkSupabaseConnection();
      setIsConnected(connected);

      if (appData.users.length > 0) {
        setIsLoadingSession(false);
        return;
      }
      setIsLoadingSession(true);
      try {
        const data = await getGlobalData();
        const defaultUsers = [
          { fullName: 'احمد محمد', phone: '01064527923', password: '100300250', email: 'abdooads003@gmail.com', joinDate: '2024-01-01T10:00:00Z', stores: [{ id: 'store-0', name: 'الواحة', specialization: 'عام', language: 'عربي', currency: 'EGP', url: 'alwaha.wuitstore.com', creationDate: '2024-01-01T12:00:00Z' }] },
          { fullName: 'المدير العام', phone: '00000000000', password: 'admin123', email: 'admin@wuiltclone.com', isAdmin: true, joinDate: '2023-12-01T10:00:00Z' }
        ];

        setAppData(prev => ({
          ...prev,
          users: data.users && data.users.length > 0 ? data.users : defaultUsers,
          loyaltyData: data.loyaltyData || {}
        }));
        
        if (activeStoreId) {
            setIsStoreDataLoading(true);
            const storeData = await getStoreData(activeStoreId);
            if (storeData) {
                setAppData(prev => ({
                    ...prev,
                    allStoresData: { ...prev.allStoresData, [activeStoreId]: storeData }
                }));
            }
            setIsStoreDataLoading(false);
        }

      } catch (error) {
        console.error("Failed to load global data:", error);
      } finally {
        setIsLoadingSession(false);
      }
    };
    loadInitialData();
  }, []); 
  
  // 2. Authenticate user - FIXED: prevent re-auth if already authenticated
  useEffect(() => {
    if (!isLoadingSession && !isAuthenticated) {
      const loggedInUserPhone = localStorage.getItem('loggedInUserPhone') || sessionStorage.getItem('loggedInUserPhone');
      if (loggedInUserPhone) {
        const user = users.find(u => u.phone === loggedInUserPhone);
        if (user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
          setUserAwaitingOtp(null);
        } else {
          localStorage.removeItem('loggedInUserPhone');
          sessionStorage.removeItem('loggedInUserPhone');
          localStorage.removeItem('lastActiveStoreId');
        }
      }
    }
  }, [isLoadingSession, users, isAuthenticated]);
  
  // 3. Debounced saving
  useEffect(() => {
    if (isLoadingSession) return;

    const handler = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await saveGlobalData({ users: appData.users, loyaltyData: appData.loyaltyData });
        
        if (activeStoreId && appData.allStoresData[activeStoreId]) {
            // Ensure derived customers are in state before saving? 
            // In this architecture, they are already in StoreData.customers
            await saveStoreData(activeStoreId, appData.allStoresData[activeStoreId]);
        }
        setSaveStatus('success');
        const connected = await checkSupabaseConnection();
        setIsConnected(connected);
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error("Failed to save data:", error);
        setSaveStatus('error');
        setIsConnected(false);
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 2000);

    return () => clearTimeout(handler);
  }, [appData, activeStoreId, isLoadingSession]);

  const triggerManualSave = async (): Promise<{ success: boolean, error?: string } | void> => {
    if (!activeStoreId || !allStoresData[activeStoreId]) return;
    setSaveStatus('saving');
    try {
        const result = await saveStoreData(activeStoreId, allStoresData[activeStoreId]);
        if (result && result.success) {
            setSaveStatus('success');
            setIsConnected(true);
        } else {
            setSaveStatus('error');
        }
        return result;
    } catch(e) {
        console.error("Manual save failed:", e);
        setSaveStatus('error');
        return { success: false, error: 'Unknown save error' };
    } finally {
        setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };


  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) { root.classList.add('dark'); root.classList.remove('light'); }
    else { root.classList.add('light'); root.classList.remove('dark'); }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleCredentialsVerified = (user: User, rememberMe: boolean) => {
    if (user.isAdmin) {
      handleLoginSuccess(user, true);
    } else {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setUserAwaitingOtp(user);
      setLoginPersistence(rememberMe);
    }
  };

  const handleLoginSuccess = (user: User, rememberMe: boolean = true) => {
    if(user.isBanned) {
        alert("عذراً، تم تعطيل حسابك. يرجى التواصل مع إدارة المنصة.");
        return;
    }
    
    setIsShowingWelcome(true);
    setCurrentUser(user);
    setUserAwaitingOtp(null);
    setGeneratedOtp(null);
    
    if (rememberMe) {
        localStorage.setItem('loggedInUserPhone', user.phone);
    } else {
        sessionStorage.setItem('loggedInUserPhone', user.phone);
    }

    setTimeout(() => {
        setIsAuthenticated(true);
        setIsShowingWelcome(false);
    }, 2500);
  };
  
  useEffect(() => {
      if(activeStoreId) {
          localStorage.setItem('lastActiveStoreId', activeStoreId);
          // Check if data is already loaded to prevent redundant loading triggers
          if (!allStoresData[activeStoreId]) {
              setIsStoreDataLoading(true);
              getStoreData(activeStoreId).then(data => {
                  if (data) {
                      setAppData(prev => ({
                          ...prev,
                          allStoresData: { ...prev.allStoresData, [activeStoreId]: data }
                      }));
                  }
                  setIsStoreDataLoading(false);
              });
          }
      } else {
          localStorage.removeItem('lastActiveStoreId');
      }
  }, [activeStoreId]); // Only depends on activeStoreId change

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setOriginalAdminUser(null);
    setUserAwaitingOtp(null);
    setActiveStoreId(null);
    localStorage.removeItem('loggedInUserPhone'); 
    sessionStorage.removeItem('loggedInUserPhone');
    localStorage.removeItem('lastActiveStoreId');
  };
  
  const setUsers = (updater: React.SetStateAction<User[]>) => {
    setAppData(prev => ({...prev, users: typeof updater === 'function' ? updater(prev.users) : updater}));
  }

  const setAllStoresData = (updater: React.SetStateAction<Record<string, StoreData>>) => {
    setAppData(prev => ({ ...prev, allStoresData: typeof updater === 'function' ? updater(prev.allStoresData) : updater }));
  }

  const handleStoreCreated = (newStore: Store) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, stores: [...(currentUser.stores || []), newStore] };
    setUsers(prevUsers => prevUsers.map(u => u.phone === currentUser.phone ? updatedUser : u));
    setCurrentUser(updatedUser);
    const ownerEmployee: Employee = { id: currentUser.phone, name: currentUser.fullName, email: currentUser.email, permissions: Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[], status: 'active' };
    const newStoreSettings: SettingsType = { ...INITIAL_SETTINGS, employees: [ownerEmployee] };
    setAllStoresData(prev => ({ ...prev, [newStore.id]: { orders: [], settings: newStoreSettings, wallet: { balance: 0, transactions: [] }, cart: [], customers: [] } }));
    setActiveStoreId(newStore.id);
    setShowCongratsModal(true);
  };

  const handleAcceptInvitation = (storeId: string) => {
    if (!currentUser) return;
    setAllStoresData(prev => {
        const storeData = prev[storeId];
        if (!storeData) return prev;
        const updatedEmployees = storeData.settings.employees.map(emp => 
            emp.id === currentUser.phone ? { ...emp, status: 'active' as const } : emp
        );
        return { ...prev, [storeId]: { ...storeData, settings: { ...storeData.settings, employees: updatedEmployees } } };
    });
  };

  const handleDeclineInvitation = (storeId: string) => {
    if (!currentUser) return;
    setAllStoresData(prev => {
        const storeData = prev[storeId];
        if (!storeData) return prev;
        const updatedEmployees = storeData.settings.employees.filter(emp => emp.id !== currentUser.phone);
        return { ...prev, [storeId]: { ...storeData, settings: { ...storeData.settings, employees: updatedEmployees } } };
    });
  };

  const handleImpersonateUser = (targetUser: User) => {
      if (!currentUser?.isAdmin) return;
      setOriginalAdminUser(currentUser);
      setCurrentUser(targetUser);
      if (targetUser.stores && targetUser.stores.length > 0) {
          setActiveStoreId(targetUser.stores[0].id);
      } else {
          setActiveStoreId(null);
      }
  };

  const handleStopImpersonating = () => {
      if (!originalAdminUser) return;
      setCurrentUser(originalAdminUser);
      setOriginalAdminUser(null);
      setActiveStoreId(null);
  };

  const activeStoreData = activeStoreId ? allStoresData[activeStoreId] : null;

  const setOrders = (updater: React.SetStateAction<Order[]>) => {
    if (!activeStoreId) return;
    setAllStoresData(prev => {
        const currentStoreData = prev[activeStoreId] || { orders: [], settings: INITIAL_SETTINGS, wallet: { balance: 0, transactions: [] }, cart: [], customers: [] };
        const newOrders = typeof updater === 'function' ? updater(currentStoreData.orders) : updater;
        return { ...prev, [activeStoreId]: { ...currentStoreData, orders: newOrders } };
    });
  };
  const setWallet = (updater: React.SetStateAction<Wallet>) => {
    if (!activeStoreId) return;
    setAllStoresData(prev => {
        const currentStoreData = prev[activeStoreId] || { orders: [], settings: INITIAL_SETTINGS, wallet: { balance: 0, transactions: [] }, cart: [], customers: [] };
        const newWallet = typeof updater === 'function' ? updater(currentStoreData.wallet) : updater;
        return { ...prev, [activeStoreId]: { ...currentStoreData, wallet: newWallet } };
    });
  };
  const setSettings = (updater: React.SetStateAction<SettingsType>) => {
    if (!activeStoreId) return;
    setAllStoresData(prev => {
        const currentStoreData = prev[activeStoreId] || { orders: [], settings: INITIAL_SETTINGS, wallet: { balance: 0, transactions: [] }, cart: [], customers: [] };
        const newSettings = typeof updater === 'function' ? updater(currentStoreData.settings) : updater;
        return { ...prev, [activeStoreId]: { ...currentStoreData, settings: newSettings } };
    });
  };
  const setCart = (updater: React.SetStateAction<OrderItem[]>) => {
    if (!activeStoreId) return;
    setAllStoresData(prev => {
        const currentStoreData = prev[activeStoreId] || { orders: [], settings: INITIAL_SETTINGS, wallet: { balance: 0, transactions: [] }, cart: [], customers: [] };
        const newCart = typeof updater === 'function' ? updater(currentStoreData.cart) : updater;
        return { ...prev, [activeStoreId]: { ...currentStoreData, cart: newCart } };
    });
  };

  // UPDATE CUSTOMERS
  const setCustomers = (updater: React.SetStateAction<CustomerProfile[]>) => {
    if (!activeStoreId) return;
    setAllStoresData(prev => {
        const currentStoreData = prev[activeStoreId] || { orders: [], settings: INITIAL_SETTINGS, wallet: { balance: 0, transactions: [] }, cart: [], customers: [] };
        const newCustomers = typeof updater === 'function' ? updater(currentStoreData.customers) : updater;
        return { ...prev, [activeStoreId]: { ...currentStoreData, customers: newCustomers } };
    });
  };

  const addLoyaltyPointsForOrder = (order: Order) => {
    if(!activeStoreId) return;
    const cleanPhone = (order.customerPhone || '').replace(/\s/g, '').replace('+2', '');
    const orderTotalForPoints = order.productPrice + order.shippingFee - (order.discount || 0) - (order.pointsDiscount || 0);
    const pointsToAdd = Math.floor(orderTotalForPoints / 100);
    
    if (pointsToAdd > 0 && !order.loyaltyPointsAwarded) {
        // Update Loyalty in Customers Array
        setCustomers(prev => {
            const exists = prev.find(c => c.phone === cleanPhone);
            if (exists) {
                return prev.map(c => c.phone === cleanPhone ? { ...c, loyaltyPoints: c.loyaltyPoints + pointsToAdd } : c);
            } else {
                // If customer doesn't exist yet, add them (basic profile)
                const newCustomer: CustomerProfile = {
                    id: cleanPhone,
                    name: order.customerName,
                    phone: cleanPhone,
                    address: order.customerAddress,
                    loyaltyPoints: pointsToAdd,
                    totalSpent: 0, totalOrders: 0, successfulOrders: 0, returnedOrders: 0, averageOrderValue: 0,
                    firstOrderDate: new Date().toISOString(),
                    lastOrderDate: new Date().toISOString()
                };
                return [...prev, newCustomer];
            }
        });
        
        // Mark Order as Awarded
        setOrders(prevOrders => prevOrders.map(o => o.id === order.id ? {...o, loyaltyPointsAwarded: true} : o));
    }
  };

  const updateCustomerLoyaltyPoints = (phone: string, points: number) => {
    const cleanPhone = phone.replace(/\s/g, '').replace('+2', '');
    setCustomers(prev => prev.map(c => c.phone === cleanPhone ? { ...c, loyaltyPoints: points } : c));
  };

  // Recalculate Customers Derived Data (Sync Orders -> Customers Array)
  // This ensures the Customers Table is kept up to date with new orders
  useEffect(() => {
      if (!activeStoreId || !activeStoreData) return;
      
      const orders = activeStoreData.orders;
      const currentCustomers = activeStoreData.customers || [];
      
      // We want to update stats (totalSpent, etc) but keep loyalty points
      // This is a simplified sync logic. In production, this should be more optimized.
      
      const customerMap = new Map<string, CustomerProfile>();
      currentCustomers.forEach(c => customerMap.set(c.phone, c)); // Preserve existing (esp loyalty)

      let hasChanges = false;

      orders.forEach(order => {
          const cleanPhone = (order.customerPhone || '').replace(/\s/g, '').replace('+2', '');
          if (!cleanPhone) return;

          if (!customerMap.has(cleanPhone)) {
              customerMap.set(cleanPhone, {
                  id: cleanPhone, name: order.customerName, phone: cleanPhone, address: order.customerAddress,
                  loyaltyPoints: 0, totalSpent: 0, totalOrders: 0, successfulOrders: 0, returnedOrders: 0, averageOrderValue: 0,
                  firstOrderDate: order.date, lastOrderDate: order.date
              });
              hasChanges = true;
          }
          
          // Re-aggregate stats could be done here if we want perfect sync, 
          // but for now we just ensure existence.
      });
      
      if (hasChanges) {
          setCustomers(Array.from(customerMap.values()));
      }

  }, [activeStoreData?.orders.length]); // Only run when order count changes


  const handleAddToCart = (product: Product) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.productId === product.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        let itemCost = product.costPrice;
        if (product.useProfitPercentage && product.profitPercentage) {
          itemCost = product.price * (1 - (product.profitPercentage / 100));
        }
        const newItem: OrderItem = { productId: product.id, name: product.name, quantity: 1, price: product.price, cost: itemCost, weight: product.weight, thumbnail: product.thumbnail };
        return [...currentCart, newItem];
      }
    });
  };

  const handleUpdateCartQuantity = (productId: string, newQuantity: number) => {
    setCart(currentCart => {
      if (newQuantity <= 0) {
        return currentCart.filter(item => item.productId !== productId);
      }
      return currentCart.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.productId !== productId));
  };

  const handlePlaceOrder = (data: PlaceOrderData): string => {
    if (!activeStoreId || !activeStoreData) { throw new Error("No active store to place an order in."); }
    const { cart } = activeStoreData;
    if (cart.length === 0) { throw new Error("Cart is empty."); }
    const totalProductPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalProductCost = cart.reduce((sum, item) => sum + item.cost * item.quantity, 0);
    const totalWeight = cart.reduce((sum, item) => sum + item.weight * item.quantity, 0);
    const productNames = cart.map(item => item.name).join(', ');
    const newOrder: Order = { id: `store-order-${Date.now()}`, orderNumber: `WEB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, date: new Date().toISOString().split('T')[0], ...data, items: cart, status: 'في_انتظار_المكالمة', paymentStatus: 'بانتظار الدفع', preparationStatus: 'بانتظار التجهيز', productName: productNames, productPrice: totalProductPrice, productCost: totalProductCost, weight: totalWeight, discount: data.discount, includeInspectionFee: true, isInsured: true };
    setOrders(currentOrders => [newOrder, ...currentOrders]);
    setCart([]); 
    return newOrder.id;
  };

  const liveBalance = useMemo(() => {
    if (!activeStoreData) return 0;
    const balance = activeStoreData.wallet.transactions.reduce((sum, t) => t.type === 'إيداع' ? sum + t.amount : sum - t.amount, 0);
    return Math.round(balance * 100) / 100;
  }, [activeStoreData]);
  
  if (isLoadingSession) {
    return (
        <div dir="rtl" className="font-cairo bg-slate-100 dark:bg-slate-950 min-h-screen flex items-center justify-center">
            <GlobalLoader />
        </div>
    );
  }

  const authenticatedAppProps = {
    currentUser, setCurrentUser, users, setUsers, isDarkMode, setIsDarkMode, handleLogout,
    orders: activeStoreData?.orders ?? [],
    settings: activeStoreData?.settings ?? INITIAL_SETTINGS,
    wallet: activeStoreData?.wallet ?? { balance: 0, transactions: [] },
    cart: activeStoreData?.cart ?? [],
    customers: activeStoreData?.customers ?? [], // Pass customers
    liveBalance, setOrders, setWallet, setSettings, onAddToCart: handleAddToCart, onUpdateCartQuantity: handleUpdateCartQuantity,
    onRemoveFromCart: handleRemoveFromCart, onPlaceOrder: handlePlaceOrder, activeStoreId, setActiveStoreId, onStoreCreated: handleStoreCreated,
    showCongratsModal, setShowCongratsModal, allStoresData, setAllStoresData, onAcceptInvitation: handleAcceptInvitation,
    onDeclineInvitation: handleDeclineInvitation, originalAdminUser, onStopImpersonating: handleStopImpersonating, addLoyaltyPointsForOrder,
    loyaltyData: {}, // Legacy - passed empty or mapped
    updateCustomerLoyaltyPoints,
    connectionMode,
    installPrompt,
    onInstall: handleInstallClick,
    saveStatus,
    isConnected,
    triggerManualSave
  };
  
  const adminPageProps = { users, setUsers, allStoresData, onImpersonate: handleImpersonateUser, currentUser: currentUser as User, setAllStoresData };

  return (
      <>
        {(isStoreDataLoading || isLoadingSession) && <GlobalLoader />}
        {isShowingWelcome && currentUser ? (
            <WelcomeLoader userName={currentUser.fullName.split(' ')[0]} />
        ) : !isAuthenticated ? (
            userAwaitingOtp && generatedOtp ? (
            <OtpVerificationPage
                user={userAwaitingOtp}
                correctOtp={generatedOtp}
                onVerifySuccess={(user) => handleLoginSuccess(user, loginPersistence)}
                onCancel={() => {
                setUserAwaitingOtp(null);
                setGeneratedOtp(null);
                }}
            />
            ) : (
            <SignUpPage onAuthSuccess={handleCredentialsVerified} users={users} setUsers={setUsers} />
            )
        ) : (
            <Routes>
                { (currentUser?.isAdmin && !originalAdminUser) ? (
                    <>
                        <Route path="/" element={<AdminPage {...adminPageProps} />} />
                        <Route path="/admin/*" element={<AdminPage {...adminPageProps} />} />
                        <Route path="/*" element={<AuthenticatedApp {...authenticatedAppProps} />} />
                    </>
                ) : (
                    <>
                        <Route path="/admin/*" element={<AuthenticatedApp {...authenticatedAppProps} />} />
                        <Route path="/*" element={<AuthenticatedApp {...authenticatedAppProps} />} />
                    </>
                ) }
            </Routes>
        )}
    </>
  );
};

const RootApp: React.FC = () => (
    <HashRouter>
        <App />
    </HashRouter>
)

export default RootApp;
