import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Order, User, ConfirmationLog, OrderStatus, Settings, OrderItem, Product, Store } from '../types';
import { PhoneForwarded, Check, X, User as UserIcon, MapPin, Package, CalendarDays, Phone, MessageSquare, Edit3, Save, Plus, Clock, ChevronsUpDown, ArrowRight, Truck, Tag, XCircle, Eye } from 'lucide-react';

const CONFIRMATION_ACTIONS = [
    'تم التأكيد',
    'العميل لم يرد',
    'رقم خاطئ',
    'تم الإلغاء',
    'مؤجل',
    'يحتاج متابعة'
];

interface ConfirmationQueuePageProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  currentUser: User | null;
  settings: Settings;
  activeStore?: Store;
}

interface DetailSectionProps {
    title: string;
    children?: React.ReactNode;
}

const DetailSection = ({ title, children }: DetailSectionProps) => (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <h4 className="font-bold text-slate-600 dark:text-slate-400 mb-3 text-sm">{title}</h4>
        <div className="space-y-3">{children}</div>
    </div>
);

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <div className="space-y-1">
        <label className="text-xs text-slate-500 flex items-center gap-1">{icon} {label}</label>
        <p className="font-bold text-sm text-slate-800 dark:text-white">{value}</p>
    </div>
);

const ConfirmationQueuePage: React.FC<ConfirmationQueuePageProps> = ({ orders, setOrders, currentUser, settings, activeStore }) => {
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [actionNotes, setActionNotes] = useState('');
    const [selectedAction, setSelectedAction] = useState(CONFIRMATION_ACTIONS[0]);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [editedAddress, setEditedAddress] = useState('');
    const [isEditingPhone2, setIsEditingPhone2] = useState(false);
    const [editedPhone2, setEditedPhone2] = useState('');
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    const pendingOrders = useMemo(() =>
        orders.filter(o => o.status === 'في_انتظار_المكالمة').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        [orders]
    );

    useEffect(() => {
        if (activeOrder) {
            const isStillPending = pendingOrders.some(o => o.id === activeOrder.id);
            if (!isStillPending) {
                setActiveOrder(pendingOrders[0] || null);
            } else {
                const freshActiveOrderData = pendingOrders.find(o => o.id === activeOrder.id);
                if (freshActiveOrderData && JSON.stringify(freshActiveOrderData) !== JSON.stringify(activeOrder)) {
                    setActiveOrder(freshActiveOrderData);
                }
            }
        }
    }, [orders, pendingOrders]);
    
    useEffect(() => {
        if (activeOrder) {
            setActionNotes('');
            setSelectedAction(CONFIRMATION_ACTIONS[0]);
            setIsEditingName(false);
            setEditedName(activeOrder.customerName);
            setIsEditingAddress(false);
            setEditedAddress(activeOrder.customerAddress);
            setIsEditingPhone2(false);
            setEditedPhone2(activeOrder.customerPhone2 || '');
        }
    }, [activeOrder]);

    const getWhatsAppLink = (order: Order) => {
        let normalizedPhone = order.customerPhone.replace(/\D/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '20' + normalizedPhone.substring(1);
        } else if (normalizedPhone.length === 10 && !normalizedPhone.startsWith('0')) {
            normalizedPhone = '20' + normalizedPhone;
        }
        
        const customerName = order.customerName.split(' ')[0];
        const employeeName = currentUser?.fullName || 'مندوب المبيعات';
        const storeName = activeStore?.name || 'متجرنا';
        const productName = order.productName;
    
        const message = `أهلاً بك يا ${customerName} 👋، انا ${employeeName} نتصل بك من ${storeName} لتأكيد ${productName}. للتاكيد ارسل كلمة تاكيد او الغاء لالغاء الشحنه`;

        return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
    };

    const handleSelectOrder = (order: Order) => {
        const orderToActivate = { ...order };
        if (!orderToActivate.items || orderToActivate.items.length === 0) {
            orderToActivate.items = [{
                productId: settings.products.find(p => p.name === order.productName)?.id || 'legacy-product-id',
                name: order.productName,
                quantity: 1,
                price: order.productPrice,
                cost: order.productCost,
                weight: order.weight,
            }];
        }
        setActiveOrder(orderToActivate);
    };
    
    const handleActionSubmit = () => {
        if (!activeOrder || !currentUser) return;
        const activeOrderId = activeOrder.id;
        const newLog: ConfirmationLog = { userId: currentUser.phone, userName: currentUser.fullName, timestamp: new Date().toISOString(), action: selectedAction, notes: actionNotes };
        let newStatus: OrderStatus | null = null;
        if (selectedAction === 'تم التأكيد') newStatus = 'جاري_المراجعة';
        else if (selectedAction === 'تم الإلغاء') newStatus = 'ملغي';
        setOrders(currentOrders => currentOrders.map(order => order.id === activeOrderId ? { ...order, status: newStatus || order.status, confirmationLogs: [...(order.confirmationLogs || []), newLog] } : order));
        setActionNotes('');
        setSelectedAction(CONFIRMATION_ACTIONS[0]);
    };

    const updateActiveOrderField = (field: keyof Order, value: any) => {
        if (!activeOrder) return;
        setOrders(currentOrders => 
            currentOrders.map(o => o.id === activeOrder.id ? { ...o, [field]: value } : o)
        );
    };

    const handleSaveName = () => {
        updateActiveOrderField('customerName', editedName);
        setIsEditingName(false);
    };
    const handleSaveAddress = () => {
        updateActiveOrderField('customerAddress', editedAddress);
        setIsEditingAddress(false);
    };
    const handleSavePhone2 = () => {
        updateActiveOrderField('customerPhone2', editedPhone2);
        setIsEditingPhone2(false);
    };
    const handleSaveProducts = (newItems: OrderItem[]) => {
        if (!activeOrder) return;

        const totalProductPrice = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const totalProductCost = newItems.reduce((sum, item) => sum + item.cost * item.quantity, 0);
        const totalWeight = newItems.reduce((sum, item) => sum + item.weight * item.quantity, 0);
        const productNames = newItems.map(item => item.name).join(', ');

        const updatedOrder: Order = {
            ...activeOrder,
            items: newItems,
            productName: productNames,
            productPrice: totalProductPrice,
            productCost: totalProductCost,
            weight: totalWeight,
        };

        setOrders(currentOrders => 
            currentOrders.map(o => o.id === activeOrder.id ? updatedOrder : o)
        );
        setIsProductModalOpen(false);
    };
    
    const { productsTotal, totalAmount, inspectionFeeValue } = useMemo(() => {
        if (!activeOrder) return { productsTotal: 0, totalAmount: 0, inspectionFeeValue: 0 };
        const productsTotal = activeOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const compFees = settings.companySpecificFees?.[activeOrder.shippingCompany];
        const useCustom = compFees?.useCustomFees ?? false;
        const inspectionFee = activeOrder.includeInspectionFee ? (useCustom ? compFees!.inspectionFee : (settings.enableInspection ? settings.inspectionFee : 0)) : 0;
        const totalAmountCalc = productsTotal + activeOrder.shippingFee - (activeOrder.discount || 0) + inspectionFee;
        return { productsTotal, totalAmount: totalAmountCalc, inspectionFeeValue: inspectionFee };
    }, [activeOrder, settings]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-4 mb-6 flex-shrink-0">
                <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl"><PhoneForwarded size={28} /></div>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white">قائمة تأكيد الطلبات</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">تواصل مع العملاء لتأكيد طلباتهم الجديدة.</p>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex overflow-hidden min-h-[600px]">
                <div className={`w-full md:w-1/3 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full transition-all duration-300 ${activeOrder ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800"><h2 className="font-bold text-slate-800 dark:text-white">طلبات جديدة ({pendingOrders.length})</h2></div>
                    {pendingOrders.length === 0 ? <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400"><Check size={48} className="mb-4 opacity-50"/><p className="font-bold">لا توجد طلبات في انتظار التأكيد.</p></div>
                     : <div className="flex-1 overflow-y-auto">{pendingOrders.map(order => <button key={order.id} onClick={() => handleSelectOrder(order)} className={`w-full text-right p-4 flex items-start gap-3 transition-colors border-b border-slate-100 dark:border-slate-800 ${activeOrder?.id === order.id ? 'bg-cyan-50 dark:bg-cyan-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}><div className="flex-1"><div className="flex justify-between items-center"><h4 className="font-bold text-slate-800 dark:text-white text-sm">{order.customerName}</h4><span className="text-xs text-slate-500">{new Date(order.date).toLocaleDateString('ar-EG')}</span></div><p className="text-xs text-slate-500 dark:text-slate-400 truncate">{order.productName}</p></div></button>)}</div>}
                </div>

                <div className={`w-full md:w-2/3 flex flex-col h-full transition-all duration-300 ${activeOrder ? 'flex' : 'hidden md:flex'}`}>
                    {activeOrder ? (
                        <>
                            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 flex-shrink-0">
                                <button onClick={() => setActiveOrder(null)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><ArrowRight size={20}/></button>
                                <div className="flex-1"><h3 className="font-bold text-slate-800 dark:text-white">تفاصيل الطلب #{activeOrder.orderNumber}</h3></div>
                            </div>
                            
                            <div className="flex-1 p-6 space-y-6 overflow-y-auto md:pb-6 pb-28">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DetailSection title="بيانات العميل">
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 flex items-center gap-1"><UserIcon size={14}/> الاسم</label>
                                            {isEditingName ? (<div className="flex gap-2"><input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded-md text-sm font-bold"/><button onClick={handleSaveName} className="p-2 bg-emerald-100 text-emerald-600 rounded-md"><Save size={16}/></button></div>) 
                                            : (<div className="flex items-start justify-between"><p className="font-bold text-sm text-slate-800 dark:text-white pr-4">{activeOrder.customerName}</p><button onClick={() => { setIsEditingName(true); setEditedName(activeOrder.customerName); }} className="p-1 text-slate-400 hover:text-blue-500"><Edit3 size={14}/></button></div>)}
                                        </div>
                                        <DetailItem icon={<Phone size={14}/>} label="الهاتف" value={activeOrder.customerPhone} />
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 flex items-center gap-1"><Phone size={14}/> هاتف إضافي</label>
                                            {isEditingPhone2 ? (<div className="flex gap-2"><input type="tel" value={editedPhone2} onChange={e => setEditedPhone2(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded-md text-sm font-bold" placeholder="أضف رقم هاتف آخر..."/><button onClick={handleSavePhone2} className="p-2 bg-emerald-100 text-emerald-600 rounded-md"><Save size={16}/></button><button type="button" onClick={() => setIsEditingPhone2(false)} className="p-2 bg-slate-100 text-slate-600 rounded-md"><X size={16}/></button></div>) 
                                            : (<div className="flex items-start justify-between">{activeOrder.customerPhone2 ? <p className="font-bold text-sm text-slate-800 dark:text-white pr-4">{activeOrder.customerPhone2}</p> : <p className="text-sm text-slate-400 italic pr-4">لا يوجد</p>}<button onClick={() => { setIsEditingPhone2(true); setEditedPhone2(activeOrder.customerPhone2 || ''); }} className="p-1 text-slate-400 hover:text-blue-500"><Edit3 size={14}/></button></div>)}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={14}/> العنوان</label>
                                            {isEditingAddress ? (<div className="flex gap-2"><input type="text" value={editedAddress} onChange={e => setEditedAddress(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded-md text-sm font-bold"/><button onClick={handleSaveAddress} className="p-2 bg-emerald-100 text-emerald-600 rounded-md"><Save size={16}/></button></div>) 
                                            : (<div className="flex items-start justify-between"><p className="font-bold text-sm text-slate-800 dark:text-white pr-4">{activeOrder.customerAddress}</p><button onClick={() => { setIsEditingAddress(true); setEditedAddress(activeOrder.customerAddress); }} className="p-1 text-slate-400 hover:text-blue-500"><Edit3 size={14}/></button></div>)}
                                        </div>
                                    </DetailSection>
                                    <DetailSection title="تفاصيل الطلب">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs text-slate-500 flex items-center gap-1"><Package size={14}/> المنتجات</label>
                                                <button onClick={() => setIsProductModalOpen(true)} className="text-xs font-bold text-blue-600 hover:underline">تعديل</button>
                                            </div>
                                            <div className="space-y-2">{activeOrder.items.map(item => (<div key={item.productId + (item.variantId || '')} className="flex justify-between items-center bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg"><div><p className="font-bold text-sm text-slate-800 dark:text-white">{item.name}</p><p className="text-xs text-slate-500">{item.variantDescription || ''}</p></div><div className="text-right"><p className="font-bold text-sm text-slate-700 dark:text-slate-300">{item.quantity} x {item.price.toLocaleString()} ج.م</p><p className="font-black text-xs text-indigo-600 dark:text-indigo-400">{(item.quantity * item.price).toLocaleString()} ج.م</p></div></div>))}</div>
                                        </div>
                                        <DetailItem icon={<CalendarDays size={14}/>} label="تاريخ الطلب" value={new Date(activeOrder.date).toLocaleString('ar-EG')} />
                                        <DetailItem icon={<Truck size={14}/>} label="شركة الشحن" value={activeOrder.shippingCompany} />
                                    </DetailSection>
                                </div>
                                <DetailSection title="خيارات الطلب">
                                    <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                        <label htmlFor="inspectionToggle" className="font-bold text-sm text-slate-800 dark:text-white cursor-pointer">تفعيل رسوم المعاينة</label>
                                        <input type="checkbox" id="inspectionToggle" checked={activeOrder.includeInspectionFee} onChange={e => updateActiveOrderField('includeInspectionFee', e.target.checked)} className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"/>
                                    </div>
                                </DetailSection>
                                <DetailSection title="الملخص المالي">
                                    <DetailItem icon={<Package size={14}/>} label="إجمالي المنتجات" value={`${productsTotal.toLocaleString()} ج.م`} />
                                    <DetailItem icon={<Truck size={14}/>} label="مصاريف الشحن" value={`${activeOrder.shippingFee.toLocaleString()} ج.م`} />
                                    {inspectionFeeValue > 0 && <DetailItem icon={<Eye size={14}/>} label="رسوم المعاينة" value={`${inspectionFeeValue.toLocaleString()} ج.م`} />}
                                    {activeOrder.discount > 0 && <DetailItem icon={<Tag size={14}/>} label="الخصم" value={`-${activeOrder.discount.toLocaleString()} ج.م`} />}
                                    <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                                    <div className="flex justify-between items-center font-black text-lg p-2 bg-slate-200 dark:bg-slate-700 rounded-lg"><span className="text-slate-800 dark:text-white">الإجمالي المطلوب:</span><span className="text-indigo-600 dark:text-indigo-400">{totalAmount.toLocaleString()} ج.م</span></div>
                                </DetailSection>
                                <DetailSection title="سجل المتابعة">
                                    {(activeOrder.confirmationLogs || []).length > 0 ? (<div className="space-y-3 max-h-40 overflow-y-auto">{activeOrder.confirmationLogs.slice().reverse().map(log => (<div key={log.timestamp} className="text-xs border-r-2 border-slate-200 dark:border-slate-700 pr-3"><p className="font-bold text-slate-700 dark:text-slate-300">({log.action}) بواسطة {log.userName}</p><p className="text-slate-500">{new Date(log.timestamp).toLocaleString('ar-EG')}</p>{log.notes && <p className="text-slate-600 dark:text-slate-400 italic mt-1">"{log.notes}"</p>}</div>))}</div>) 
                                    : (<p className="py-4 text-center text-sm font-bold text-slate-400 dark:text-slate-500">لا يوجد سجل متابعة لهذا الطلب بعد.</p>)}
                                </DetailSection>
                            </div>
                            <div className="hidden md:block p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 space-y-3">
                                <div className="relative"><select value={selectedAction} onChange={e => setSelectedAction(e.target.value)} className="w-full p-3 pr-4 pl-8 appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500">{CONFIRMATION_ACTIONS.map(action => <option key={action} value={action}>{action}</option>)}</select><ChevronsUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/></div>
                                <textarea placeholder="إضافة ملاحظات (اختياري)..." rows={2} value={actionNotes} onChange={e => setActionNotes(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                                <button onClick={handleActionSubmit} className="w-full p-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">حفظ الإجراء</button>
                            </div>
                            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 p-2 flex items-center gap-2 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
                                <a href={`tel:${activeOrder.customerPhone}`} className="flex-1 flex items-center justify-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-3 rounded-lg font-bold hover:bg-blue-200"><Phone size={16}/> اتصال</a>
                                <a href={getWhatsAppLink(activeOrder)} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg font-bold hover:bg-emerald-200"><MessageSquare size={16}/> واتساب</a>
                                <button onClick={() => setIsLogModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700"><Save size={16}/> تسجيل إجراء</button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 hidden md:flex items-center justify-center text-center text-slate-400 p-8"><div><PhoneForwarded size={64} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" /><h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">ابدأ بتأكيد الطلبات</h3><p className="text-sm mt-2">اختر طلباً من القائمة على اليمين لعرض تفاصيله.</p></div></div>
                    )}
                </div>
            </div>
            {isProductModalOpen && activeOrder && <ProductEditModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSave={handleSaveProducts} currentItems={activeOrder.items} allProducts={settings.products} />}
            {isLogModalOpen && activeOrder && (<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsLogModalOpen(false)}><motion.div initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full bg-white dark:bg-slate-900 rounded-t-2xl p-5 shadow-lg border-t border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}><div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4"></div><h3 className="font-bold text-lg mb-4 text-center text-slate-800 dark:text-white">تسجيل إجراء للمكالمة</h3><div className="space-y-3"><div className="relative"><select value={selectedAction} onChange={e => setSelectedAction(e.target.value)} className="w-full p-3 pr-4 pl-8 appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500">{CONFIRMATION_ACTIONS.map(action => <option key={action} value={action}>{action}</option>)}</select><ChevronsUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/></div><textarea placeholder="إضافة ملاحظات (اختياري)..." rows={3} value={actionNotes} onChange={e => setActionNotes(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"></textarea><button onClick={() => { handleActionSubmit(); setIsLogModalOpen(false); }} className="w-full p-4 bg-indigo-600 text-white rounded-lg font-black hover:bg-indigo-700">حفظ الإجراء</button></div></motion.div></div>)}
        </div>
    );
};

interface ProductEditModalProps {
    isOpen: boolean; onClose: () => void; onSave: (items: OrderItem[]) => void;
    currentItems: OrderItem[]; allProducts: Product[];
}
const ProductEditModal: React.FC<ProductEditModalProps> = ({ isOpen, onClose, onSave, currentItems, allProducts }) => {
    const [editedItems, setEditedItems] = useState<OrderItem[]>(currentItems);
    
    const updateItem = (index: number, field: keyof OrderItem, value: any) => {
        let newItems = [...editedItems];
        if (field === 'productId') {
            const product = allProducts.find(p => p.id === value);
            if(product) newItems[index] = { ...newItems[index], productId: value, name: product.name, price: product.price, cost: product.costPrice, weight: product.weight, thumbnail: product.thumbnail };
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }
        setEditedItems(newItems);
    };

    const addItem = () => {
        if (allProducts.length === 0) return;
        const firstProduct = allProducts[0];
        setEditedItems([...editedItems, { productId: firstProduct.id, name: firstProduct.name, quantity: 1, price: firstProduct.price, cost: firstProduct.costPrice, weight: firstProduct.weight, thumbnail: firstProduct.thumbnail }]);
    };
    const removeItem = (index: number) => setEditedItems(editedItems.filter((_, i) => i !== index));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-black dark:text-white flex items-center gap-3"><Package className="text-indigo-500"/> تعديل منتجات الطلب</h3>
                    <button onClick={onClose}><XCircle className="text-slate-400 hover:text-red-500"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {editedItems.map((item, index) => (
                        <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800/50 border rounded-lg space-y-2 relative">
                            <button onClick={() => removeItem(index)} className="absolute top-2 left-2 text-slate-400 hover:text-red-500"><XCircle size={16}/></button>
                            <select value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-800 rounded text-sm">{allProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                            <div className="flex gap-2">
                                <input type="number" placeholder="الكمية" value={item.quantity} onChange={e => updateItem(index, 'quantity', Number(e.target.value))} className="w-1/2 p-2 bg-white dark:bg-slate-800 rounded" />
                                <input type="number" placeholder="السعر" value={item.price} onChange={e => updateItem(index, 'price', Number(e.target.value))} className="w-1/2 p-2 bg-white dark:bg-slate-800 rounded" />
                            </div>
                        </div>
                    ))}
                    <button onClick={addItem} className="w-full mt-3 p-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 font-bold rounded-lg text-sm">+ إضافة منتج آخر</button>
                </div>
                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-3">
                    <button onClick={onClose} className="px-6 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold border border-slate-200 dark:border-slate-600">إلغاء</button>
                    <button onClick={() => onSave(editedItems)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-2"><Save size={16}/> حفظ التغييرات</button>
                </div>
            </div>
        </div>
    );
};


export default ConfirmationQueuePage;