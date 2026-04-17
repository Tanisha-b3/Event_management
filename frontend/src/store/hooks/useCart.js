import { useSelector, useDispatch } from 'react-redux';
import { addToCart, removeFromCart, updateQuantity, clearCart, checkout, resetCheckout } from '../slices/cartSlice';
import socketService from '../../utils/socketService';

export const useCart = () => {
  const dispatch = useDispatch();
  const { items, total, loading, error, checkoutSuccess } = useSelector((state) => state.cart);

  return {
    items,
    total,
    loading,
    error,
    checkoutSuccess,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    addToCart: (item) => {
      dispatch(addToCart(item));
      socketService.emitCartAdd(item);
    },
    removeFromCart: (id) => {
      dispatch(removeFromCart(id));
      socketService.emitCartRemove(id);
    },
    updateQuantity: (id, quantity) => dispatch(updateQuantity({ id, quantity })),
    clearCart: () => dispatch(clearCart()),
    checkout: (paymentDetails) => dispatch(checkout(paymentDetails)),
    resetCheckout: () => dispatch(resetCheckout()),
  };
};

export default useCart;
