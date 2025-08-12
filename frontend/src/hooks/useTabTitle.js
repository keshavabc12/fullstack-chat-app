import { useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';

// ✅ Custom hook to update browser tab title with notification count
export const useTabTitle = () => {
  const { notifications } = useChatStore();
  
  useEffect(() => {
    // Calculate total unread notifications
    const totalUnread = Object.values(notifications).reduce((total, userNotifs) => {
      return total + userNotifs.filter(n => !n.read).length;
    }, 0);
    
    // Update document title
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) Chat App`;
    } else {
      document.title = 'Chat App';
    }
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'Chat App';
    };
  }, [notifications]);
};

export default useTabTitle;
