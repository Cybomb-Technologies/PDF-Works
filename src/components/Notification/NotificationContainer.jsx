// src/components/Notification/NotificationContainer.jsx (ENHANCED)
import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import Notification from './Notification';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  // Group notifications by type for better stacking
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const type = notification.type || 'info';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(notification);
    return groups;
  }, {});

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {Object.entries(groupedNotifications).map(([type, typeNotifications]) => (
        <div key={type} className="space-y-2">
          {typeNotifications.map(notification => (
            <Notification
              key={notification.id}
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;