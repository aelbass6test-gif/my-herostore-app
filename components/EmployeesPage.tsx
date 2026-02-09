import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Employee, Permission, PERMISSIONS, User, Store } from '../types';
import { Users, UserPlus, UserCog, Trash2, XCircle, KeyRound, AlertCircle, Check, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  }
};


interface EmployeesPageProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  currentUser: User | null;
  users: User[];
  activeStoreId: string | null;
}

const PERMISSION_GROUPS: { title: string; permissions: { key: Permission, label: string }[] }[] = [
  { title: 'الأوردرات والتحكم', permissions: [ { key: 'ORDERS_VIEW', label: 'عرض الأوردرات فقط' }, { key: 'ORDERS_MANAGE', label: 'إدارة كاملة للأوردرات (إضافة، تعديل، حذف)' } ] },
  { title: 'المنتجات والمخزون', permissions: [ { key: 'PRODUCTS_VIEW', label: 'عرض المنتجات فقط' }, { key: 'PRODUCTS_MANAGE', label: 'إدارة كاملة للمنتجات' } ] },
  { title: 'البيانات المالية', permissions: [ { key: 'DASHBOARD_VIEW', label: 'عرض لوحة التحكم والإحصائيات' }, { key: 'WALLET_VIEW', label: 'عرض المحفظة والعمليات' }, { key: 'WALLET_MANAGE', label: 'إجراء عمليات يدوية بالمحفظة' } ] },
  { title: 'إعدادات المتجر', permissions: [ { key: 'SETTINGS_VIEW', label: 'عرض الإعدادات فقط' }, { key: 'SETTINGS_MANAGE', label: 'تعديل كافة إعدادات المتجر' } ] },
];

const EmployeesPage: React.FC<EmployeesPageProps> = ({ settings, setSettings, currentUser, users, activeStoreId }) => {
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const owner = useMemo(() => 
      users.find(u => u.stores?.some(s => s.id === activeStoreId)),
      [users, activeStoreId]
  );

  const handleSaveEmployee = (employee: Omit<Employee, 'id'> & { id?: string }) => {
    if (employee.id) { // Update
      setSettings(s => ({ ...s, employees: s.employees.map(e => e.id === employee.id ? (employee as Employee) : e) }));
    }
    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = () => {
    if (!employeeToDelete) return;
    setSettings(s => ({ ...s, employees: s.employees.filter(e => e.id !== employeeToDelete.id) }));
    setEmployeeToDelete(null);
  };
  
  const handleInviteEmployee = (email: string) => {
    setInviteError('');
    setInviteSuccess('');
    const userToInvite = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!userToInvite) {
      setInviteError('لم يتم العثور على مستخدم بهذا البريد. تم إرسال دعوة له للانضمام للمنصة. يرجى إعادة دعوته بعد إنشاء حسابه.');
      // Here you would typically trigger a backend service to send an email.
      // We simulate this by showing a message.
      return;
    }

    const isAlreadyEmployee = settings.employees.some(emp => emp.id === userToInvite.phone);
    if (isAlreadyEmployee) {
      setInviteError('هذا المستخدم هو بالفعل موظف في هذا المتجر.');
      return;
    }
    
    const newEmployee: Employee = {
      id: userToInvite.phone,
      name: userToInvite.fullName,
      email: userToInvite.email,
      permissions: [], // Start with no permissions
      status: 'invited',
    };

    setSettings(s => ({ ...s, employees: [...s.employees, newEmployee] }));
    setInviteSuccess(`تم إرسال دعوة إلى ${userToInvite.fullName} بنجاح!`);
    setIsInviteModalOpen(false);
    setTimeout(() => setInviteSuccess(''), 4000);
  };
  
  const handleAcceptInvitation = (employeeToAccept: Employee) => {
     setSettings(s => ({ ...s, employees: s.employees.map(e => e.id === employeeToAccept.id ? { ...e, status: 'active' } : e) }));
     // Optional: open permissions modal right away for a better UX
     setEditingEmployee({ ...employeeToAccept, status: 'active' });
     setIsEmployeeModalOpen(true);
  };


  return (
    <motion.div 
        className="max-w-6xl mx-auto space-y-6 text-right pb-12 px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
    >
      <motion.div variants={itemVariants}>
        {inviteSuccess && <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-300 font-bold animate-in fade-in duration-300"><Check size={20} /><span>{inviteSuccess}</span></div>}
      </motion.div>
      <motion.div variants={itemVariants}>
        <PermissionsCard 
            employees={settings.employees || []}
            onAdd={() => setIsInviteModalOpen(true)}
            onEdit={(emp) => { setEditingEmployee(emp); setIsEmployeeModalOpen(true); }}
            onDelete={(emp) => setEmployeeToDelete(emp)}
            onAccept={handleAcceptInvitation}
            ownerId={owner?.phone}
            loggedInUser={currentUser}
        />
      </motion.div>
      
      {isEmployeeModalOpen && (
        <EmployeeModal 
          isOpen={isEmployeeModalOpen}
          onClose={() => { setIsEmployeeModalOpen(false); setEditingEmployee(null); }}
          onSave={handleSaveEmployee}
          employee={editingEmployee}
        />
      )}
      
      {isInviteModalOpen && (
        <InviteModal 
          onClose={() => { setIsInviteModalOpen(false); setInviteError(''); }}
          onInvite={handleInviteEmployee}
          error={inviteError}
        />
      )}

      {employeeToDelete && (
         <DeleteConfirmModal 
           title={`حذف الموظف ${employeeToDelete.name}؟`} 
           desc="سيتم حذف هذا الموظف نهائياً. لا يمكن التراجع عن هذا الإجراء."
           onConfirm={handleDeleteEmployee} 
           onCancel={() => setEmployeeToDelete(null)} 
         />
      )}
    </motion.div>
  );
};

const PermissionsCard: React.FC<{ employees: Employee[], onAdd: () => void, onEdit: (emp: Employee) => void, onDelete: (emp: Employee) => void, onAccept: (emp: Employee) => void, ownerId?: string, loggedInUser: User | null }> = ({ employees, onAdd, onEdit, onDelete, onAccept, ownerId, loggedInUser }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg"><Users size={24}/></div>
          <div>
            <h2 className="text-xl font-black dark:text-white">إدارة صلاحيات الموظفين</h2>
            <p className="text-xs text-slate-500 dark:text-slate-500">التحكم في من يمكنه عرض أو تعديل بيانات متجرك.</p>
          </div>
        </div>
        <button onClick={onAdd} className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-purple-100 dark:shadow-none hover:bg-purple-700 active:scale-95 transition-all">
          <UserPlus size={20} /> دعوة موظف
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
            <tr>
              <th className="px-6 py-4">الموظف</th>
              <th className="px-6 py-4">الحالة / الصلاحيات</th>
              <th className="px-6 py-4 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {employees.map(emp => {
                const isOwner = emp.id === ownerId;
                const isInvited = emp.status === 'invited';

                return (
                <tr key={emp.id} className="group">
                    <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{emp.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{emp.email}</div>
                    </td>
                    <td className="px-6 py-4">
                        {isOwner ? <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-full">المالك (صلاحيات كاملة)</span>
                        : isInvited ? <span className="flex items-center gap-2 text-xs font-bold text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-900/50 px-2 py-1 rounded-full w-fit"><Clock size={14}/> في انتظار القبول</span>
                        : emp.permissions.length === Object.keys(PERMISSIONS).length ? <span className="text-xs font-bold text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/50 px-2 py-1 rounded-full">صلاحيات كاملة</span>
                        : <span className="text-xs font-bold text-slate-500">{emp.permissions.length} صلاحيات مخصصة</span>
                        }
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            {isOwner ? 
                                (loggedInUser?.isAdmin ? 
                                    <button onClick={() => onEdit(emp)} className="p-2 text-slate-400 hover:text-blue-500 rounded-lg transition-colors" title="تعديل صلاحيات المالك (خاص بالمدير)"><UserCog size={18} /></button>
                                    : <span className="text-xs font-bold text-slate-400 italic">لا يمكن التعديل</span>
                                )
                            : isInvited ? (
                                <>
                                    <button onClick={() => onAccept(emp)} className="flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200"><Check size={16}/> قبول الدعوة</button>
                                    <button onClick={() => onDelete(emp)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors" title="إلغاء الدعوة"><Trash2 size={18} /></button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => onEdit(emp)} className="p-2 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"><UserCog size={18} /></button>
                                    <button onClick={() => onDelete(emp)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                </>
                            )}
                        </div>
                    </td>
                </tr>
                );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface EmployeeModalProps { isOpen: boolean; onClose: () => void; onSave: (employee: Omit<Employee, 'id'> & { id?: string }) => void; employee: Employee | null; }
const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSave, employee }) => {
  const [formData, setFormData] = useState({ name: '', email: '', permissions: [] as Permission[] });
  
  useEffect(() => {
    if (employee) { setFormData({ name: employee.name, email: employee.email, permissions: employee.permissions }); } 
    else { setFormData({ name: '', email: '', permissions: [] }); }
  }, [employee, isOpen]);

  const handlePermissionChange = (permission: Permission, checked: boolean) => {
    setFormData(prev => ({ ...prev, permissions: checked ? [...prev.permissions, permission] : prev.permissions.filter(p => p !== permission) }));
  };
  
  const handleSelectAll = (checked: boolean) => {
    setFormData(prev => ({ ...prev, permissions: checked ? Object.keys(PERMISSIONS) as Permission[] : [] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...employee, ...formData });
  };
  
  if (!isOpen) return null;

  const allPermissionsSelected = formData.permissions.length === Object.keys(PERMISSIONS).length;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/90 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] text-right border border-slate-300 dark:border-slate-800">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
            <UserCog className="text-purple-600" /> تعديل صلاحيات الموظف
          </h3>
          <button onClick={onClose}><XCircle className="text-slate-400 hover:text-red-500"/></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-400">اسم الموظف</label>
              <input type="text" readOnly value={formData.name} className="mt-2 w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-400">البريد الإلكتروني</label>
              <input type="email" readOnly value={formData.email} className="mt-2 w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800 mb-4">
               <h4 className="text-lg font-bold dark:text-white flex items-center gap-2"><KeyRound/> تحديد الصلاحيات</h4>
               <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <input type="checkbox" checked={allPermissionsSelected} onChange={e => handleSelectAll(e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500"/>
                  <span className="text-sm font-bold">صلاحيات كاملة</span>
               </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {PERMISSION_GROUPS.map(group => (
                <div key={group.title} className="space-y-3">
                  <h5 className="font-black text-purple-800 dark:text-purple-400">{group.title}</h5>
                  {group.permissions.map(perm => (
                    <label key={perm.key} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-800 cursor-pointer">
                      <input type="checkbox" checked={formData.permissions.includes(perm.key)} onChange={e => handlePermissionChange(perm.key, e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500"/>
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </form>
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-8 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-black">إلغاء</button>
          <button type="submit" form="permission-form" onClick={handleSubmit} className="px-8 py-3 bg-purple-600 text-white rounded-xl font-black hover:bg-purple-700 transition-colors">حفظ</button>
        </div>
      </div>
    </div>
  );
};

interface InviteModalProps { onClose: () => void; onInvite: (email: string) => void; error: string; }
const InviteModal: React.FC<InviteModalProps> = ({ onClose, onInvite, error }) => {
  const [email, setEmail] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onInvite(email);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/90 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-8 text-right border border-slate-300 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-black dark:text-white">دعوة موظف</h3>
          <button onClick={onClose}><XCircle className="text-slate-400 hover:text-red-500"/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="invite-email" className="text-sm font-bold text-slate-700 dark:text-slate-400">البريد الإلكتروني للموظف</label>
            <input 
              id="invite-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="mt-2 w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-slate-500 mt-2">إذا لم يكن المستخدم مسجلاً، سيتم إرسال دعوة له للانضمام إلى المنصة.</p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold">إلغاء</button>
            <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold">إرسال دعوة</button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteConfirmModalProps { title: string; desc: string; onConfirm: () => void; onCancel: () => void; }
const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ title, desc, onConfirm, onCancel }) => ( <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/90 backdrop-blur-sm"> <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in duration-200 border border-slate-300 dark:border-slate-800"> <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900"><AlertCircle size={40} /></div> <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3 uppercase tracking-tight">{title}</h3> <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 leading-relaxed font-bold">{desc}</p> <div className="flex flex-col gap-3"> <button onClick={onConfirm} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black shadow-xl hover:bg-red-700 transition-all active:scale-95">تأكيد الحذف</button> <button onClick={onCancel} className="w-full py-4 text-slate-500 dark:text-slate-400 font-black hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">تراجع</button> </div> </div> </div> );

export default EmployeesPage;