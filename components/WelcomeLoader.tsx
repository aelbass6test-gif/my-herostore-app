
import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface WelcomeLoaderProps {
  userName: string;
}

const WelcomeLoader: React.FC<WelcomeLoaderProps> = ({ userName }) => {
  return (
    <div dir="rtl" className="font-cairo bg-slate-100 dark:bg-slate-950 min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center p-8"
      >
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-black text-slate-800 dark:text-white mb-3"
        >
          مرحباً بك، {userName}!
        </motion.h1>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400"
        >
          <Loader2 className="animate-spin" />
          <span className="font-bold">جاري تحميل بيانات متجرك...</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WelcomeLoader;
