




import { supabase } from './supabaseClient';
import { Store, StoreData, User, Product, Order, Transaction, Supplier, SupplyOrder, Review, AbandonedCart, ActivityLog, Employee, DiscountCode, Collection, CustomPage, PaymentMethod, CustomerProfile, GlobalOption, ShippingCarrierIntegration } from '../types';
import { INITIAL_SETTINGS } from '../constants';

const LOCAL_STORAGE_PREFIX = 'wuilt_backup_';

// --- Local Storage Helpers (Backup) ---
const getLocal = (key: string) => {
    try {
        const item = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error('LocalStorage read error', e);
        return null;
    }
};

const saveLocal = (key: string, data: any) => {
    try {
        if (key !== 'global' && data && data.settings) {
            // It's a store data object. Let's make it lighter for backup to avoid quota errors.
            const liteData = {
                ...data,
                settings: {
                    ...data.settings,
                    // Replace large, non-critical arrays with empty ones for the local backup.
                    // The primary source of truth is the database.
                    products: [],
                    supplyOrders: [],
                    reviews: [],
                    abandonedCarts: [],
                    activityLogs: [],
                },
                // Also, truncate transactional data for local backup
                orders: data.orders ? data.orders.slice(0, 50) : [],
                wallet: data.wallet ? {
                    ...data.wallet,
                    transactions: data.wallet.transactions ? data.wallet.transactions.slice(0, 100) : []
                } : { balance: 0, transactions: [] },
                customers: data.customers ? data.customers.slice(0, 100) : []
            };

            localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(liteData));

        } else {
            // For global data (users, etc.), save it completely as it's usually small.
            localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(data));
        }
    } catch (e) {
        // If it still fails, log a warning. The app can function without local backup.
        console.warn(`LocalStorage backup for '${key}' failed, likely due to storage limits. The app will continue, relying on the primary database.`, e);
    }
};

export const checkSupabaseConnection = async (): Promise<boolean> => {
    try {
        const { error } = await supabase.from('stores_data').select('id').limit(1);
        return !error;
    } catch (e) {
        return false;
    }
};

/**
 * Ensures a parent record for the store exists in the `stores_data` table.
 * This is crucial to call before any operation that has a foreign key constraint on `stores_data`.
 */
export const ensureStoreRecordExists = async (storeId: string, storeName: string): Promise<{ success: boolean, error?: string }> => {
    try {
        const { error } = await supabase
            .from('stores_data')
            .upsert({ id: storeId, name: storeName }, { onConflict: 'id' });
        if (error) throw error;
        console.log(`Ensured store record exists for ${storeId}`);
        return { success: true };
    } catch (err: any) {
        console.error("Failed to ensure store record exists:", err);
        return { success: false, error: err.message };
    }
};

// --- Relational Data Functions ---

export const getStoreData = async (storeId: string): Promise<StoreData | null> => {
    try {
        // Parallel Fetching for ALL 17 Tables
        const [
            storeRes,
            productsRes,
            ordersRes,
            transactionsRes,
            suppliersRes,
            supplyOrdersRes,
            reviewsRes,
            abandonedCartsRes,
            activityLogsRes,
            employeesRes,
            discountsRes,
            collectionsRes,
            pagesRes,
            paymentMethodsRes,
            customersRes,
            globalOptionsRes,
            shippingIntRes
        ] = await Promise.all([
            supabase.from('stores_data').select('settings, name').eq('id', storeId).single(),
            supabase.from('products').select('*').eq('store_id', storeId),
            supabase.from('orders').select('*').eq('store_id', storeId),
            supabase.from('transactions').select('*').eq('store_id', storeId),
            supabase.from('suppliers').select('*').eq('store_id', storeId),
            supabase.from('supply_orders').select('*').eq('store_id', storeId),
            supabase.from('reviews').select('*').eq('store_id', storeId),
            supabase.from('abandoned_carts').select('*').eq('store_id', storeId),
            supabase.from('activity_logs').select('*').eq('store_id', storeId),
            supabase.from('employees').select('*').eq('store_id', storeId),
            supabase.from('discount_codes').select('*').eq('store_id', storeId),
            supabase.from('collections').select('*').eq('store_id', storeId),
            supabase.from('custom_pages').select('*').eq('store_id', storeId),
            supabase.from('payment_methods').select('*').eq('store_id', storeId),
            supabase.from('customers').select('*').eq('store_id', storeId),
            supabase.from('global_options').select('*').eq('store_id', storeId),
            supabase.from('shipping_integrations').select('*').eq('store_id', storeId)
        ]);

        if (storeRes.error || !storeRes.data) {
            console.log(`Store ${storeId} not found in relational DB, trying legacy...`);
            const legacyData = await fetchLegacyDocument(storeId);
            // Also check legacy data for products
            if (legacyData && (!legacyData.settings.products || legacyData.settings.products.length === 0) && INITIAL_SETTINGS.products.length > 0) {
                console.log(`No products found in legacy data for store ${storeId}. Seeding from initial settings.`);
                legacyData.settings.products = INITIAL_SETTINGS.products;
            }
            return legacyData;
        }

        // --- Reconstruct Data Types ---

        let products: Product[] = (productsRes.data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            price: p.price,
            stockQuantity: p.stock_quantity,
            ...p.details
        }));
        
        // If no products are found in the database, seed them from the initial settings.
        // This acts as a one-time migration for existing stores.
        if (products.length === 0 && INITIAL_SETTINGS.products.length > 0) {
            console.log(`No products found in DB for store ${storeId}. Seeding from initial settings.`);
            products = INITIAL_SETTINGS.products;
        }

        const orders: Order[] = (ordersRes.data || []).map((o: any) => ({
            id: o.id,
            orderNumber: o.order_number,
            customerName: o.customer_name,
            status: o.status,
            date: o.date,
            total_price: o.total_price,
            ...o.details
        }));

        const transactions: Transaction[] = (transactionsRes.data || []).map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            date: t.date ? new Date(t.date).toLocaleString('ar-EG') : '',
            category: t.category,
            note: t.note,
            ...t.details
        }));

        const suppliers: Supplier[] = (suppliersRes.data || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            phone: s.phone,
            address: s.address,
            notes: s.notes
        }));

        const supplyOrders: SupplyOrder[] = (supplyOrdersRes.data || []).map((s: any) => ({
            id: s.id,
            supplierId: s.supplier_id,
            totalCost: s.total_cost,
            date: s.date ? new Date(s.date).toLocaleDateString('ar-EG') : '',
            items: s.items,
            status: s.status
        }));

        const reviews: Review[] = (reviewsRes.data || []).map((r: any) => ({
            id: r.id,
            productId: r.product_id,
            customerName: r.customer_name,
            rating: r.rating,
            comment: r.comment,
            status: r.status,
            date: r.date
        }));

        const abandonedCarts: AbandonedCart[] = (abandonedCartsRes.data || []).map((c: any) => ({
            id: c.id,
            customerName: c.customer_name,
            customerPhone: c.customer_phone,
            totalValue: c.total_value,
            date: c.date,
            items: c.items
        }));

        const activityLogs: ActivityLog[] = (activityLogsRes.data || []).map((l: any) => ({
            id: l.id,
            user: l.user,
            action: l.action,
            details: l.details,
            timestamp: l.timestamp,
            date: l.date
        }));

        const employees: Employee[] = (employeesRes.data || []).map((e: any) => ({
            id: e.id,
            name: e.name,
            email: e.email,
            permissions: e.permissions,
            status: e.status
        }));

        const discountCodes: DiscountCode[] = (discountsRes.data || []).map((d: any) => ({
            id: d.id,
            code: d.code,
            type: d.type,
            value: d.value,
            active: d.active,
            usageCount: d.usage_count
        }));

        const collections: Collection[] = (collectionsRes.data || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            image: c.image
        }));

        const customPages: CustomPage[] = (pagesRes.data || []).map((p: any) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            content: p.content,
            isActive: p.is_active
        }));

        const paymentMethods: PaymentMethod[] = (paymentMethodsRes.data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            details: p.details,
            instructions: p.instructions,
            type: p.type,
            active: p.active,
            logoUrl: p.logo_url
        }));

        const customers: CustomerProfile[] = (customersRes.data || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            address: c.address,
            loyaltyPoints: c.loyalty_points,
            totalSpent: c.total_spent,
            firstOrderDate: c.first_order_date,
            lastOrderDate: c.last_order_date,
            notes: c.notes,
            // derived fields for UI
            totalOrders: c.orders_count || 0,
            successfulOrders: 0, // Should be recalculated from orders if critical
            returnedOrders: 0,
            averageOrderValue: (c.orders_count || 0) > 0 ? c.total_spent / c.orders_count : 0
        }));

        const globalOptions: GlobalOption[] = (globalOptionsRes.data || []).map((g: any) => ({
            id: g.id,
            name: g.name,
            values: g.values || []
        }));

        const shippingIntegrations: ShippingCarrierIntegration[] = (shippingIntRes.data || []).map((s: any) => ({
            id: s.id,
            provider: s.provider,
            apiKey: s.api_key,
            apiSecret: s.api_secret,
            accountNumber: s.account_number,
            isConnected: s.is_connected
        }));

        const fullData: StoreData = {
            settings: {
                ...storeRes.data.settings,
                products: products,
                suppliers: suppliers,
                supplyOrders: supplyOrders,
                reviews: reviews,
                abandonedCarts: abandonedCarts,
                activityLogs: activityLogs,
                employees: employees,
                discountCodes: discountCodes,
                collections: collections,
                customPages: customPages,
                paymentMethods: paymentMethods,
                globalOptions: globalOptions,
                shippingIntegrations: shippingIntegrations
            },
            orders: orders,
            wallet: { 
                balance: 0,
                transactions: transactions 
            },
            cart: [],
            customers: customers
        };

        saveLocal(storeId, fullData);
        return fullData;

    } catch (err) {
        console.error("Error loading relational data:", err);
        const localData = getLocal(storeId);
        // Also check local storage data for products
        if (localData && (!localData.settings.products || localData.settings.products.length === 0) && INITIAL_SETTINGS.products.length > 0) {
            console.log(`No products found in local backup for store ${storeId}. Seeding from initial settings.`);
            localData.settings.products = INITIAL_SETTINGS.products;
        }
        return localData;
    }
};

export const saveStoreData = async (store: Store, data: StoreData): Promise<{ success: boolean, error?: string }> => {
    saveLocal(store.id, data);

    try {
        console.log("Starting Full Relational Save (17 Tables)...");

        // 1. Separate Arrays from Settings
        const { 
            products, suppliers, supplyOrders, reviews, abandonedCarts, activityLogs,
            employees, discountCodes, collections, customPages, paymentMethods,
            globalOptions, shippingIntegrations,
            ...cleanSettings 
        } = data.settings;

        // 2. Save Main Store Data (including metadata)
        const { error: storeError } = await supabase
            .from('stores_data')
            .upsert({ 
                id: store.id,
                name: store.name,
                specialization: store.specialization,
                language: store.language,
                currency: store.currency,
                url: store.url,
                creation_date: store.creationDate,
                settings: cleanSettings 
            }, { onConflict: 'id' });

        if (storeError) throw storeError;

        // 3. Helper to save array data
        const saveArray = async (table: string, payload: any[]) => {
            if (payload && payload.length > 0) {
                // CRITICAL FIX: Deduplicate payload based on ID to prevent Postgres error:
                // "ON CONFLICT DO UPDATE command cannot affect row a second time"
                // Using String(item.id) ensures robust uniqueness even if types vary (number vs string)
                const uniquePayload = Array.from(new Map(payload.map(item => [String(item.id), item])).values());

                if (uniquePayload.length === 0) return;

                const { error } = await supabase.from(table).upsert(uniquePayload, { onConflict: 'id' });
                if (error) throw new Error(`${table} save failed: ${error.message}`);
            }
        };

        // 4. Prepare Payloads
        const productsPayload = products?.map(p => {
            const details: any = { 
                weight: p.weight, costPrice: p.costPrice, thumbnail: p.thumbnail, images: p.images, description: p.description,
                hasVariants: p.hasVariants, options: p.options, variants: p.variants, collectionId: p.collectionId,
                inStock: p.inStock, useProfitPercentage: p.useProfitPercentage, profitPercentage: p.profitPercentage
            };
            
            // CRITICAL FIX: Strip base64 image data to prevent "Failed to fetch" on large payloads.
            if (details.thumbnail && typeof details.thumbnail === 'string' && details.thumbnail.startsWith('data:image')) {
                details.thumbnail = '';
            }
            if (details.images && Array.isArray(details.images)) {
                details.images = details.images.filter((img: any) => typeof img === 'string' && !img.startsWith('data:image'));
            }

            return {
                id: p.id, store_id: store.id, name: p.name, sku: p.sku || 'N/A', price: p.price || 0, stock_quantity: p.stockQuantity || 0,
                details: details
            };
        }) || [];

        const ordersPayload = data.orders?.map(o => ({
            id: o.id, store_id: store.id, order_number: o.orderNumber, customer_name: o.customerName, status: o.status,
            total_price: (o.productPrice + o.shippingFee - (o.discount || 0)), date: o.date,
            details: { 
                items: o.items, customerPhone: o.customerPhone, customerAddress: o.customerAddress, shippingCompany: o.shippingCompany,
                shippingArea: o.shippingArea, shippingFee: o.shippingFee, productPrice: o.productPrice, productCost: o.productCost,
                weight: o.weight, discount: o.discount, paymentStatus: o.paymentStatus, preparationStatus: o.preparationStatus,
                notes: o.notes, waybillNumber: o.waybillNumber, includeInspectionFee: o.includeInspectionFee, isInsured: o.isInsured,
                productName: o.productName, confirmationLogs: o.confirmationLogs
            }
        })) || [];

        const transactionsPayload = data.wallet.transactions?.map(t => ({
            id: t.id, store_id: store.id, type: t.type, amount: t.amount, date: t.date ? parseDate(t.date) : new Date(), category: t.category, note: t.note, details: {}
        })) || [];

        const suppliersPayload = suppliers?.map(s => ({ id: s.id, store_id: store.id, name: s.name, phone: s.phone, address: s.address, notes: s.notes })) || [];
        const supplyOrdersPayload = supplyOrders?.map(s => ({ id: s.id, store_id: store.id, supplier_id: s.supplierId, total_cost: s.totalCost, date: s.date ? parseDate(s.date) : new Date(), items: s.items, status: s.status })) || [];
        const reviewsPayload = reviews?.map(r => ({ id: r.id, store_id: store.id, product_id: r.productId, customer_name: r.customerName, rating: r.rating, comment: r.comment, status: r.status, date: r.date })) || [];
        const abandonedCartsPayload = abandonedCarts?.map(c => ({ id: c.id, store_id: store.id, customer_name: c.customerName, customer_phone: c.customerPhone, total_value: c.totalValue, date: c.date, items: c.items })) || [];
        const activityLogsPayload = activityLogs?.map(l => ({ id: l.id, store_id: store.id, user: l.user, action: l.action, details: l.details, timestamp: l.timestamp, date: l.date })) || [];
        
        const employeesPayload = employees?.map(e => ({ id: e.id, store_id: store.id, name: e.name, email: e.email, phone: e.id, permissions: e.permissions, status: e.status })) || [];
        const discountsPayload = discountCodes?.map(d => ({ id: d.id, store_id: store.id, code: d.code, type: d.type, value: d.value, active: d.active, usage_count: d.usageCount })) || [];
        const collectionsPayload = collections?.map(c => ({ id: c.id, store_id: store.id, name: c.name, description: c.description, image: c.image })) || [];
        const pagesPayload = customPages?.map(p => ({ id: p.id, store_id: store.id, title: p.title, slug: p.slug, content: p.content, is_active: p.isActive })) || [];
        const paymentMethodsPayload = paymentMethods?.map(p => ({ id: p.id, store_id: store.id, name: p.name, details: p.details, instructions: p.instructions, type: p.type, active: p.active, logo_url: p.logoUrl })) || [];
        
        const globalOptionsPayload = globalOptions?.map(g => ({ id: g.id, store_id: store.id, name: g.name, values: g.values })) || [];
        const shippingIntPayload = shippingIntegrations?.map(s => ({ id: s.id, store_id: store.id, provider: s.provider, api_key: s.apiKey, api_secret: s.apiSecret, account_number: s.accountNumber, is_connected: s.isConnected })) || [];

        // Save Customers from StoreData
        // FIX: Mapping 'totalOrders' from UI model to 'orders_count' in DB model
        const customersPayload = data.customers?.map(c => ({
            id: c.id,
            store_id: store.id,
            name: c.name,
            phone: c.phone,
            address: c.address,
            loyalty_points: c.loyaltyPoints,
            total_spent: c.totalSpent,
            orders_count: c.totalOrders || 0, 
            first_order_date: c.firstOrderDate,
            last_order_date: c.lastOrderDate,
            notes: c.notes
        })) || [];

        // 5. Execute Saves in Parallel
        await Promise.all([
            saveArray('products', productsPayload),
            saveArray('orders', ordersPayload),
            saveArray('transactions', transactionsPayload),
            saveArray('suppliers', suppliersPayload),
            saveArray('supply_orders', supplyOrdersPayload),
            saveArray('reviews', reviewsPayload),
            saveArray('abandoned_carts', abandonedCartsPayload),
            saveArray('activity_logs', activityLogsPayload),
            saveArray('employees', employeesPayload),
            saveArray('discount_codes', discountsPayload),
            saveArray('collections', collectionsPayload),
            saveArray('custom_pages', pagesPayload),
            saveArray('payment_methods', paymentMethodsPayload),
            saveArray('customers', customersPayload),
            saveArray('global_options', globalOptionsPayload),
            saveArray('shipping_integrations', shippingIntPayload)
        ]);

        return { success: true };

    } catch (err: any) {
        console.error("CRITICAL SAVE ERROR:", err);
        await saveDocumentLegacy(store.id, data);
        
        let friendlyError = err.message;
        if (err.message?.includes('schema cache') || err.message?.includes('Could not find')) {
            friendlyError = "الجداول غير موجودة. يرجى تشغيل كود SQL المرفق.";
        }
        
        return { success: false, error: friendlyError };
    }
};

export const clearStoreData = async (storeId: string, targets: string[] = []): Promise<{ success: boolean, error?: string }> => {
    try {
        console.log(`Starting Data Wipe for store: ${storeId}`, targets);
        
        // Define groups of tables
        const groups: Record<string, string[]> = {
            'orders': ['orders', 'abandoned_carts'],
            'products': ['products', 'reviews', 'supply_orders', 'collections'],
            'customers': ['customers'],
            'wallet': ['transactions'],
            'activity': ['activity_logs'],
            'settings': ['discount_codes', 'global_options']
        };

        // Determine tables to clear based on selected targets
        let tablesToClear: string[] = [];
        
        if (targets.length === 0 || targets.includes('all')) {
            // Clear all transactional tables if 'all' is selected or no target specified (legacy behavior)
            tablesToClear = Object.values(groups).flat();
        } else {
            targets.forEach(target => {
                if (groups[target]) {
                    tablesToClear = [...tablesToClear, ...groups[target]];
                }
            });
        }

        // Remove duplicates
        tablesToClear = [...new Set(tablesToClear)];

        if (tablesToClear.length === 0) return { success: true };

        // Execute deletes in parallel
        await Promise.all(tablesToClear.map(table => 
            supabase.from(table).delete().eq('store_id', storeId)
        ));

        // Note: Legacy local storage wipe is skipped for partial deletes to avoid inconsistency,
        // expecting a full reload from DB after this operation.

        return { success: true };
    } catch (err: any) {
        console.error("Wipe Error:", err);
        return { success: false, error: err.message };
    }
};

function parseDate(dateStr: string): Date {
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    return new Date(); 
}

// --- Global/User Data Functions ---

const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
        console.error("Error fetching users from relational table:", error);
        // Fallback to legacy
        const legacyData = await fetchLegacyDocument('global');
        return legacyData?.users || [];
    }
    // Map from db columns to User type
    return (data || []).map((u: any) => ({
        phone: u.phone,
        fullName: u.full_name,
        password: u.password,
        email: u.email,
        isAdmin: u.is_admin,
        isBanned: u.is_banned,
        joinDate: u.join_date,
        stores: u.stores || [],
        sites: u.sites || []
    }));
};

const saveUsers = async (users: User[]): Promise<{ success: boolean }> => {
    const payload = users.map(u => ({
        phone: u.phone,
        full_name: u.fullName,
        password: u.password,
        email: u.email,
        is_admin: u.isAdmin,
        is_banned: u.isBanned,
        join_date: u.joinDate,
        stores: u.stores || [],
        sites: u.sites || []
    }));

    const { error } = await supabase.from('users').upsert(payload, { onConflict: 'phone' });
    if (error) {
        console.error("Error saving users to relational table:", error);
        // Fallback to legacy
        await saveDocumentLegacy('global', { users });
        return { success: false };
    }
    return { success: true };
};

export const getGlobalData = async (): Promise<{ users: User[], loyaltyData: Record<string, number> }> => {
    const users = await getUsers();
    return { users: users || [], loyaltyData: {} };
};

export const saveGlobalData = async (data: { users: User[], loyaltyData: Record<string, number> }) => {
    saveLocal('global', data); // Keep local backup
    await saveUsers(data.users);
    // Note: loyaltyData is derived and doesn't need to be saved globally.
};

export const migrateAllLegacyDataToRelational = async (users: User[]): Promise<{ success: boolean, error?: string, summary: string }> => {
    try {
        console.log("Starting full legacy data migration...");
        // 1. Get all legacy documents
        const { data: documents, error: fetchError } = await supabase.from('documents').select('id, content');
        if (fetchError) throw fetchError;
        if (!documents) return { success: true, summary: "No legacy documents found.", error: undefined };

        let migratedStores = 0;
        let errors: string[] = [];

        const allStores: { store: Store, owner: User }[] = users.flatMap(u => u.stores?.map(s => ({ store: s, owner: u })) || []);

        for (const doc of documents) {
            if (doc.id === 'global' || !doc.content || !doc.content.settings) {
                console.log(`Skipping non-store document: ${doc.id}`);
                continue;
            }

            const storeData = doc.content as StoreData;
            const storeInfo = allStores.find(s => s.store.id === doc.id);

            if (storeInfo) {
                console.log(`Migrating store: ${storeInfo.store.name} (${storeInfo.store.id})`);
                const result = await saveStoreData(storeInfo.store, storeData);
                if (result.success) {
                    migratedStores++;
                } else {
                    const errorMsg = `Failed to migrate ${storeInfo.store.id}: ${result.error}`;
                    console.error(errorMsg);
                    errors.push(errorMsg);
                }
            } else {
                console.warn(`Could not find owner/store info for store ID: ${doc.id}. Skipping migration.`);
            }
        }

        const summary = `Migration complete. Migrated ${migratedStores} stores. Encountered ${errors.length} errors.`;
        console.log(summary);
        if (errors.length > 0) console.error("Migration errors:", errors);

        return { success: errors.length === 0, summary, error: errors.join('\n') };
    } catch (err: any) {
        console.error("Critical migration failure:", err);
        return { success: false, summary: "Migration failed.", error: err.message };
    }
};


const fetchLegacyDocument = async (key: string) => {
    try {
        const { data, error } = await supabase.from('documents').select('content').eq('id', key).single();
        if (!error && data) {
            saveLocal(key, data.content);
            return data.content;
        }
    } catch (e) {}
    return getLocal(key);
};

const saveDocumentLegacy = async (key: string, content: any) => {
    try {
        console.log(`Saving to legacy document: ${key}`);
        await supabase.from('documents').upsert({ id: key, content: content }, { onConflict: 'id' });
        return true;
    } catch (e) {
        return false;
    }
};