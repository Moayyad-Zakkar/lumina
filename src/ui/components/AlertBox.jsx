import React from 'react';

const AlertBox = ({ variant = 'info', title, message }) => {
  const variants = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-700',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      titleColor: 'text-amber-800',
      textColor: 'text-amber-700',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      titleColor: 'text-red-800',
      textColor: 'text-red-700',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      titleColor: 'text-green-800',
      textColor: 'text-green-700',
    },
  };

  const style = variants[variant] || variants.info;

  return (
    <div className={`p-4 ${style.bg} border ${style.border} rounded-md`}>
      {title && (
        <p className={`text-body-bold font-body-bold ${style.titleColor}`}>
          {title}
        </p>
      )}
      <p className={`text-body font-body ${style.textColor} ${title ? 'mt-1' : ''}`}>
        {message}
      </p>
    </div>
  );
};

export default AlertBox;