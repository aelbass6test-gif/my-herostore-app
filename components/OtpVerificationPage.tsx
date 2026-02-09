
import React, { useState, useEffect, useRef } from 'react';
import { KeyRound, Mail, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface OtpVerificationPageProps {
  user: User;
  correctOtp: string;
  onVerifySuccess: (user: User) => void;
  onCancel: () => void;
}

const OtpVerificationPage: React.FC<OtpVerificationPageProps> = ({ user, correctOtp, onVerifySuccess, onCancel }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const [showResendSuccess, setShowResendSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = () => {
    if (countdown === 0) {
      setIsResending(true);
      // Simulate API call to resend OTP
      setTimeout(() => {
        setShowResendSuccess(true);
        setTimeout(() => setShowResendSuccess(false), 3000);
        setCountdown(30);
        setError('');
        setIsResending(false);
      }, 1000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === correctOtp) {
      onVerifySuccess(user);
    } else {
      setError('رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى.');
      setOtp('');
    }
  };

  return (
    <div dir="rtl" className="font-cairo bg-slate-100 dark:bg-slate-950 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto w-16 h-16 flex items-center justify-center bg-teal-50 dark:bg-teal-900/40 rounded-full border-4 border-white dark:border-slate-800 shadow-md mb-5">
            <KeyRound className="w-8 h-8 text-teal-500" />
        </div>
        
        <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">الدخول إلى حسابك الشخصي</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">أرسلنا لك رمز التحقق من 6 أرقام عبر البريد الإلكتروني</p>
        
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-lg text-center">
            <p className="text-xs text-yellow-700 dark:text-yellow-400 font-bold mb-2">لأغراض العرض التوضيحي، هذا هو رمزك:</p>
            <p className="text-2xl font-black tracking-[0.2em] text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-800/30 py-2 rounded-md">{correctOtp}</p>
        </div>

        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
                <Mail size={16} className="text-slate-400" />
                <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{user.email}</span>
            </div>
            <button onClick={onCancel} className="text-xs font-bold text-teal-600 hover:underline">تغيير</button>
        </div>

        <form onSubmit={handleSubmit}>
            <input
                ref={inputRef}
                type="text"
                maxLength={6}
                placeholder="أدخل رمز التحقق"
                value={otp}
                onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setOtp(value);
                    setError('');
                }}
                className={`w-full text-center tracking-[0.5em] text-2xl font-bold bg-slate-50 dark:bg-slate-800 border-2 rounded-lg py-4 outline-none transition-all ${error ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10'}`}
            />
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            <button
                type="submit"
                className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition-colors duration-300 mt-4 shadow-lg shadow-teal-500/20 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                disabled={otp.length !== 6 || !!error}
            >
                تحقق من الرمز
            </button>
        </form>

        <div className="mt-6 text-sm text-slate-500 h-5">
            {showResendSuccess ? (
                <p className="text-green-600 font-bold animate-in fade-in">تم "إعادة إرسال" الرمز بنجاح!</p>
            ) : countdown > 0 ? (
                <span>لم يصلك رمز التحقق؟ إعادة إرساله خلال <span className="font-bold text-teal-600">{`00:${countdown.toString().padStart(2, '0')}`}</span></span>
            ) : (
                <button onClick={handleResend} disabled={isResending} className="font-bold text-teal-600 hover:underline disabled:text-slate-400 disabled:cursor-wait flex items-center gap-1 mx-auto">
                    {isResending && <RefreshCw size={14} className="animate-spin" />}
                    إعادة إرسال الرمز عبر البريد الإلكتروني
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default OtpVerificationPage;
