import React, { useState, useMemo } from 'react';
import { Wallet as WalletIcon, Plus, Minus, ArrowUpRight, ArrowDownLeft, Trash2, Calendar, Shield, Eye, Truck, TrendingUp, Info, AlertTriangle, Coins, Receipt, X, Layers } from 'lucide-react';
import { Wallet, Transaction, Order, Settings } from '../types';
// FIX: Add Variants type from framer-motion to solve typing issue.
import { motion, Variants } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// FIX: Explicitly typed as Variants to fix type error.
const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

interface GroupedTransaction {
    type: 'grouped';
    orderNumber: string;
    customerName: string;
    transactions: Transaction[];
    netAmount: number;
    lastTransactionDate: string;
    order: Order | undefined;
}

interface ManualTransaction {
    type: 'manual';
    transaction: Transaction;
}

type ProcessedTransaction = GroupedTransaction | ManualTransaction;

interface WalletPageProps {
  wallet: Wallet;
  setWallet: React.Dispatch<React.SetStateAction<Wallet>>;
  orders: Order[];
  settings: Settings;
}

const TransactionDetailsModal: React.FC<{
  groupedTransaction: GroupedTransaction;
  onClose: () => void;
  onDelete: (id: string) => void;
}> = ({ groupedTransaction, onClose, onDelete }) => {

    const summary = useMemo(() => {
        const deposits = groupedTransaction.transactions.filter(t => t.type === 'إيداع').reduce((sum, t) => sum + t.amount, 0);
        const withdrawals = groupedTransaction.transactions.filter(t => t.type === 'سحب').reduce((sum, t) => sum + t.amount, 0);
        return { deposits, withdrawals, net: deposits - withdrawals };
    }, [groupedTransaction]);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-black dark:text-white flex items-center gap-2">
                        <Receipt className="text-blue-600" />
                        تفاصيل عمليات الأوردر #{groupedTransaction.orderNumber}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {groupedTransaction.transactions.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg group">
                            <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{t.note}</p>
                                <p className="text-xs text-slate-400 font-mono">{t.date}</p>
                            </div>
                            <div className="flex items-center gap-4">
                               <span className={`font-bold ${t.type === 'إيداع' ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {t.type === 'إيداع' ? '+' : '-'}{t.amount.toLocaleString()} ج.م
                               </span>
                               <button onClick={() => onDelete(t.id)} className="p-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs font-bold text-slate-400">إجمالي الإيداعات</p>
                        <p className="font-black text-lg text-emerald-500">+{summary.deposits.toLocaleString()} ج.م</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400">إجمالي السحوبات</p>
                        <p className="font-black text-lg text-red-500">-{summary.withdrawals.toLocaleString()} ج.م</p>
                    </div>
                     <div>
                        <p className="text-xs font-bold text-slate-400">الصافي</p>
                        <p className={`font-black text-lg ${summary.net >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>{summary.net.toLocaleString()} ج.م</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


const WalletPage: React.FC<WalletPageProps> = ({ wallet, setWallet, orders, settings }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'إيداع' | 'سحب'>('إيداع');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<GroupedTransaction | null>(null);

  const walletStats = useMemo(() => {
    const liveBalance = wallet.transactions.reduce((sum, t) => t.type === 'إيداع' ? sum + t.amount : sum - t.amount, 0);
    const totalOutboundShipping = wallet.transactions.filter(t => t.category === 'shipping').reduce((sum, t) => sum + t.amount, 0);
    const totalInsuranceDeducted = wallet.transactions.filter(t => t.category === 'insurance').reduce((sum, t) => sum + t.amount, 0);
    const totalInspectionFeesDeducted = wallet.transactions.filter(t => t.category === 'inspection').reduce((sum, t) => sum + t.amount, 0);
    const totalCollectedGross = wallet.transactions.filter(t => t.category === 'collection').reduce((sum, t) => sum + t.amount, 0);
    const totalCodFees = wallet.transactions.filter(t => t.category === 'cod').reduce((sum, t) => sum + t.amount, 0);
    const totalReturnLoss = wallet.transactions.filter(t => t.category === 'return').reduce((sum, t) => sum + t.amount, 0);
    return { liveBalance, totalOutboundShipping, totalInsuranceDeducted, totalInspectionFeesDeducted, totalCollectedGross, totalCodFees, totalReturnLoss };
  }, [wallet.transactions]);
  
  const processedTransactions = useMemo((): ProcessedTransaction[] => {
    const groupedByOrder: Record<string, { transactions: Transaction[], order: Order | undefined }> = {};
    const manualTransactions: ManualTransaction[] = [];
    const orderNumberRegex = /#(\S+)/;

    wallet.transactions.forEach(t => {
        const match = t.note.match(orderNumberRegex);
        if (match && match[1]) {
            const orderNumber = match[1];
            if (!groupedByOrder[orderNumber]) {
                groupedByOrder[orderNumber] = {
                    transactions: [],
                    order: orders.find(o => o.orderNumber === orderNumber)
                };
            }
            groupedByOrder[orderNumber].transactions.push(t);
        } else {
            manualTransactions.push({ type: 'manual', transaction: t });
        }
    });

    const groupedList: GroupedTransaction[] = Object.entries(groupedByOrder).map(([orderNumber, data]) => {
        const netAmount = data.transactions.reduce((sum, t) => sum + (t.type === 'إيداع' ? t.amount : -t.amount), 0);
        const sortedTransactions = data.transactions.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
        
        return {
            type: 'grouped' as const,
            orderNumber,
            customerName: data.order?.customerName || 'عميل غير معروف',
            transactions: sortedTransactions,
            netAmount,
            lastTransactionDate: sortedTransactions[0].date,
            order: data.order
        };
    });

    const combinedList: ProcessedTransaction[] = [...groupedList, ...manualTransactions];
    
    return combinedList.sort((a, b) => {
        const dateA = new Date(a.type === 'grouped' ? a.transactions[0].id : a.transaction.id).getTime();
        const dateB = new Date(b.type === 'grouped' ? b.transactions[0].id : b.transaction.id).getTime();
        return dateB - dateA;
    });
}, [wallet.transactions, orders]);

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: modalType,
      amount: numAmount,
      date: new Date().toLocaleString('ar-EG'),
      note: note || (modalType === 'إيداع' ? 'إيداع يدوي' : 'سحب يدوي'),
      category: modalType === 'إيداع' ? 'manual_deposit' : 'manual_withdrawal'
    };

    setWallet(prev => ({ ...prev, transactions: [newTransaction, ...prev.transactions] }));
    setShowModal(false);
    setAmount('');
    setNote('');
  };

  const deleteTransaction = (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المعاملة؟ سيتم التراجع عن تأثيرها المالي.')) return;
    setWallet(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
    setSelectedOrderDetails(prev => {
        if (!prev) return null;
        const updatedTransactions = prev.transactions.filter(t => t.id !== id);
        if (updatedTransactions.length === 0) return null;
        return { ...prev, transactions: updatedTransactions };
    });
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="bg-gradient-to-l from-indigo-700 via-blue-700 to-blue-600 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
            <WalletIcon size={32} />
          </div>
          <div>
            <h2 className="text-white/80 text-sm font-black mb-1 flex items-center gap-2">كاش المحفظة الحي <Info size={14} className="opacity-50" /></h2>
            <p className="text-5xl font-black tracking-tighter">{walletStats.liveBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-lg font-normal">ج.م</span></p>
          </div>
        </div>
        <div className="relative z-10 flex gap-3 w-full md:w-auto">
          <button onClick={() => { setModalType('إيداع'); setShowModal(true); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-blue-700 px-6 py-3.5 rounded-2xl font-black hover:bg-blue-50 transition-all shadow-lg active:scale-95"><Plus size={20} /> إيداع رأس مال</button>
          <button onClick={() => { setModalType('سحب'); setShowModal(true); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-900/50 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-blue-900 transition-all shadow-lg active:scale-95 border border-white/10"><Minus size={20} /> سحب مصاريف</button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-2xl flex items-start gap-3">
        <Receipt className="text-blue-600 shrink-0 mt-1" size={20} />
        <div className="text-xs font-bold text-blue-800 dark:text-blue-300 leading-relaxed">
          <p className="mb-1 uppercase tracking-tighter">نظام المحفظة الجديد:</p>
          <p>أصبحت المحفظة الآن تسجل كل حركة مالية (شحن، تأمين، تحصيل...) كمعاملة مستقلة لضمان أقصى درجات الدقة والشفافية.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <DetailCard title="تكاليف شحن صادرة" value={walletStats.totalOutboundShipping} icon={<Truck />} color="amber" label="مصاريف الشحن للأوردرات" />
        <DetailCard title="رسوم تأمين مخصومة" value={walletStats.totalInsuranceDeducted} icon={<Shield />} color="blue" label="تأمين على الشحنات" />
        <DetailCard title="رسوم معاينة مخصومة" value={walletStats.totalInspectionFeesDeducted} icon={<Eye />} color="purple" label="تم خصمها من المحفظة" />
        <DetailCard title="إجمالي التحصيلات" value={walletStats.totalCollectedGross} icon={<TrendingUp />} color="emerald" label="إجمالي المبلغ المحصّل" />
        <DetailCard title="خصومات ومصاريف" value={walletStats.totalCodFees + walletStats.totalReturnLoss} icon={<Coins />} color="red" label="COD + مرتجع ثابت" />
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-black dark:text-white">سجل عمليات المحفظة</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">العملية / الأوردر</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">البيان</th>
                <th className="px-6 py-4 text-center">صافي العملية</th>
                <th className="px-6 py-4 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {processedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-600 font-bold italic">لا توجد عمليات مسجلة</td>
                </tr>
              ) : (
                processedTransactions.map((item, index) => {
                  if (item.type === 'grouped') {
                    const isProfit = item.netAmount >= 0;
                    return (
                      <tr key={`grouped-${item.orderNumber}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => setSelectedOrderDetails(item)}>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600"><Layers size={18} /></div>
                                <div>
                                    <span className="font-black text-blue-600 dark:text-blue-400 font-mono">{item.orderNumber}</span>
                                    <p className="text-xs text-slate-500 font-bold">{item.customerName}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400"><div className="flex items-center gap-1"><Calendar size={12} /> {item.lastTransactionDate}</div></td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">مجمع عمليات ({item.transactions.length})</td>
                        <td className={`px-6 py-4 text-center font-black ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                           {isProfit ? '+' : ''}{item.netAmount.toLocaleString()} ج.م
                        </td>
                        <td className="px-6 py-4 text-left"></td>
                      </tr>
                    )
                  }
                  // Manual Transaction
                  const t = item.transaction;
                  return (
                     <tr key={`manual-${t.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${t.type === 'إيداع' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-red-100 dark:bg-red-950 text-red-600'}`}>
                                {t.type === 'إيداع' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                </div>
                                <span className="font-black dark:text-white">{t.type} يدوي</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400"><div className="flex items-center gap-1"><Calendar size={12} /> {t.date}</div></td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">{t.note}</td>
                        <td className={`px-6 py-4 text-center font-black ${t.type === 'إيداع' ? 'text-emerald-600' : 'text-red-600'}`}>
                           {t.type === 'إيداع' ? '+' : '-'}{t.amount.toLocaleString()} ج.م
                        </td>
                        <td className="px-6 py-4 text-left"><button onClick={() => deleteTransaction(t.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"><Trash2 size={18} /></button></td>
                     </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-200 dark:border-slate-800 text-right">
            <div className={`p-6 text-white ${modalType === 'إيداع' ? 'bg-emerald-600' : 'bg-red-600'}`}>
              <h3 className="text-xl font-black flex items-center gap-2">
                {modalType === 'إيداع' ? <Plus size={24} /> : <Minus size={24} />}
                {modalType === 'إيداع' ? 'إيداع أموال (رأس مال)' : 'سحب أموال (مصاريف)'}
              </h3>
            </div>
            <form onSubmit={handleTransaction} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 dark:text-slate-400">المبلغ (ج.م)</label>
                <input required type="number" autoFocus placeholder="0.00" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-2xl font-black text-center dark:text-white" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 dark:text-slate-400">البيان / السبب</label>
                <input type="text" placeholder="مثلاً: رأس مال البداية، مصاريف مكتب..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className={`flex-1 py-3 text-white rounded-xl font-black shadow-lg active:scale-95 transition-all ${modalType === 'إيداع' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>تأكيد العملية</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-black hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedOrderDetails && (
          <TransactionDetailsModal
              groupedTransaction={selectedOrderDetails}
              onClose={() => setSelectedOrderDetails(null)}
              onDelete={deleteTransaction}
          />
      )}
    </motion.div>
  );
};

interface DetailCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  label: string;
}

const DetailCard = ({ title, value, icon, color, label }: DetailCardProps) => {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-100 dark:border-emerald-900/50',
    red: 'bg-red-50 dark:bg-red-950/30 text-red-600 border-red-100 dark:border-red-900/50',
    amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-100 dark:border-amber-900/50',
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 border-blue-100 dark:border-blue-900/50',
    purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 border-purple-100 dark:border-purple-900/50',
    slate: 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 border-slate-200 dark:border-slate-700'
  };

  return (
    <div className={`p-5 rounded-2xl border ${colors[color]} bg-white dark:bg-slate-900 flex flex-col gap-2 shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-black opacity-80 uppercase tracking-tighter">{title}</span>
        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-inherit">{icon}</div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black">{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        <span className="text-[10px] font-bold">ج.م</span>
      </div>
      <span className="text-[10px] font-black opacity-50">{label}</span>
    </div>
  );
};

export default WalletPage;
