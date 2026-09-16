import React from 'react';
import './notification.css';

const NotificationToast = ({ message, onClose }) => {
  return (
    <div className="toast-overlay">
      <div className="toast">
        <span>{message}</span>
        <button onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default NotificationToast;