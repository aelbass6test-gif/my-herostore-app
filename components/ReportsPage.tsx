
import React, { useMemo } from 'react';
import { Order, Settings, Wallet } from '../types';
import { FileText, TrendingUp, Package, Truck, DollarSign, ArrowUp, ArrowDown, PieChart as PieChartIcon } from 'lucide-react';
import { calculateOrderProfitLoss } from '../utils/financials';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ReportsPageProps {
  orders: Order[];
  settings: Settings;
  wallet: Wallet;
}

const ReportCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subValue?: string; color: 'emerald' | 'red' | 'amber' | 'blue' }> = ({ title, value, icon, subValue, color }) => {
    const colorClasses = {
        emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600', border: 'border-emerald-200 dark:border-emerald-800' },
        red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600', border: 'border-red-200 dark:border-red-800' },
        amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600', border: 'border-amber-200 dark:border-amber-800' },
        blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600', border: 'border-blue-200 dark:border-blue-800' },
    };
    const currentColors = colorClasses[color];

    return (
        <div className={`p-6 rounded-2xl border ${currentColors.border} bg-white dark:bg-slate-900 shadow-sm`}>
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">{title}</h3>
                    <p className="text-3xl font-black text-slate-800 dark:text-white">{value}</p>
                    {subValue && <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{subValue}</p>}
                </div>
                <div className={`p-3 rounded-xl ${currentColors.bg} ${currentColors.text}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};


const ReportsPage: React.FC<ReportsPageProps> = ({ orders, settings, wallet }) => {
    const reportData = useMemo(() => {
        const collectedOrders = orders.filter(o => o.status === 'تم_التحصيل');

        const totalRevenue = collectedOrders.reduce((sum, o) => sum + (o.productPrice + o.shippingFee - (o.discount || 0)), 0);
        const totalOrders = orders.length;
        const avgOrderValue = collectedOrders.length > 0 ? totalRevenue / collectedOrders.length : 0;
        
        let totalProfit = 0;
        let totalLoss = 0;
        orders.forEach(order => {
            const { net } = calculateOrderProfitLoss(order, settings);
            if (net > 0) totalProfit += net;
            else totalLoss += Math.abs(net);
        });
        const totalExpenses = wallet.transactions.filter(t => t.category?.startsWith('expense_')).reduce((sum, t) => sum + t.amount, 0);

        const productPerformance = settings.products.map(product => {
            const soldItems = orders.flatMap(o => o.items).filter(i => i.productId === product.id && (orders.find(ord => ord.items.includes(i))?.status === 'تم_التحصيل' || orders.find(ord => ord.items.includes(i))?.status === 'تم_توصيلها'));
            const quantitySold = soldItems.reduce((sum, i) => sum + i.quantity, 0);
            return { name: product.name, quantitySold };
        }).sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5);
        
        const shippingPerformance: { name: string; count: number; successRate: number }[] = [];
        const companies = Object.keys(settings.shippingOptions);
        companies.forEach(company => {
            const companyOrders = orders.filter(o => o.shippingCompany === company);
            if (companyOrders.length > 0) {
                const successful = companyOrders.filter(o => o.status === 'تم_التحصيل' || o.status === 'تم_توصيلها').length;
                shippingPerformance.push({
                    name: company,
                    count: companyOrders.length,
                    successRate: (successful / companyOrders.length) * 100
                });
            }
        });

        return {
            totalRevenue, totalOrders, avgOrderValue,
            totalProfit, totalLoss, totalExpenses,
            netFinancial: totalProfit - totalLoss - totalExpenses,
            productPerformance,
            shippingPerformance
        };
    }, [orders, settings, wallet]);

    const COLORS = ['#4f46e5', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'];

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><FileText size={28} /></div>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white">مركز التقارير</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">ملخص شامل لأداء متجرك.</p>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-700 dark:text-white">الملخص المالي</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ReportCard title="إجمالي الأرباح" value={`${reportData.totalProfit.toLocaleString('ar-EG', {maximumFractionDigits: 0})} ج.م`} icon={<ArrowUp size={24}/>} color='emerald' />
                    <ReportCard title="إجمالي الخسائر" value={`${reportData.totalLoss.toLocaleString('ar-EG', {maximumFractionDigits: 0})} ج.م`} icon={<ArrowDown size={24}/>} color='red' />
                    <ReportCard title="إجمالي المصروفات" value={`${reportData.totalExpenses.toLocaleString('ar-EG')} ج.م`} icon={<DollarSign size={24}/>} color='amber' />
                    <ReportCard title="صافي المركز المالي" value={`${reportData.netFinancial.toLocaleString('ar-EG', {maximumFractionDigits: 0})} ج.م`} icon={<PieChartIcon size={24}/>} color='blue' />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><TrendingUp/> ملخص المبيعات</h3>
                    <div className="space-y-4">
                       <div className="flex justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><span className="font-bold text-slate-600 dark:text-slate-400">إجمالي الإيرادات (المحصلة)</span><span className="font-black text-lg text-emerald-600">{reportData.totalRevenue.toLocaleString()} ج.م</span></div>
                       <div className="flex justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><span className="font-bold text-slate-600 dark:text-slate-400">إجمالي عدد الطلبات</span><span className="font-black text-lg text-slate-700 dark:text-white">{reportData.totalOrders}</span></div>
                       <div className="flex justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><span className="font-bold text-slate-600 dark:text-slate-400">متوسط قيمة الطلب</span><span className="font-black text-lg text-slate-700 dark:text-white">{reportData.avgOrderValue.toFixed(0)} ج.م</span></div>
                    </div>
                 </div>
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Package/> المنتجات الأكثر مبيعاً</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.productPerformance} layout="vertical" margin={{ left: 10, right: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: 'rgb(100 116 139)' }} axisLine={false} tickLine={false} reversed />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', direction: 'rtl' }} cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} />
                                <Bar dataKey="quantitySold" name="الكمية المباعة" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={15}>
                                     {reportData.productPerformance.map((entry, index) => ( <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Truck/> أداء شركات الشحن</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportData.shippingPerformance.map(company => (
                         <div key={company.name} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                            <h4 className="font-bold text-slate-700 dark:text-white">{company.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي الطلبات: {company.count}</p>
                            <div className="mt-3">
                                <div className="flex justify-between items-center text-xs font-bold mb-1">
                                    <span className="text-emerald-600 dark:text-emerald-400">نسبة النجاح</span>
                                    <span>{company.successRate.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${company.successRate}%` }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ReportsPage;
