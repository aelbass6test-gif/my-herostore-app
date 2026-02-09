
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Package, Plus, Trash2, Edit3, Save, XCircle, Search, AlertCircle, Barcode, DollarSign, Scale, Wallet, RefreshCw, ServerOff, Image as ImageIcon, CheckCircle, Clock, Download, Layers, Grid3x3, Wand2, FileText, Copy, ChevronsUpDown, Percent, Upload, FileUp } from 'lucide-react';
import { Settings, Product, ProductVariant } from '../types';
import { fetchWuiltProducts } from '../services/platformService';
// FIX: Add Variants type from framer-motion to solve typing issue.
import { motion, Variants } from 'framer-motion';
import { generateProductDescription, generateSocialMediaPost } from '../services/geminiService';

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

interface ProductsPageProps {
  settings: Settings;
  setSettings: (s: Settings) => void;
}

const ProductsPage: React.FC<ProductsPageProps> = ({ settings, setSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ sku: '', name: '', price: 0, weight: 1, costPrice: 0, stockQuantity: 10, collectionId: '', description: '', images: [], hasVariants: false, options: [], variants: [], useProfitPercentage: false, profitPercentage: 0 });
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string | null }>({ type: 'idle', message: null });
  const [lastSync, setLastSync] = useState<Date | null>(() => {
    const saved = localStorage.getItem('lastProductSync');
    return saved ? new Date(saved) : null;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [generatedPost, setGeneratedPost] = useState('');
  
  const importInputRef = useRef<HTMLInputElement>(null);

  const isPlatformConnected = settings.integration?.platform !== 'none';

  const filteredProducts = settings.products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = editingProduct || newProduct;

    if (!productData.name || (!productData.hasVariants && !productData.price)) {
        alert("يرجى إدخال اسم المنتج وسعره على الأقل.");
        return;
    }

    let finalStock = productData.stockQuantity || 0;
    if (productData.hasVariants && productData.variants) {
        finalStock = productData.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
    }
    
    let finalCostPrice = productData.costPrice || 0;
    if (productData.useProfitPercentage) {
        const price = productData.price || 0;
        const percentage = productData.profitPercentage || 0;
        finalCostPrice = price * (1 - (percentage / 100));
    }

    const productToSave: Product = {
        id: productData.id || `prod-${Date.now()}`,
        sku: productData.sku || `SKU-${Date.now()}`,
        name: productData.name!,
        price: productData.price || 0,
        weight: productData.weight || 1,
        costPrice: finalCostPrice,
        stockQuantity: finalStock,
        inStock: finalStock > 0,
        collectionId: productData.collectionId || undefined,
        description: productData.description || '',
        images: productData.images || [],
        thumbnail: productData.thumbnail || '',
        hasVariants: productData.hasVariants || false,
        options: productData.hasVariants ? (productData.options || []) : [],
        variants: productData.hasVariants ? (productData.variants || []) : [],
        useProfitPercentage: productData.useProfitPercentage || false,
        profitPercentage: productData.profitPercentage || 0,
    };
    
    if (editingProduct) {
        setSettings({ ...settings, products: settings.products.map(p => p.id === editingProduct.id ? productToSave : p) });
        setEditingProduct(null);
    } else {
        setSettings({ ...settings, products: [...settings.products, productToSave] });
        setIsAdding(false);
    }
  };

  const confirmDelete = () => {
    if (productToDelete) {
        setSettings({
            ...settings,
            products: settings.products.filter(p => p.id !== productToDelete.id)
        });
        setProductToDelete(null);
    }
  };

  const handleGenerateDescription = async (isEdit: boolean) => {
      const targetProduct = isEdit ? editingProduct : newProduct;
      if (!targetProduct?.name || !targetProduct?.price) {
          alert("يرجى إدخال اسم المنتج وسعره أولاً.");
          return;
      }
      setIsGenerating(true);
      const desc = await generateProductDescription(targetProduct.name, targetProduct.price);
      if (isEdit) {
          setEditingProduct(p => p ? { ...p, description: desc } : null);
      } else {
          setNewProduct(p => ({ ...p, description: desc }));
      }
      setIsGenerating(false);
  };
  
  const handleGeneratePost = async (product: Product) => {
    if (!product.name || !product.price) return;
    setIsGenerating(true);
    const post = await generateSocialMediaPost(product.name, product.description || '', product.price);
    setGeneratedPost(post);
    setShowPostModal(true);
    setIsGenerating(false);
  };

   const handleSync = async () => {
    if (!settings.integration || settings.integration.platform !== 'wuilt' || !settings.integration.apiKey) {
      setSyncStatus({ type: 'error', message: 'بيانات الربط مع Wuilt غير مكتملة. يرجى التحقق من مفتاح API في الإعدادات.' });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ type: 'idle', message: null });
    try {
      const productsFromWuilt = await fetchWuiltProducts(settings.integration.apiKey);
      setSettings({ ...settings, products: productsFromWuilt });
      
      const now = new Date();
      setLastSync(now);
      localStorage.setItem('lastProductSync', now.toISOString());

      setSyncStatus({ type: 'success', message: `تمت المزامنة بنجاح! تم تحديث ${productsFromWuilt.length} منتج.` });

      setTimeout(() => {
        setSyncStatus(s => s.type === 'success' ? { ...s, type: 'idle' } : s);
      }, 5000);
    } catch (error: any) {
      setSyncStatus({ type: 'error', message: error.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'الاسم', 'السعر', 'التكلفة', 'الوزن', 'الكمية', 'الوصف'];
    const rows = filteredProducts.map(p => [
        p.sku,
        p.name,
        p.price,
        p.costPrice,
        p.weight,
        p.stockQuantity,
        `"${(p.description || '').replace(/"/g, '""')}"` // Escape quotes
    ]);

    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `products_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const text = event.target?.result as string;
            const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
            if (rows.length < 2) {
                alert('الملف فارغ أو لا يحتوي على بيانات.');
                return;
            }

            const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
            
            // Map headers to keys
            const mapKeys: Record<string, string> = {};
            headers.forEach((h, index) => {
                if (['sku', 'كود', 'code'].includes(h)) mapKeys['sku'] = index.toString();
                else if (['name', 'الاسم', 'title', 'product'].includes(h)) mapKeys['name'] = index.toString();
                else if (['price', 'السعر', 'selling price'].includes(h)) mapKeys['price'] = index.toString();
                else if (['cost', 'التكلفة', 'cost price'].includes(h)) mapKeys['costPrice'] = index.toString();
                else if (['stock', 'quantity', 'الكمية', 'المخزون'].includes(h)) mapKeys['stockQuantity'] = index.toString();
                else if (['weight', 'الوزن'].includes(h)) mapKeys['weight'] = index.toString();
                else if (['description', 'الوصف'].includes(h)) mapKeys['description'] = index.toString();
            });

            if (!mapKeys['name'] || !mapKeys['price']) {
                alert('الملف يجب أن يحتوي على عمودي "الاسم" و "السعر" على الأقل.');
                return;
            }

            const newProducts: Product[] = [];
            
            // Process rows
            for (let i = 1; i < rows.length; i++) {
                // Simple CSV parser that handles quotes roughly
                const row = rows[i];
                // Matches values in quotes or standard comma separated
                const cells = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
                
                const cleanCell = (idx: string) => {
                    const val = cells[parseInt(idx)];
                    return val ? val.replace(/^"|"$/g, '').trim() : '';
                };

                if (cells.length < headers.length) continue;

                const name = cleanCell(mapKeys['name']);
                if (!name) continue;

                newProducts.push({
                    id: `imported-${Date.now()}-${i}`,
                    sku: mapKeys['sku'] ? cleanCell(mapKeys['sku']) : `SKU-${Date.now()}-${i}`,
                    name: name,
                    price: parseFloat(cleanCell(mapKeys['price'])) || 0,
                    costPrice: mapKeys['costPrice'] ? (parseFloat(cleanCell(mapKeys['costPrice'])) || 0) : 0,
                    stockQuantity: mapKeys['stockQuantity'] ? (parseInt(cleanCell(mapKeys['stockQuantity'])) || 0) : 0,
                    weight: mapKeys['weight'] ? (parseFloat(cleanCell(mapKeys['weight'])) || 1) : 1,
                    description: mapKeys['description'] ? cleanCell(mapKeys['description']) : '',
                    hasVariants: false,
                    options: [],
                    variants: [],
                    inStock: true
                });
            }

            if (newProducts.length > 0) {
                setSettings({ ...settings, products: [...settings.products, ...newProducts] });
                alert(`تم استيراد ${newProducts.length} منتج بنجاح.`);
            } else {
                alert('لم يتم العثور على منتجات صالحة للاستيراد.');
            }

        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء قراءة الملف. تأكد من أنه ملف CSV صالح.');
        } finally {
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };

  const openAddModal = () => {
    setNewProduct({ sku: '', name: '', price: 0, weight: 1, costPrice: 0, stockQuantity: 10, collectionId: '', description: '', images: [], hasVariants: false, options: [], variants: [], useProfitPercentage: false, profitPercentage: 0 });
    setIsAdding(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
  };
  
  const closeModal = () => {
      setIsAdding(false);
      setEditingProduct(null);
  };


  return (
    <motion.div
      className="space-y-6 text-right pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Package size={24} />
          </div>
          <h2 className="text-xl font-bold dark:text-white">قائمة المنتجات</h2>
        </div>
        <div className="flex gap-2">
            <input type="file" ref={importInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
            <button onClick={() => importInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                <FileUp size={16} /> استيراد
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                <Download size={16} /> تصدير
            </button>
            {isPlatformConnected ? (
            <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-100 dark:shadow-none active:scale-95 disabled:bg-slate-400 disabled:cursor-wait"
            >
                <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'جاري المزامنة...' : `مزامنة المنتجات`}
            </button>
            ) : (
            <button 
                onClick={openAddModal}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95"
            >
                <Plus size={20} />
                إضافة منتج جديد
            </button>
            )}
        </div>
      </motion.div>

      {/* ... (Existing sync status messages) ... */}

      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors relative">
         {isSyncing && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-20 flex flex-col items-center justify-center gap-4 backdrop-blur-sm animate-in fade-in duration-200">
                <RefreshCw size={40} className="animate-spin text-indigo-500" />
                <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">جاري تحديث قائمة المنتجات من Wuilt...</p>
                <p className="text-sm text-slate-500">قد يستغرق هذا بضع لحظات</p>
            </div>
        )}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث بالاسم أو SKU..."
              className="w-full pr-10 pl-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-semibold border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4">المنتج</th>
                <th className="px-6 py-4">القسم</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">المخزون</th>
                <th className="px-6 py-4">سعر البيع</th>
                <th className="px-6 py-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-600">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={40} className="text-slate-200 dark:text-slate-700" />
                      <p>لا توجد منتجات. قم بإضافتها يدوياً أو قم بالمزامنة من منصة متصلة.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const collection = settings.collections.find(c => c.id === product.collectionId);
                  return (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-2">
                      {product.thumbnail ? (
                        <img src={product.thumbnail} alt={product.name} className="w-12 h-12 rounded-lg object-cover border-2 border-slate-100 dark:border-slate-700" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{product.name}</div>
                      {product.hasVariants && <div className="text-xs text-slate-400">{product.variants.length} متغيرات</div>}
                    </td>
                    <td className="px-6 py-4">
                      {collection ? (
                          <span className="text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">{collection.name}</span>
                      ) : (
                          <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 w-fit px-2 py-1 rounded">
                        <Barcode size={14} />
                        {product.sku}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.stockQuantity > 0 ? (
                         <div className="flex items-center gap-2">
                             <span className="font-bold text-slate-700 dark:text-slate-300">{product.stockQuantity}</span>
                             {product.stockQuantity < 5 && <span className="text-[10px] text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-bold">منخفض</span>}
                         </div>
                      ) : (
                         <span className="px-2 py-1 text-xs font-bold text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/50 rounded-full">نفذ</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-indigo-600 dark:text-indigo-400 font-bold">{product.price.toLocaleString()} ج.م</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <button onClick={() => handleGeneratePost(product)} disabled={isGenerating} className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all" title="إنشاء منشور تسويقي">
                          <Wand2 size={18} />
                        </button>
                        <button 
                          onClick={() => openEditModal(product)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => setProductToDelete(product)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {(isAdding || editingProduct) && (
        <ProductFormModal 
            isOpen={isAdding || !!editingProduct}
            onClose={closeModal}
            onSave={handleSaveProduct}
            productData={editingProduct || newProduct}
            setProductData={editingProduct ? setEditingProduct : setNewProduct}
            settings={settings}
            isEditing={!!editingProduct}
            onGenerateDescription={handleGenerateDescription}
            isGenerating={isGenerating}
        />
      )}

      {/* ... (Post and Delete modals remain the same) ... */}
    </motion.div>
  );
};


// ... (Existing helper components)

export default ProductsPage;

// --- New/Updated Component: ProductFormModal ---

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    productData: Partial<Product>;
    setProductData: React.Dispatch<React.SetStateAction<any>>;
    settings: Settings;
    isEditing: boolean;
    onGenerateDescription: (isEdit: boolean) => void;
    isGenerating: boolean;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, productData, setProductData, settings, isEditing, onGenerateDescription, isGenerating }) => {
    
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (productData.useProfitPercentage) {
            const price = productData.price || 0;
            const percentage = productData.profitPercentage || 0;
            const newCost = price * (1 - (percentage / 100));
            if (newCost !== productData.costPrice) {
                setProductData((prev: Product) => ({ ...prev, costPrice: newCost }));
            }
        }
    }, [productData.price, productData.profitPercentage, productData.useProfitPercentage, setProductData]);

    const updateField = (field: keyof Product, value: any) => {
        setProductData((prev: Product) => ({ ...prev, [field]: value }));
    };

    const handleImagesChange = (val: string) => {
      const urls = val.split(/[\n,]/).map(url => url.trim()).filter(url => url !== '');
      updateField('images', urls);
    };

    const handleVariantToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const hasVariants = e.target.checked;
        setProductData((prev: Product) => ({ 
            ...prev, 
            hasVariants,
            options: hasVariants ? prev.options : [],
            variants: hasVariants ? prev.variants : [],
        }));
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'thumbnail' | 'images') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            if (target === 'thumbnail') {
                const file = files[0];
                const base64 = await convertToBase64(file);
                updateField('thumbnail', base64);
            } else {
                const newImages: string[] = [];
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const base64 = await convertToBase64(file);
                    newImages.push(base64);
                }
                updateField('images', [...(productData.images || []), ...newImages]);
            }
        } catch (error) {
            console.error("File upload error:", error);
            alert("حدث خطأ أثناء رفع الصورة.");
        } finally {
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl font-bold dark:text-white">{isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <XCircle size={24} className="text-slate-400 dark:text-slate-600" />
              </button>
            </div>
            <form onSubmit={onSave} id="product-form" className="flex-1 overflow-y-auto">
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Left Column: Basic Info */}
                  <div className="space-y-4">
                      <FormInput label="اسم المنتج" icon={<Package size={16}/>} value={productData.name || ''} onChange={e => updateField('name', e.target.value)} required />
                      <div className="grid grid-cols-2 gap-4">
                          <FormInput label="SKU" icon={<Barcode size={16}/>} value={productData.sku || ''} onChange={e => updateField('sku', e.target.value)} required />
                          <FormInput label="القسم" icon={<Grid3x3 size={16}/>} value={productData.collectionId || ''} onChange={e => updateField('collectionId', e.target.value)} as="select">
                              <option value="">بدون قسم</option>
                              {settings.collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </FormInput>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="font-bold text-slate-700 dark:text-slate-300">هذا المنتج له متغيرات (مقاس، لون...)</span>
                            <input type="checkbox" checked={productData.hasVariants} onChange={handleVariantToggle} className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500" />
                        </label>
                      </div>
                  </div>

                  {/* Right Column: Images & Description */}
                  <div className="space-y-4">
                      <input 
                          type="file" 
                          ref={thumbnailInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => handleFileUpload(e, 'thumbnail')} 
                      />
                      <FormInput 
                          label="رابط الصورة الرئيسية" 
                          icon={<ImageIcon size={16}/>} 
                          value={productData.thumbnail || ''} 
                          onChange={e => updateField('thumbnail', e.target.value)} 
                          placeholder="https://..." 
                          actionButton={
                              <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="text-xs flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-lg font-bold hover:bg-indigo-200 transition-colors">
                                  <Upload size={12}/> رفع صورة
                              </button>
                          }
                      />

                      <input 
                          type="file" 
                          ref={galleryInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          multiple
                          onChange={(e) => handleFileUpload(e, 'images')} 
                      />
                      <FormInput 
                          as="textarea" 
                          label="صور المعرض (رابط في كل سطر)" 
                          icon={<Layers size={16}/>} 
                          value={(productData.images || []).join('\n')} 
                          onChange={e => handleImagesChange(e.target.value)} 
                          placeholder="https://image1.com&#10;https://image2.com" 
                          className="h-24"
                          actionButton={
                              <button type="button" onClick={() => galleryInputRef.current?.click()} className="text-xs flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-lg font-bold hover:bg-indigo-200 transition-colors">
                                  <Upload size={12}/> رفع صور متعددة
                              </button>
                          }
                      />
                  </div>
                  
                  {/* Full Width Section: Pricing & Description */}
                   <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">التسعير والربح</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput label="سعر البيع (ج.م)" icon={<DollarSign size={16}/>} type="number" value={productData.price || ''} onChange={e => updateField('price', Number(e.target.value))} disabled={productData.hasVariants} />
                                    <FormInput label="الوزن (كجم)" icon={<Scale size={16}/>} type="number" value={productData.weight || ''} onChange={e => updateField('weight', Number(e.target.value))} />
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">حساب الربح بالنسبة المئوية</span>
                                        <input type="checkbox" checked={productData.useProfitPercentage} onChange={e => updateField('useProfitPercentage', e.target.checked)} className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500" />
                                    </label>
                                    {productData.useProfitPercentage && (
                                        <div className="mt-4 animate-in fade-in duration-300">
                                            <FormInput label="نسبة الربح %" icon={<Percent size={16}/>} type="number" value={productData.profitPercentage || ''} onChange={e => updateField('profitPercentage', Number(e.target.value))} />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput label="التكلفة (ج.م)" icon={<Wallet size={16}/>} type="number" value={productData.costPrice?.toFixed(2) || '0.00'} onChange={e => updateField('costPrice', Number(e.target.value))} disabled={productData.useProfitPercentage} readOnly={productData.useProfitPercentage} />
                                    <FormInput label="الكمية" icon={<Package size={16}/>} type="number" value={productData.hasVariants ? productData.variants?.reduce((s,v)=>s+v.stockQuantity,0) : productData.stockQuantity || ''} onChange={e => updateField('stockQuantity', Number(e.target.value))} disabled={productData.hasVariants} />
                                </div>
                            </div>
                        </div>
                    </div>

                  <div className="lg:col-span-2">
                       <FormInput as="textarea" label="وصف المنتج" icon={<FileText size={16}/>} value={productData.description || ''} onChange={e => updateField('description', e.target.value)} className="h-32" actionButton={
                           <button type="button" onClick={() => onGenerateDescription(isEditing)} disabled={isGenerating} className="text-xs flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-lg font-bold">
                               {isGenerating ? <RefreshCw size={12} className="animate-spin"/> : <Wand2 size={12}/>}
                               توليد وصف
                           </button>
                       } />
                  </div>

                  {productData.hasVariants && (
                      <div className="lg:col-span-2">
                          <VariantManager productData={productData} setProductData={setProductData} settings={settings} />
                      </div>
                  )}

              </div>
            </form>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-800 flex justify-end gap-3 flex-shrink-0">
                <button type="button" onClick={onClose} className="px-6 py-2.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-xl font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all">إلغاء</button>
                <button type="submit" form="product-form" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none"><Save size={18} /> {isEditing ? 'تحديث المنتج' : 'حفظ المنتج'}</button>
            </div>
          </div>
        </div>
    );
};


const VariantManager = ({ productData, setProductData, settings }: any) => {
    
    const handleOptionToggle = (optionName: string, isChecked: boolean) => {
        const currentOptions = productData.options || [];
        const newOptions = isChecked ? [...currentOptions, optionName] : currentOptions.filter((o: string) => o !== optionName);
        setProductData((prev: Product) => ({ ...prev, options: newOptions }));
    };

    const generateVariants = () => {
        const selectedGlobalOptions = (settings.globalOptions || []).filter((go: any) => (productData.options || []).includes(go.name));
        if (selectedGlobalOptions.length === 0) return;

        const valueArrays = selectedGlobalOptions.map((go: any) => go.values);
        
        const cartesian = (...a: any[]) => a.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())));
        
        const combinations = cartesian(...valueArrays);
        
        const newVariants: ProductVariant[] = combinations.map((combo: string | string[], index: number) => {
            const comboArray = Array.isArray(combo) ? combo : [combo];
            const options: { [key: string]: string } = {};
            selectedGlobalOptions.forEach((opt: any, i: number) => {
                options[opt.name] = comboArray[i];
            });

            // Try to find an existing variant to preserve data
            const existingVariant = (productData.variants || []).find((v: any) => {
                return JSON.stringify(v.options) === JSON.stringify(options);
            });

            return {
                id: existingVariant?.id || `${Date.now()}-${index}`,
                options: options,
                sku: existingVariant?.sku || `${productData.sku || 'SKU'}-${comboArray.join('-')}`,
                price: existingVariant?.price || productData.price || 0,
                stockQuantity: existingVariant?.stockQuantity || 0,
            };
        });

        setProductData((prev: Product) => ({ ...prev, variants: newVariants }));
    };

    const updateVariant = (variantId: string, field: keyof ProductVariant, value: string | number) => {
        const updatedVariants = productData.variants.map((v: ProductVariant) => {
            if (v.id === variantId) {
                return { ...v, [field]: value };
            }
            return v;
        });
        setProductData((prev: Product) => ({ ...prev, variants: updatedVariants }));
    };

    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-lg mb-4">إدارة المتغيرات</h4>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 block">1. اختر الخيارات</label>
                    <div className="flex flex-wrap gap-3">
                        {(settings.globalOptions || []).map((opt: any) => (
                            <label key={opt.id} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                                <input type="checkbox" checked={(productData.options || []).includes(opt.name)} onChange={e => handleOptionToggle(opt.name, e.target.checked)} className="rounded text-indigo-500"/>
                                <span className="text-sm font-bold">{opt.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <button type="button" onClick={generateVariants} disabled={(productData.options || []).length === 0} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:bg-slate-400">
                    <ChevronsUpDown size={16}/> 2. توليد المتغيرات
                </button>
                {(productData.variants || []).length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                         <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 block">3. أدخل بيانات المتغيرات</label>
                        {productData.variants.map((variant: ProductVariant) => (
                            <div key={variant.id} className="grid grid-cols-4 gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="text-sm font-bold truncate">{Object.values(variant.options).join(' / ')}</div>
                                <input type="text" value={variant.sku} onChange={e => updateVariant(variant.id, 'sku', e.target.value)} placeholder="SKU" className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-700 rounded"/>
                                <input type="number" value={variant.price} onChange={e => updateVariant(variant.id, 'price', Number(e.target.value))} placeholder="السعر" className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-700 rounded"/>
                                <input type="number" value={variant.stockQuantity} onChange={e => updateVariant(variant.id, 'stockQuantity', Number(e.target.value))} placeholder="الكمية" className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-700 rounded"/>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const FormInput = ({ label, icon, as = 'input', actionButton, ...props }: any) => {
    const Component = as;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-400 flex items-center gap-2">{icon} {label}</label>
                {actionButton}
            </div>
            <Component {...props} className={`block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:text-white transition-all disabled:bg-slate-200 dark:disabled:bg-slate-700/50 ${props.className || ''}`} />
        </div>
    );
};
