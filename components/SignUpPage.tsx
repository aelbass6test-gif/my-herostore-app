import React, { useState, useEffect } from 'react';
import { ShoppingCart, Globe, Clock, CreditCard, Store, Mail, User as UserIcon, ShieldAlert } from 'lucide-react';
import { User } from '../types';

interface SignUpPageProps {
  onAuthSuccess: (user: User, rememberMe: boolean) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const SignUpPage = ({ onAuthSuccess, users, setUsers }: SignUpPageProps) => {
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');
  const [showAdminTab, setShowAdminTab] = useState(false);
  
  // User form state
  const [isLoginView, setIsLoginView] = useState(true);
  const [fullName, setFullName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [userError, setUserError] = useState('');

  // Admin form state
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    if (userPhone === 'ADMINLOGIN') {
      setShowAdminTab(true);
      setUserPhone(''); // Clear input after triggering
    }
  }, [userPhone]);

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');

    if (isLoginView) {
      const foundUser = users.find(user => user.phone === userPhone && user.password === userPassword);
      if (foundUser) {
        onAuthSuccess(foundUser, rememberMe);
      } else {
        setUserError('رقم الموبايل أو كلمة المرور غير صحيحة.');
      }
    } else {
      if (!fullName.trim() || !userPhone.trim() || !userPassword.trim() || !userEmail.trim()) {
        setUserError('يرجى ملء جميع الحقول.');
        return;
      }
      if (userPassword.length < 8) {
        setUserError('يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل.');
        return;
      }
      
      if (users.some(user => user.phone === userPhone)) {
          setUserError('هذا الرقم مسجل بالفعل.');
          return;
      }
      if (users.some(user => user.email === userEmail)) {
        setUserError('هذا البريد الإلكتروني مسجل بالفعل.');
        return;
      }

      const newUser: User = { fullName, phone: userPhone, password: userPassword, email: userEmail, stores: [], joinDate: new Date().toISOString() };
      setUsers(prevUsers => [...prevUsers, newUser]);
      onAuthSuccess(newUser, true);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    const adminUser = users.find(user => user.phone === adminPhone && user.isAdmin);

    if (adminUser && adminPassword === adminUser.password) {
        onAuthSuccess(adminUser, true);
    } else {
        setAdminError('بيانات دخول المدير غير صحيحة.');
    }
  };

  const toggleView = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsLoginView(!isLoginView);
    setUserError('');
    setFullName('');
    setUserPhone('');
    setUserEmail('');
    setUserPassword('');
  };

  return (
    <div dir="rtl" className="font-cairo bg-gradient-to-br from-[#111827] to-[#0c1e3e] min-h-screen flex items-center justify-center p-4 text-white">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Right side: Features */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-black leading-tight">أنشئ متجرك الإلكتروني في دقيقة</h1>
          <p className="text-lg text-slate-300">متجر إلكتروني احترافي مع لوحة تحكم كاملة لإدارة المنتجات والطلبات</p>
          <div className="space-y-4">
            <FeatureCard icon={<ShoppingCart />} title="متجر إلكتروني كامل" subtitle="إدارة المنتجات والطلبات بسهولة" color="bg-green-500/20 text-green-400" />
            <FeatureCard icon={<Globe />} title="موقع إلكتروني احترافي" subtitle="صمم موقعك الإلكتروني بسهولة" color="bg-blue-500/20 text-blue-400" />
            <FeatureCard icon={<Clock />} title="إعداد سريع" subtitle="ابدأ في دقائق معدودة" color="bg-purple-500/20 text-purple-400" />
            <FeatureCard icon={<CreditCard />} title="بدون بطاقة" subtitle="لا تحتاج بطاقة ائتمان للتجربة" color="bg-yellow-500/20 text-yellow-400" />
          </div>
        </div>

        {/* Left side: Form */}
        <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex bg-slate-800/50 border border-slate-700 rounded-lg p-1 mb-6">
              <TabButton label="المستخدمين" icon={<UserIcon size={16}/>} isActive={activeTab === 'user'} onClick={() => setActiveTab('user')} />
              {showAdminTab && (
                <TabButton label="المدير والدعم" icon={<ShieldAlert size={16}/>} isActive={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
              )}
          </div>
          
          {activeTab === 'user' && (
            <div className="animate-in fade-in duration-300">
              <div className="text-center">
                <div className="inline-block bg-slate-800 p-3 rounded-lg border border-slate-700 mb-4">
                  <Store className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold">{isLoginView ? 'تسجيل الدخول' : 'إنشاء متجر إلكتروني'}</h2>
                <p className="text-slate-400 mt-1">{isLoginView ? 'مرحباً بعودتك! أدخل بياناتك للمتابعة.' : 'ابدأ بإنشاء متجرك الإلكتروني الآن'}</p>
              </div>
              <form onSubmit={handleUserSubmit} className="space-y-4 mt-6">
                {!isLoginView && (
                  <>
                    <div><label className="text-sm font-bold text-slate-300 mb-2 block">الاسم الكامل</label><input type="text" placeholder="أحمد محمد" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                    <div><label className="text-sm font-bold text-slate-300 mb-2 block">البريد الإلكتروني</label><input type="email" placeholder="example@mail.com" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} /></div>
                  </>
                )}
                <div><label className="text-sm font-bold text-slate-300 mb-2 block">رقم الموبايل</label><input type="tel" placeholder={isLoginView ? "01064527923" : "01xxxxxxxxx"} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} /></div>
                <div><label className="text-sm font-bold text-slate-300 mb-2 block">كلمة المرور</label><input type="password" placeholder={isLoginView ? "Password123" : "********"} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} />{!isLoginView && <p className="text-xs text-slate-500 mt-2">يجب أن تحتوي على 8 أحرف على الأقل.</p>}</div>
                {isLoginView && (
                  <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                          <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="rounded border-slate-600 bg-slate-800/50 text-cyan-500 focus:ring-cyan-500"/>
                          تذكرني
                      </label>
                  </div>
                )}
                {userError && <p className="text-sm text-red-400 text-center py-2">{userError}</p>}
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-lg py-3 font-bold transition-colors shadow-lg shadow-emerald-600/20">{isLoginView ? 'تسجيل الدخول' : 'إنشاء حساب'}</button>
              </form>
              <p className="text-center text-sm text-slate-400 mt-6">{isLoginView ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}{' '}<a href="#" onClick={toggleView} className="font-bold text-cyan-400 hover:underline">{isLoginView ? 'أنشئ حساباً' : 'تسجيل الدخول'}</a></p>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="animate-in fade-in duration-300">
               <div className="text-center">
                 <div className="inline-block bg-red-900/50 p-3 rounded-lg border border-red-700 mb-4">
                   <ShieldAlert className="w-8 h-8 text-red-400" />
                 </div>
                 <h2 className="text-2xl font-bold">لوحة تحكم المدير العام</h2>
                 <p className="text-slate-400 mt-1">تسجيل دخول خاص بالدعم الفني والإدارة.</p>
               </div>
               <form onSubmit={handleAdminSubmit} className="space-y-4 mt-6">
                <div>
                  <label className="text-sm font-bold text-slate-300 mb-2 block">رقم هاتف المدير</label>
                  <input
                    type="tel"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-300 mb-2 block">كلمة المرور</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                 {adminError && <p className="text-sm text-red-400 text-center py-2">{adminError}</p>}
                 <button type="submit" className="w-full bg-red-600 hover:bg-red-700 rounded-lg py-3 font-bold transition-colors shadow-lg shadow-red-600/20">الدخول كمدير</button>
               </form>
            </div>
          )}
          <p className="text-center text-xs text-slate-500 mt-8">
            تم تأسيس وبرمجة المنصة بالكامل بواسطة <span className="font-bold text-slate-400">عبدالرحمن سعيد</span>.
            <br />
            سيتم الإطلاق الرسمي قريباً عند اكتمال كافة الميزات.
          </p>
        </div>

      </div>
    </div>
  );
};

const TabButton: React.FC<{ label: string; icon: React.ReactElement; isActive: boolean; onClick: () => void; }> = ({ label, icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-bold transition-all ${isActive ? 'bg-slate-700/50 text-white shadow-inner' : 'text-slate-400 hover:bg-slate-700/20'}`}>
        {icon}
        {label}
    </button>
);

// FIX: Explicitly type the icon prop to allow adding the 'size' property.
const FeatureCard: React.FC<{ icon: React.ReactElement<{ size?: number | string }>; title: string; subtitle: string; color: string; }> = ({ icon, title, subtitle, color }) => (
  <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 flex items-center gap-4 backdrop-blur-sm">
    <div className={`p-3 rounded-lg ${color}`}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-slate-400">{subtitle}</p>
    </div>
  </div>
);

export default SignUpPage;
