import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      icon: <CheckCircle className="h-5 w-5 text-emerald-400" />,
    },
    error: {
      bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      icon: <XCircle className="h-5 w-5 text-rose-400" />,
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
    },
    info: {
      bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      icon: <Info className="h-5 w-5 text-blue-400" />,
    },
  };

  const currentStyle = styles[type] || styles.success;

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md animate-slide-up ${currentStyle.bg}`}>
      {currentStyle.icon}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-auto rounded-lg p-1 hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;
