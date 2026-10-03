import React from 'react';

const ErrorBox = ({ message, onClose, type = 'error' }) => {
  if (!message) return null;

  let borderColor, shadowColor, iconBgColor, iconBorderColor, iconColor, buttonStyle, icon, title;
  
  if (type === 'error') {
    borderColor = 'rgba(255, 0, 128, 0.3)';
    shadowColor = 'rgba(255, 0, 128, 0.1)';
    iconBgColor = 'rgba(255, 0, 128, 0.2)';
    iconBorderColor = 'rgba(255, 0, 128, 0.4)';
    iconColor = '#ff0080';
    icon = 'fas fa-exclamation';
    buttonStyle = { backgroundColor: '#ff0080', color: 'white' };
    title = 'Error';
  } else if (type === 'success') {
    borderColor = 'rgba(0, 255, 128, 0.3)';
    shadowColor = 'rgba(0, 255, 128, 0.1)';
    iconBgColor = 'rgba(0, 255, 128, 0.2)';
    iconBorderColor = 'rgba(0, 255, 128, 0.4)';
    iconColor = '#00ff80';
    icon = 'fas fa-check';
    buttonStyle = { backgroundColor: '#00ff80', color: '#070709' };
    title = 'Success';
  } else if (type === 'warning') {
    borderColor = 'rgba(234, 179, 8, 0.3)';
    shadowColor = 'rgba(234, 179, 8, 0.1)';
    iconBgColor = 'rgba(234, 179, 8, 0.2)';
    iconBorderColor = 'rgba(234, 179, 8, 0.4)';
    iconColor = '#eab308';
    icon = 'fas fa-triangle-exclamation';
    buttonStyle = { backgroundColor: '#eab308', color: '#000' };
    title = 'Warning';
  } else {
    borderColor = 'rgba(0, 212, 255, 0.3)';
    shadowColor = 'rgba(0, 212, 255, 0.1)';
    iconBgColor = 'rgba(0, 212, 255, 0.2)';
    iconBorderColor = 'rgba(0, 212, 255, 0.4)';
    iconColor = '#00d4ff';
    icon = 'fas fa-info-circle';
    buttonStyle = { backgroundColor: '#00d4ff', color: '#070709' };
    title = 'Notice';
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Dismiss notification"
        className="fixed inset-0 cursor-default bg-[#02070d]/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-box-title"
        aria-describedby="alert-box-message"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#081521] p-5 shadow-2xl shadow-black/60 animate-fade-in sm:p-7"
        style={{
          border: `1px solid ${borderColor}`,
          boxShadow: `0 24px 90px ${shadowColor}, 0 0 45px ${shadowColor}`
        }}
      >
        <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: iconColor }} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <i className="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
        <div className="mb-6 flex items-start gap-4 pr-8">
          <div 
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: iconBgColor,
              border: `1px solid ${iconBorderColor}`,
              boxShadow: `0 0 20px ${shadowColor}`
            }}
          >
            <i className={`${icon} text-lg`} style={{ color: iconColor }} aria-hidden="true"></i>
          </div>
          <div className="flex-1">
            <h3 id="alert-box-title" className="text-lg font-orbitron font-black uppercase tracking-widest text-white sm:text-xl">{title}</h3>
            <p id="alert-box-message" className="mt-2 text-sm leading-relaxed text-gray-300 sm:text-base">{message}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={buttonStyle}
          className="w-full rounded-lg py-3 font-orbitron text-xs font-black uppercase tracking-widest transition-all hover:brightness-110 sm:py-3.5 sm:text-sm"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default ErrorBox;
