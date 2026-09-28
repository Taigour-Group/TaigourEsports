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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-bg-dark/95 backdrop-blur-md" onClick={onClose}></div>
      <div 
        className="relative w-full max-w-sm glass p-6 md:p-8 rounded-xl animate-fade-in"
        style={{
          border: `1px solid ${borderColor}`,
          boxShadow: `0 0 100px ${shadowColor}`
        }}
      >
        <div className="flex items-start gap-4 mb-6">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: iconBgColor,
              border: `1px solid ${iconBorderColor}`,
              boxShadow: `0 0 20px ${shadowColor}`
            }}
          >
            <i className={`${icon} text-lg`} style={{ color: iconColor }}></i>
          </div>
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-orbitron font-black text-white uppercase tracking-widest">{title}</h3>
            <p className="text-gray-400 font-rajdhani text-sm md:text-base mt-2 leading-relaxed">{message}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={buttonStyle}
          className="w-full py-3 md:py-4 font-orbitron font-black text-xs md:text-sm uppercase tracking-widest transition-all rounded hover:opacity-80"
        >
          ACKNOWLEDGE
        </button>
      </div>
    </div>
  );
};

export default ErrorBox;
