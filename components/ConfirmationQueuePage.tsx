
import React, { useState, useMemo, useEffect } from 'react';
// FIX: Import 'OrderStatus' type to resolve 'Cannot find name' error.
import { Order, User, ConfirmationLog, OrderStatus, Settings } from '../types';
// FIX: Added Truck to the import to resolve the error.
import { PhoneForwarded, Check, X, User as UserIcon, MapPin, Package, CalendarDays, Phone, MessageSquare, Edit3, Save, Plus, Clock, ChevronsUpDown, ArrowRight, Truck, Tag } from 'lucide-react';

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
}

const ConfirmationQueuePage: React.FC<ConfirmationQueuePageProps> = ({ orders, setOrders, currentUser, settings }) => {
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [actionNotes, setActionNotes] = useState('');
    const [selectedAction, setSelectedAction] = useState(CONFIRMATION_ACTIONS[0]);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [editedAddress, setEditedAddress] = useState('');

    const pendingOrders = useMemo(() =>
        orders.filter(o => o.status === 'في_انتظار_المكالمة').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        [orders]
    );

    useEffect(() => {
        const freshActiveOrder = activeOrder ? orders.find(o => o.id === activeOrder.id) : null;
        const isStillPending = freshActiveOrder && freshActiveOrder.status === 'في_انتظار_المكالمة';

        if (isStillPending) {
            // If the active order is still pending, sync its data in case of updates (like new logs).
            if (JSON.stringify(freshActiveOrder) !== JSON.stringify(activeOrder)) {
                setActiveOrder(freshActiveOrder);
            }
        } else {
            // If the active order is no longer pending (or doesn't exist),
            // or if there's no active order set, select the first available pending order.
            const currentFirstPending = pendingOrders[0] || null;
            if (!activeOrder || activeOrder.id !== currentFirstPending?.id) {
                setActiveOrder(currentFirstPending);
            } else if (activeOrder && !currentFirstPending) {
                // This handles the case where the last pending order was just processed
                setActiveOrder(null);
            }
        }
    }, [orders, activeOrder, pendingOrders]);
    
    useEffect(() => {
        if (activeOrder) {
            handleSelectOrder(activeOrder);
        }
    }, [activeOrder?.id]);


    const getWhatsAppLink = (phone: string, name: string) => {
        let normalizedPhone = phone.replace(/\D/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '20' + normalizedPhone.substring(1);
        } else if (normalizedPhone.length === 10 && !normalizedPhone.startsWith('0')) {
            normalizedPhone = '20' + normalizedPhone;
        }
        const message = `أهلاً بك يا ${name.split(' ')[0]} 👋، نتصل بك من متجرنا لتأكيد طلبك.`;
        return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
    };

    const handleSelectOrder = (order: Order) => {
        setActiveOrder(order);
        setActionNotes('');
        setSelectedAction(CONFIRMATION_ACTIONS[0]);
        setIsEditingAddress(false);
        if (order) {
            setEditedAddress(order.customerAddress);
        }
    };
    
    const handleActionSubmit = () => {
        if (!activeOrder || !currentUser) return;

        const activeOrderId = activeOrder.id; // Capture ID for use in closure

        const newLog: ConfirmationLog = {
            userId: currentUser.phone,
            userName: currentUser.fullName,
            timestamp: new Date().toISOString(),
            action: selectedAction,
            notes: actionNotes
        };

        let newStatus: OrderStatus | null = null;
        if (selectedAction === 'تم التأكيد') {
            newStatus = 'جاري_المراجعة';
        } else if (selectedAction === 'تم الإلغاء') {
            newStatus = 'ملغي';
        }

        // Use functional update to ensure we're modifying the latest state
        setOrders(currentOrders =>
            currentOrders.map(order => {
                if (order.id === activeOrderId) {
                    return {
                        ...order,
                        status: newStatus || order.status,
                        confirmationLogs: [...(order.confirmationLogs || []), newLog]
                    };
                }
                return order;
            })
        );
        
        // Clear form fields
        setActionNotes('');
        setSelectedAction(CONFIRMATION_ACTIONS[0]);
    };

    const handleSaveAddress = () => {
        if (!activeOrder) return;
        const activeOrderId = activeOrder.id;
        setOrders(currentOrders => 
            currentOrders.map(o => o.id === activeOrderId ? { ...o, customerAddress: editedAddress } : o)
        );
        setIsEditingAddress(false);
    };
    
    const totalAmount = useMemo(() => {
        if (!activeOrder) return 0;
        const compFees = settings.companySpecificFees?.[activeOrder.shippingCompany];
        const useCustom = compFees?.useCustomFees ?? false;
        const inspectionFee = activeOrder.includeInspectionFee 
            ? (useCustom ? compFees!.inspectionFee : (settings.enableInspection ? settings.inspectionFee : 0))
            : 0;
        return activeOrder.productPrice + activeOrder.shippingFee - (activeOrder.discount || 0) + inspectionFee;
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
                {/* Orders List Panel */}
                <div className={`w-full md:w-1/3 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full transition-all duration-300 ${activeOrder && 'hidden md:flex'}`}>
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="font-bold text-slate-800 dark:text-white">طلبات جديدة ({pendingOrders.length})</h2>
                    </div>
                    {pendingOrders.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                            <Check size={48} className="mb-4 opacity-50"/>
                            <p className="font-bold">لا توجد طلبات في انتظار التأكيد.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto">
                            {pendingOrders.map(order => (
                                <button key={order.id} onClick={() => handleSelectOrder(order)} className={`w-full text-right p-4 flex items-start gap-3 transition-colors border-b border-slate-100 dark:border-slate-800 ${activeOrder?.id === order.id ? 'bg-cyan-50 dark:bg-cyan-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-slate-800 dark:text-white text-sm">{order.customerName}</h4>
                                            <span className="text-xs text-slate-500">{new Date(order.date).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{order.productName}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details Panel */}
                <div className={`w-full md:w-2/3 flex flex-col h-full transition-all duration-300 ${!activeOrder && 'hidden md:flex'}`}>
                    {activeOrder ? (
                        <>
                            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 flex-shrink-0">
                                <button onClick={() => setActiveOrder(null)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><ArrowRight size={20}/></button>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800 dark:text-white">تفاصيل الطلب #{activeOrder.orderNumber}</h3>
                                </div>
                            </div>
                            
                            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                                {/* Customer & Order Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DetailSection title="بيانات العميل">
                                        <DetailItem icon={<UserIcon size={14}/>} label="الاسم" value={activeOrder.customerName} />
                                        <DetailItem icon={<Phone size={14}/>} label="الهاتف" value={activeOrder.customerPhone} />
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={14}/> العنوان</label>
                                            {isEditingAddress ? (
                                                <div className="flex gap-2">
                                                    <input type="text" value={editedAddress} onChange={e => setEditedAddress(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded-md text-sm font-bold"/>
                                                    <button onClick={handleSaveAddress} className="p-2 bg-emerald-100 text-emerald-600 rounded-md"><Save size={16}/></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-start justify-between">
                                                    <p className="font-bold text-sm text-slate-800 dark:text-white pr-4">{activeOrder.customerAddress}</p>
                                                    <button onClick={() => { setIsEditingAddress(true); setEditedAddress(activeOrder.customerAddress); }} className="p-1 text-slate-400 hover:text-blue-500"><Edit3 size={14}/></button>
                                                </div>
                                            )}
                                        </div>
                                    </DetailSection>
                                    <DetailSection title="تفاصيل الطلب">
                                        <DetailItem icon={<Package size={14}/>} label="المنتجات" value={activeOrder.productName} />
                                        <DetailItem icon={<CalendarDays size={14}/>} label="تاريخ الطلب" value={new Date(activeOrder.date).toLocaleString('ar-EG')} />
                                        <DetailItem icon={<Truck size={14}/>} label="شركة الشحن" value={activeOrder.shippingCompany} />
                                    </DetailSection>
                                </div>
                                
                                <DetailSection title="الملخص المالي">
                                    <DetailItem icon={<Package size={14}/>} label="إجمالي المنتجات" value={`${activeOrder.productPrice.toLocaleString()} ج.م`} />
                                    <DetailItem icon={<Truck size={14}/>} label="مصاريف الشحن" value={`${activeOrder.shippingFee.toLocaleString()} ج.م`} />
                                    {activeOrder.discount > 0 && <DetailItem icon={<Tag size={14}/>} label="الخصم" value={`-${activeOrder.discount.toLocaleString()} ج.م`} />}
                                    <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                                    <div className="flex justify-between items-center font-black text-lg p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                                        <span className="text-slate-800 dark:text-white">الإجمالي المطلوب:</span>
                                        <span className="text-indigo-600 dark:text-indigo-400">{totalAmount.toLocaleString()} ج.م</span>
                                    </div>
                                </DetailSection>

                                {/* Quick Actions */}
                                <div className="flex gap-3">
                                    <a href={`tel:${activeOrder.customerPhone}`} className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white p-3 rounded-lg font-bold hover:bg-blue-600"><Phone size={16}/> اتصال</a>
                                    <a href={getWhatsAppLink(activeOrder.customerPhone, activeOrder.customerName)} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white p-3 rounded-lg font-bold hover:bg-emerald-600"><MessageSquare size={16}/> واتساب</a>
                                </div>
                                
                                {/* Confirmation Log */}
                                <DetailSection title="سجل المتابعة">
                                    {(activeOrder.confirmationLogs || []).length > 0 ? (
                                        <div className="space-y-3 max-h-40 overflow-y-auto">
                                            {activeOrder.confirmationLogs.slice().reverse().map(log => (
                                                <div key={log.timestamp} className="text-xs border-r-2 border-slate-200 dark:border-slate-700 pr-3">
                                                    <p className="font-bold text-slate-700 dark:text-slate-300">({log.action}) بواسطة {log.userName}</p>
                                                    <p className="text-slate-500">{new Date(log.timestamp).toLocaleString('ar-EG')}</p>
                                                    {log.notes && <p className="text-slate-600 dark:text-slate-400 italic mt-1">"{log.notes}"</p>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="py-4 text-center text-sm font-bold text-slate-400 dark:text-slate-500">لا يوجد سجل متابعة لهذا الطلب بعد.</p>
                                    )}
                                </DetailSection>
                            </div>

                            {/* Action Form */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 space-y-3">
                                <div className="relative">
                                    <select value={selectedAction} onChange={e => setSelectedAction(e.target.value)} className="w-full p-3 pr-4 pl-8 appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                                        {CONFIRMATION_ACTIONS.map(action => <option key={action} value={action}>{action}</option>)}
                                    </select>
                                    <ChevronsUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                </div>
                                <textarea placeholder="إضافة ملاحظات (اختياري)..." rows={2} value={actionNotes} onChange={e => setActionNotes(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                                <button onClick={handleActionSubmit} className="w-full p-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">حفظ الإجراء</button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 hidden md:flex items-center justify-center text-center text-slate-400 p-8">
                            <div>
                                <PhoneForwarded size={64} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">ابدأ بتأكيد الطلبات</h3>
                                <p className="text-sm mt-2">اختر طلباً من القائمة على اليمين لعرض تفاصيله.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DetailSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
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

export default ConfirmationQueuePage;