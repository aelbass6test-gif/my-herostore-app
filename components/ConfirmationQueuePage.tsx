
import React from 'react';
import { Order } from '../types';
import { PhoneForwarded, Check, X, User, MapPin, Package, CalendarDays } from 'lucide-react';

interface ConfirmationQueuePageProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

const ConfirmationQueuePage: React.FC<ConfirmationQueuePageProps> = ({ orders, setOrders }) => {
  const pendingOrders = orders.filter(o => o.status === 'في_انتظار_المكالمة').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleConfirm = (orderId: string) => {
    setOrders(prevOrders =>
      prevOrders.map(o =>
        o.id === orderId ? { ...o, status: 'قيد_التنفيذ' } : o
      )
    );
  };

  const handleCancel = (orderId: string) => {
    if (window.confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? { ...o, status: 'ملغي' } : o
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl"><PhoneForwarded size={28} /></div>
        <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white">أوردرات في انتظار التأكيد</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">تواصل مع العملاء لتأكيد طلباتهم قبل بدء التنفيذ.</p>
        </div>
      </div>

      {pendingOrders.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400">
            <Check size={48} className="mx-auto mb-4 opacity-50"/>
            <p className="font-bold">لا توجد طلبات في انتظار التأكيد حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingOrders.map(order => (
            <div key={order.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{order.customerName}</h3>
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{order.orderNumber}</span>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
                    <p className="flex items-center gap-2"><User size={14}/> {order.customerPhone}</p>
                    <p className="flex items-center gap-2"><MapPin size={14}/> {order.customerAddress}</p>
                    <p className="flex items-center gap-2"><Package size={14}/> {order.productName} - ({(order.productPrice + order.shippingFee - (order.discount || 0)).toLocaleString()} ج.م)</p>
                    <p className="flex items-center gap-2 text-xs"><CalendarDays size={14}/> {new Date(order.date).toLocaleString('ar-EG')}</p>
                </div>
              </div>
              <div className="flex md:flex-col gap-2 w-full md:w-auto self-stretch">
                <button onClick={() => handleConfirm(order.id)} className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-3 rounded-lg font-bold hover:bg-emerald-600 transition-all">
                    <Check size={18}/> تم التأكيد
                </button>
                <button onClick={() => handleCancel(order.id)} className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-4 py-2 rounded-lg font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-all">
                    <X size={18}/> إلغاء
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConfirmationQueuePage;
