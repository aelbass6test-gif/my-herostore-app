import { Order, Settings } from '../types';
import { calculateOrderProfitLoss } from './financials';

export const generateOrdersReportHTML = (orders: Order[], settings: Settings, storeName: string): string => {
  
  const tableRows = orders.map(order => {
    const amountToCollect = order.totalAmountOverride ?? (order.productPrice + order.shippingFee - (order.discount || 0));
    const { net } = calculateOrderProfitLoss(order, settings);
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

    const getStatusColor = (status: string, type: 'status' | 'payment') => {
        const paymentIsPaid = ['مدفوع'].includes(status);
        const statusIsCollected = ['تم_التحصيل'].includes(status);
        if ((type === 'payment' && paymentIsPaid) || (type === 'status' && statusIsCollected)) return 'background-color: #dcfce7; color: #166534;'; // green
        
        const isFailure = ['مرتجع', 'فشل_التوصيل', 'ملغي'].includes(status);
        if (isFailure) return 'background-color: #fee2e2; color: #991b1b;'; // red

        const inProgress = ['تم_توصيلها', 'قيد_الشحن', 'تم_الارسال'].includes(status);
        if (inProgress) return 'background-color: #dbeafe; color: #1e40af;'; // blue
        
        return 'background-color: #f1f5f9; color: #475569;'; // slate
    }

    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 8px;">${order.customerName}</td>
        <td style="padding: 8px;">${order.productName}</td>
        <td style="padding: 8px;">${order.productPrice.toLocaleString()}</td>
        <td style="padding: 8px; text-align: center;">${totalQuantity}</td>
        <td style="padding: 8px;">${order.shippingFee.toLocaleString()}</td>
        <td style="padding: 8px;">${amountToCollect.toLocaleString()}</td>
        <td style="padding: 8px; font-weight: bold;">${amountToCollect.toLocaleString()}</td>
        <td style="padding: 8px; text-align: center;"><span style="padding: 4px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; white-space: nowrap; ${getStatusColor(order.status, 'status')}">${order.status.replace(/_/g, ' ')}</span></td>
        <td style="padding: 8px; text-align: center;"><span style="padding: 4px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; white-space: nowrap; ${getStatusColor(order.paymentStatus, 'payment')}">${order.paymentStatus}</span></td>
        <td style="padding: 8px; font-weight: bold; color: ${net >= 0 ? '#15803d' : '#b91c1c'};">${net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير الطلبات - ${storeName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        @page { size: A4 landscape; margin: 1cm; }
        body { font-family: 'Cairo', sans-serif; font-size: 9px; -webkit-print-color-adjust: exact; color-adjust: exact; }
        .report-container { width: 100%; }
        h1 { text-align: center; margin-bottom: 5px; color: #111827; font-size: 20px; }
        p { text-align: center; margin-top: 0; margin-bottom: 20px; font-size: 12px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 6px; border: 1px solid #ddd; text-align: right; }
        th { background-color: #1f2937 !important; color: white !important; font-size: 10px; }
        tbody tr:nth-child(even) { background-color: #f9fafb !important; }
      </style>
    </head>
    <body>
      <div class="report-container">
        <h1>تقرير الطلبات لمتجر "${storeName}"</h1>
        <p>تاريخ التقرير: ${new Date().toLocaleString('ar-EG')}</p>
        <table>
          <thead>
            <tr>
              <th>اسم العميل</th>
              <th>المنتج</th>
              <th>سعر المنتج</th>
              <th>كمية</th>
              <th>مصاريف الشحن</th>
              <th>مبلغ التحصيل</th>
              <th>إجمالي المبلغ</th>
              <th>حالة الشحنة</th>
              <th>حالة الدفع</th>
              <th>صافي الربح/الخسارة (ج.م)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;
};
