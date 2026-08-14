import React from 'react';

const ErrorBox = ({ message, onClose, type = 'error' }) => {
  if (!message) return null;
  const color = type === 'error' ? 'pink' : type === 'warning' ? 'yellow' : type === 'success' ? 'green' : 'cyan';
  const title = type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Notice';
  return (
    <div className={`w-full max-w-2xl mx-auto bg-${color}/10 border border-${color}/40 text-white p-4 rounded-xl shadow-sm mb-4`}>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="font-orbitron font-bold text-sm uppercase tracking-widest">{title}</div>
          <div className="mt-1 text-sm text-gray-200">{message}</div>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white">×</button>
      </div>
    </div>
  );
};

export default ErrorBox;
