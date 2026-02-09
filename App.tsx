
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { User, Store, StoreData, Order, Settings, Wallet, OrderItem, Employee, Product, PlaceOrderData } from './types';
import * as db from './services/databaseService';
import { INITIAL_SETTINGS } from './constants';

// Page Components
import SignUpPage from './components/SignUpPage';
import EmployeeLoginPage from './components/EmployeeLoginPage';
import CreateStorePage from './components/CreateStorePage';
import ManageSitesPage from './components/ManageSitesPage';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import OrdersList from './components/OrdersList';
import ProductsPage from './components/ProductsPage';
import CustomersPage from './components/CustomersPage';
import WalletPage from './components/WalletPage';
import SettingsPage from './components/SettingsPage';
import StorefrontPage from './components/StorefrontPage';
import CheckoutPage from './components/CheckoutPage';
import OrderSuccessPage from './components/OrderSuccessPage';
import StoreCustomizationPage from './components/StoreCustomizationPage';
import ShippingPage from './components/ShippingPage';
import ConfirmationQueuePage from './components/ConfirmationQueuePage';
import AbandonedCartsPage from './components/AbandonedCartsPage';
import DiscountsPage from './components/DiscountsPage';
import ReviewsPage from './components/ReviewsPage';
import CollectionsPage from './components/CollectionsPage';
import ProductOptionsPage from './components/ProductOptionsPage';
import ExpensesPage from './components/ExpensesPage';
import MarketingPage from './components/MarketingPage';
import AnalyticsPage from './components/AnalyticsPage';
import AdminPage from './components/AdminPage';
import EmployeeLayout from './components/EmployeeLayout';
import EmployeeDashboardPage from './components/EmployeeDashboardPage';
import EmployeeAccountSettingsPage from './components/EmployeeAccountSettingsPage';
import AccountSettingsPage from './components/AccountSettingsPage';
import CollectionsReportPage from './components/CollectionsReportPage';
import ActivityLogsPage from './components/ActivityLogsPage';
import SuppliersPage from './components/SuppliersPage';
import PagesManager from './components/PagesManager';
import PaymentSettingsPage from './components/PaymentSettingsPage';
import TeamChatPage from './components/TeamChatPage';
import WhatsAppPage from './components/WhatsAppPage';
import ComingSoonPage from './components/ComingSoonPage';
import WelcomeLoader from './components/WelcomeLoader';
import GlobalLoader from './components/GlobalLoader';
import EmployeesPage from './components/EmployeesPage';
import ReportsPage from './components/ReportsPage';
import ChatBot from './components/ChatBot';
import CongratsModal from './components/CongratsModal';
import OrderTrackingPage from './components/OrderTrackingPage';


const App: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [allStoresData, setAllStoresData] = useState<Record<string, StoreData>>({});
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [loyaltyData, setLoyaltyData] = useState<Record<string, number>>({});
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isEmployeeSession, setIsEmployeeSession] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
    const [showCongratsModal, setShowCongratsModal] = useState(false);

    const handleSidebarClose = useCallback(() => {
        setIsSidebarOpen(false);
    }, []);

    useEffect(() => {
        const applyTheme = () => {
            const themeToApply = theme === 'system' 
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : theme;

            if (themeToApply === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        applyTheme();
        localStorage.setItem('theme', theme);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => applyTheme();
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // --- DATA RESET LOGIC ---
                console.log("--- PERFORMING ONE-TIME DATA RESET ---");

                // 1. Define the admin user
                const adminUser = {
                    email: "admin@wuiltclone.com",
                    phone: "00000000000",
                    isAdmin: true,
                    fullName: "المدير العام",
                    joinDate: "2023-12-01T10:00:00Z",
                    password: "admin123"
                };

                // 2. Overwrite global data in the database
                await db.saveGlobalData({ users: [adminUser], loyaltyData: {} });
                console.log("Global data reset to admin-only.");

                // 3. Delete all store-related data from all tables
                await db.deleteAllStoresAndData();
                console.log("All store data has been wiped.");
                
                // 4. Clear local session
                localStorage.removeItem('currentUserPhone');
                localStorage.removeItem('lastActiveStoreId');
                localStorage.removeItem('sessionType');
                console.log("Local session cleared.");

                // 5. Reset local state
                setUsers([adminUser]);
                setLoyaltyData({});
                setAllStoresData({});
                setCurrentUser(null);
                setActiveStoreId(null);
                
                console.log("--- DATA RESET COMPLETE ---");
                
            } catch (error) {
                console.error("Failed to reset initial data:", error);
            } finally {
                setIsLoading(false);
                setAuthChecked(true);
                setIsInitialLoad(false);
            }
        };
        loadData();
    }, []);
    
    // Save global data whenever it changes
    useEffect(() => {
        if (!isInitialLoad) {
            db.saveGlobalData({ users, loyaltyData });
        }
    }, [users, loyaltyData, isInitialLoad]);

    // Save active store data
    useEffect(() => {
        if (!isInitialLoad && activeStoreId && allStoresData[activeStoreId]) {
            const activeStore = users.flatMap(u => u.stores || []).find(s => s.id === activeStoreId);
            if(activeStore) {
                 db.saveStoreData(activeStore, allStoresData[activeStoreId]);
            }
        }
    }, [allStoresData, activeStoreId, isInitialLoad, users]);

    const allOrders = useMemo(() => Object.values(allStoresData).flatMap(store => store.orders), [allStoresData]);
    const activeStore = useMemo(() => users.flatMap(u => u.stores || []).find(s => s.id === activeStoreId), [users, activeStoreId]);
    const activeStoreData = useMemo(() => activeStoreId ? allStoresData[activeStoreId] : null, [activeStoreId, allStoresData]);
    const employeeAppLayoutStoreOwner = useMemo(() => users.find(u => u.stores?.some(s => s.id === activeStoreId)), [users, activeStoreId]);


    const handleAuthSuccess = (user: User, rememberMe: boolean) => {
        setCurrentUser(user);
        setIsEmployeeSession(false);
        if (rememberMe) {
            localStorage.setItem('currentUserPhone', user.phone);
            localStorage.setItem('sessionType', 'owner');
        } else {
             localStorage.removeItem('sessionType');
        }

        const lastStoreId = localStorage.getItem('lastActiveStoreId');
        const firstStoreId = user.stores?.[0]?.id;
        
        if (lastStoreId && user.stores?.some(s => s.id === lastStoreId)) {
            handleSetActiveStore(lastStoreId);
        } else if (firstStoreId) {
            handleSetActiveStore(firstStoreId);
        }
    };

    const handleEmployeeLoginAttempt = async (data: { storeId: string; phone: string; password: string }) => {
        const { storeId, phone, password } = data;
        const storeOwner = users.find(u => u.stores?.some(s => s.id === storeId));
        if (!storeOwner) throw new Error('كود المتجر غير صحيح.');

        const employeeUser = users.find(u => u.phone === phone);
        if (!employeeUser) throw new Error('رقم الهاتف غير مسجل في المنصة.');
        if (employeeUser.password !== password) throw new Error('كلمة المرور غير صحيحة.');

        let storeData = allStoresData[storeId];
        if (!storeData) {
            storeData = await db.getStoreData(storeId);
            if (storeData) setAllStoresData(prev => ({ ...prev, [storeId]: storeData }));
            else throw new Error('لا يمكن تحميل بيانات المتجر.');
        }

        const employeeRecord = storeData.settings.employees.find(e => e.id === phone);
        if (!employeeRecord) throw new Error('أنت لست موظفاً في هذا المتجر.');
        if (employeeRecord.status !== 'active') throw new Error(`حالة حسابك هي "${employeeRecord.status}". يرجى التواصل مع مالك المتجر.`);

        setCurrentUser(employeeUser);
        setActiveStoreId(storeId);
        setIsEmployeeSession(true);
        localStorage.setItem('currentUserPhone', employeeUser.phone);
        localStorage.setItem('lastActiveStoreId', storeId);
        localStorage.setItem('sessionType', 'employee');
    };
    
    const handleEmployeeRegisterRequest = async (data: { fullName: string; phone: string; password: string; storeId: string; email: string; }) => {
        const { fullName, phone, password, storeId, email } = data;
        const storeOwner = users.find(u => u.stores?.some(s => s.id === storeId));
        if (!storeOwner) throw new Error('كود المتجر غير صحيح.');

        if (users.some(u => u.phone === phone)) throw new Error('رقم الهاتف هذا مسجل بالفعل في المنصة.');
        if (users.some(u => u.email === email)) throw new Error('هذا البريد الإلكتروني مسجل بالفعل.');

        const newUser: User = { fullName, phone, password, email, joinDate: new Date().toISOString() };
        setUsers(prev => [...prev, newUser]);
        
        let storeData = allStoresData[storeId];
        if (!storeData) {
            storeData = await db.getStoreData(storeId);
            if (!storeData) throw new Error('لا يمكن تحميل بيانات المتجر لتقديم طلبك.');
        }

        const newEmployee: Employee = { id: phone, name: fullName, email, permissions: [], status: 'pending' };
        const updatedStoreData = { ...storeData, settings: { ...storeData.settings, employees: [...(storeData.settings.employees || []), newEmployee] }};
        setAllStoresData(prev => ({ ...prev, [storeId]: updatedStoreData }));
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setActiveStoreId(null);
        setIsEmployeeSession(false);
        localStorage.removeItem('currentUserPhone');
        localStorage.removeItem('lastActiveStoreId');
        localStorage.removeItem('sessionType');
    };
    
    const handleStoreCreated = (store: Store) => {
        if (!currentUser) return;
        const updatedUser = {
            ...currentUser,
            stores: [...(currentUser.stores || []), store]
        };
        setCurrentUser(updatedUser);
        setUsers(users.map(u => u.phone === currentUser.phone ? updatedUser : u));
        
        const newStoreData: StoreData = {
            settings: INITIAL_SETTINGS,
            orders: [],
            wallet: { balance: 0, transactions: [] },
            cart: [],
            customers: [],
        };
        setAllStoresData(prev => ({...prev, [store.id]: newStoreData}));
        handleSetActiveStore(store.id);
        setShowCongratsModal(true);
    };

    const handleSetActiveStore = async (storeId: string) => {
        setIsLoading(true);
        setActiveStoreId(storeId);
        localStorage.setItem('lastActiveStoreId', storeId);
        setCart([]); // Reset cart on store switch
        if (!allStoresData[storeId]) {
            const storeData = await db.getStoreData(storeId);
            if (storeData) {
                setAllStoresData(prev => ({ ...prev, [storeId]: storeData }));
            }
        }
        setIsLoading(false);
    };

    const addLoyaltyPointsForOrder = (order: Order) => {
        const cleanPhone = (order.customerPhone || '').replace(/\s/g, '').replace('+2', '');
        if (!cleanPhone || order.loyaltyPointsAwarded) return;
        const pointsToAdd = Math.floor(((order.productPrice + order.shippingFee) - (order.discount || 0)) / 10);
        if (pointsToAdd > 0) {
            setLoyaltyData(prev => ({ ...prev, [cleanPhone]: (prev[cleanPhone] || 0) + pointsToAdd }));
             setOrders(prevOrders => prevOrders.map(o => o.id === order.id ? { ...o, loyaltyPointsAwarded: true } : o));
        }
    };

    const updateCustomerLoyaltyPoints = (phone: string, points: number) => {
        const cleanPhone = (phone || '').replace(/\s/g, '').replace('+2', '');
        if (cleanPhone) {
            setLoyaltyData(prev => ({ ...prev, [cleanPhone]: points }));
        }
    };

    // --- Cart and Order Placement Logic ---
    const handleAddToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === product.id);
            if (existingItem) {
                return prevCart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prevCart, {
                productId: product.id, name: product.name, quantity: 1, price: product.price,
                cost: product.costPrice, weight: product.weight, thumbnail: product.thumbnail
            }];
        });
    };

    const handleUpdateCartQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            handleRemoveFromCart(productId);
        } else {
            setCart(prevCart => prevCart.map(item => item.productId === productId ? { ...item, quantity } : item));
        }
    };

    const handleRemoveFromCart = (productId: string) => {
        setCart(prevCart => prevCart.filter(item => item.productId !== productId));
    };

    const handlePlaceOrder = (data: PlaceOrderData): string => {
        if (!activeStoreId || cart.length === 0) {
          throw new Error("لا يمكن إتمام الطلب بدون متجر نشط أو وجود منتجات في السلة.");
        }
        const newOrder: Order = {
            id: `order-${Date.now()}`,
            orderNumber: `ORD-${Date.now()}`,
            date: new Date().toISOString(),
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerAddress: data.customerAddress,
            shippingCompany: data.shippingCompany,
            shippingArea: data.shippingArea,
            shippingFee: data.shippingFee,
            items: cart,
            productName: cart.map(i => i.name).join(', '),
            productPrice: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
            productCost: cart.reduce((sum, item) => sum + item.cost * item.quantity, 0),
            weight: cart.reduce((sum, item) => sum + item.weight * item.quantity, 0),
            discount: data.discount,
            status: 'في_انتظار_المكالمة',
            paymentStatus: 'بانتظار الدفع',
            preparationStatus: 'بانتظار التجهيز',
            includeInspectionFee: true,
            isInsured: true,
            notes: data.notes
        };

        setOrders(prevOrders => [newOrder, ...prevOrders]);
        setCart([]); // Clear cart after placing order
        return newOrder.id;
    };

    if (!authChecked) {
        return <GlobalLoader />;
    }

    const MainLayout = () => {
        const location = useLocation();
        const isStorefront = location.pathname.startsWith('/store') || location.pathname.startsWith('/checkout') || location.pathname.startsWith('/order-success');
        
        if (isLoading) {
            return <WelcomeLoader userName={currentUser?.fullName.split(' ')[0] || ''}/>;
        }

        const canBypassStoreData = ['/create-store', '/manage-stores', '/account-settings'].includes(location.pathname);

        if (!activeStoreData && !canBypassStoreData) {
            if (currentUser?.stores && currentUser.stores.length > 0) {
                 return <Navigate to="/manage-stores" replace />;
            } else {
                 return <Navigate to="/create-store" replace />;
            }
        }

        if (isStorefront) {
            return <Outlet />;
        }

        return (
            <div className="flex flex-col h-screen bg-slate-50 dark:bg-gradient-to-b dark:from-slate-950 dark:to-[#111827] text-slate-800 dark:text-slate-200" dir="rtl">
                <Header 
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    onToggleSidebar={() => setIsSidebarOpen(true)}
                    theme={theme}
                    setTheme={setTheme}
                />
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar 
                        activeStore={activeStore}
                        isOpen={isSidebarOpen}
                        onClose={handleSidebarClose}
                    />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        );
    };

    const EmployeeAppLayout = () => {
        if (isLoading || !activeStoreData) return <WelcomeLoader userName={currentUser?.fullName.split(' ')[0] || ''}/>;

        return (
            <EmployeeLayout 
                currentUser={currentUser} 
                onLogout={handleLogout} 
                storeOwner={employeeAppLayoutStoreOwner || null}
                activeStoreId={activeStoreId}
                theme={theme}
                setTheme={setTheme}
                allStoresData={allStoresData}
                users={users}
                handleSetActiveStore={handleSetActiveStore}
            >
                <Outlet />
            </EmployeeLayout>
        );
    };
    
    const setStoreData = (updater: React.SetStateAction<StoreData>) => {
        if (activeStoreId) {
            setAllStoresData(prev => ({
                ...prev,
                [activeStoreId]: typeof updater === 'function' ? updater(prev[activeStoreId]) : updater
            }));
        }
    };
    
    const setSettings = (updater: React.SetStateAction<Settings>) => {
        if (activeStoreId && activeStoreData) {
            const newSettings = typeof updater === 'function' ? updater(activeStoreData.settings) : updater;
            setStoreData({ ...activeStoreData, settings: newSettings });
        }
    };

    const setWallet = (updater: React.SetStateAction<Wallet>) => {
        if (activeStoreId && activeStoreData) {
            const newWallet = typeof updater === 'function' ? updater(activeStoreData.wallet) : updater;
            setStoreData({ ...activeStoreData, wallet: newWallet });
        }
    };

    const setOrders = (updater: React.SetStateAction<Order[]>) => {
        if (activeStoreId && activeStoreData) {
            const newOrders = typeof updater === 'function' ? updater(activeStoreData.orders) : updater;
            setStoreData({ ...activeStoreData, orders: newOrders });
        }
    };

    return (
        <Router>
            {showCongratsModal && <CongratsModal onClose={() => setShowCongratsModal(false)} />}
            <Routes>
                {/* Public / Auth Routes */}
                <Route path="/owner-login" element={!currentUser ? <SignUpPage onAuthSuccess={handleAuthSuccess} users={users} setUsers={setUsers} /> : <Navigate to="/" />} />
                <Route path="/employee-login" element={!currentUser ? <EmployeeLoginPage onLoginAttempt={handleEmployeeLoginAttempt} onRegisterRequest={handleEmployeeRegisterRequest} allStoresData={allStoresData} users={users} /> : <Navigate to={isEmployeeSession ? "/employee/dashboard" : "/"} />} />
                <Route path="/track-order" element={<OrderTrackingPage orders={allOrders} />} />

                {/* Employee Routes */}
                <Route path="/employee" element={currentUser && isEmployeeSession ? <EmployeeAppLayout /> : <Navigate to="/employee-login" />}>
                    <Route index element={<Navigate to="dashboard" />} />
                    <Route path="dashboard" element={<EmployeeDashboardPage orders={activeStoreData?.orders || []} currentUser={currentUser} />} />
                    <Route path="confirmation-queue" element={<ConfirmationQueuePage orders={activeStoreData?.orders || []} setOrders={setOrders} currentUser={currentUser} settings={activeStoreData?.settings || INITIAL_SETTINGS} />} />
                    <Route path="account-settings" element={<EmployeeAccountSettingsPage currentUser={currentUser} setCurrentUser={setCurrentUser} users={users} setUsers={setUsers} />} />
                </Route>

                {/* Main Application (Owner) Routes */}
                <Route path="/" element={currentUser && !isEmployeeSession ? <MainLayout /> : <Navigate to={currentUser && isEmployeeSession ? "/employee/dashboard" : "/owner-login"} />}>
                     <Route index element={<Dashboard orders={activeStoreData?.orders || []} settings={activeStoreData?.settings || INITIAL_SETTINGS} wallet={activeStoreData?.wallet || { balance: 0, transactions: [] }} currentUser={currentUser} />} />
                     <Route path="confirmation-queue" element={<ConfirmationQueuePage orders={activeStoreData?.orders || []} setOrders={setOrders} currentUser={currentUser} settings={activeStoreData?.settings || INITIAL_SETTINGS} />} />
                     <Route path="orders" element={<OrdersList orders={activeStoreData?.orders || []} setOrders={setOrders} settings={activeStoreData?.settings || INITIAL_SETTINGS} setWallet={setWallet} addLoyaltyPointsForOrder={addLoyaltyPointsForOrder} />} />
                     <Route path="products" element={<ProductsPage settings={activeStoreData?.settings || INITIAL_SETTINGS} setSettings={setSettings} />} />
                     <Route path="customers" element={<CustomersPage orders={activeStoreData?.orders || []} loyaltyData={loyaltyData} updateCustomerLoyaltyPoints={updateCustomerLoyaltyPoints}/>} />
                     <Route path="wallet" element={<WalletPage wallet={activeStoreData?.wallet || {balance: 0, transactions: []}} setWallet={setWallet} orders={activeStoreData?.orders || []} settings={activeStoreData?.settings || INITIAL_SETTINGS} />} />
                     <Route path="settings" element={<SettingsPage settings={activeStoreData?.settings || INITIAL_SETTINGS} setSettings={setSettings} />} />
                     <Route path="customize-store" element={<StoreCustomizationPage settings={activeStoreData?.settings || INITIAL_SETTINGS} setSettings={setSettings} activeStore={activeStore} />} />
                     <Route path="shipping" element={<ShippingPage settings={activeStoreData?.settings || INITIAL_SETTINGS} setSettings={setSettings} />} />
                     <Route path="create-store" element={<CreateStorePage currentUser={currentUser} onStoreCreated={handleStoreCreated} />} />
                     <Route path="manage-stores" element={<ManageSitesPage ownedStores={currentUser?.stores || []} collaboratingStores={[]} setActiveStoreId={handleSetActiveStore} users={users} setUsers={setUsers} allStoresData={allStoresData} setAllStoresData={setAllStoresData} />} />
                     <Route path="abandoned-carts" element={<AbandonedCartsPage settings={activeStoreData?.settings || INITIAL_SETTINGS} setSettings={setSettings} />} />
                     <Route path="discounts" element={<DiscountsPage settings={activeStoreData?.settings || INITIAL_SETTINGS} setSettings={setSettings} />} />
                     <Route path="reviews" element={<ReviewsPage settings={activeStoreData?.settings || INITIAL_SETTINGS} setSettings={setSettings} />} />
                     <Route path="collections" element={<CollectionsPage settings={activeStoreData?.settings || INITIAL_SETTINGS} setSettings={setSettings} />} />
                     <Route path="product-options" element={<ProductOptionsPage settings={activeStoreData?.settings || INITIAL_SETTINGS} setSettings={setSettings} />} />
                     <Route path="expenses" element={<ExpensesPage wallet={activeStoreData?.wallet || {balance: 0, transactions: []}} setWallet={setWallet} />} />
                     <Route path="marketing" element={<MarketingPage settings={activeStoreData?.settings || INITIAL_SETTINGS} />} />
                     <Route path="ai-assistant" element={<ChatBot settings={activeStoreData?.settings || INITIAL_SETTINGS} orders={activeStoreData?.orders || []} />} />
                     <Route path="reports" element={<AnalyticsPage orders={activeStoreData?.orders || []} wallet={activeStoreData?.wallet || {balance: 0, transactions: []}} settings={activeStoreData?.settings || INITIAL_SETTINGS} />} />
                     <Route path="standard-reports" element={<ReportsPage orders={activeStoreData?.orders || []} wallet={activeStoreData?.wallet || { balance: 0, transactions: []}} settings={activeStoreData?.settings || INITIAL_SETTINGS} />} />
                     <Route path="collections-report" element={<CollectionsReportPage orders={activeStoreData?.orders || []} settings={activeStoreData?.settings || INITIAL_SETTINGS} />} />
                     <Route path="activity-logs" element={<ActivityLogsPage logs={activeStoreData?.settings.activityLogs || []} />} />
                     <Route path="suppliers" element={<SuppliersPage settings={activeStoreData?.settings || INITIAL_SETTINGS} setSettings={setSettings} setWallet={setWallet} />} />
                     <Route path="pages" element={<PagesManager settings={activeStoreData?.settings || INITIAL_SETTINGS} setSettings={setSettings} />} />
                     <Route path="settings/payment" element={<PaymentSettingsPage settings={activeStoreData?.settings || INITIAL_SETTINGS} setSettings={setSettings} />} />
                     <Route path="settings/employees" element={<EmployeesPage settings={activeStoreData?.settings || INITIAL_SETTINGS} setSettings={setSettings} currentUser={currentUser} users={users} activeStoreId={activeStoreId} />} />
                     <Route path="team-chat" element={<TeamChatPage currentUser={currentUser} activeStoreId={activeStoreId} settings={activeStoreData?.settings || INITIAL_SETTINGS} users={users} />} />
                     <Route path="whatsapp" element={<WhatsAppPage orders={activeStoreData?.orders || []} />} />
                     <Route path="account-settings" element={<AccountSettingsPage currentUser={currentUser} setCurrentUser={setCurrentUser} users={users} setUsers={setUsers} />} />
                     
                     <Route path="*" element={<Navigate to="/" />} />
                </Route>

                <Route path="/store" element={<StorefrontPage settings={activeStoreData?.settings || INITIAL_SETTINGS} setSettings={setSettings} activeStore={activeStore} cart={cart} onAddToCart={handleAddToCart} onUpdateCartQuantity={handleUpdateCartQuantity} onRemoveFromCart={handleRemoveFromCart} />} />
                <Route path="/checkout" element={<CheckoutPage settings={activeStoreData?.settings || INITIAL_SETTINGS} cart={cart} onPlaceOrder={handlePlaceOrder} />} />
                <Route path="/order-success/:orderId" element={<OrderSuccessPage orders={activeStoreData?.orders || []} settings={activeStoreData?.settings || INITIAL_SETTINGS} />} />

            </Routes>
        </Router>
    );
};

export default App;
