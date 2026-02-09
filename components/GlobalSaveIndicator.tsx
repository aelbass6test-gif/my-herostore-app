import React from 'react';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

interface GlobalSaveIndicatorProps {
  status: SaveStatus;
  message: string;
}

const GlobalSaveIndicator: React.FC<GlobalSaveIndicatorProps> = ({ status, message }) => {
  const statusConfig = {
    saving: { icon: <Loader2 className="animate-spin" size={18} />, bg: 'bg-slate-800' },
    success: { icon: <CheckCircle size={18} className="text-emerald-400" />, bg: 'bg-slate-800' },
    error: { icon: <AlertTriangle size={18} className="text-red-400" />, bg: 'bg-red-900/50' },
  };

  const currentConfig = status !== 'idle' ? statusConfig[status] : null;

  return (
    <AnimatePresence>
      {status !== 'idle' && currentConfig && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]"
        >
          <div className={`flex items-center gap-3 px-6 py-3 text-white rounded-full shadow-2xl border border-slate-700 ${currentConfig.bg}`}>
            {currentConfig.icon}
            <span className="font-bold text-sm">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalSaveIndicator;
