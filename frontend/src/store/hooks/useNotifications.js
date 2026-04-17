import { useSelector, useDispatch } from 'react-redux';
import {
  fetchNotifications, markAsRead, markAllAsRead, deleteNotification,
  addNotification, clearNotifications,
} from '../slices/notificationSlice';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, loading, error } = useSelector((state) => state.notifications);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications: () => dispatch(fetchNotifications()),
    markAsRead: (id) => dispatch(markAsRead(id)),
    markAllAsRead: () => dispatch(markAllAsRead()),
    deleteNotification: (id) => dispatch(deleteNotification(id)),
    addNotification: (notification) => dispatch(addNotification(notification)),
    clearNotifications: () => dispatch(clearNotifications()),
  };
};

export default useNotifications;
