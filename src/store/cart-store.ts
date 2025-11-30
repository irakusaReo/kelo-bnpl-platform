import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/types'; // Assuming a global Product type exists

interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Product) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const { items } = get();
        const itemExists = items.find((i) => i.id === item.id);

        if (itemExists) {
          itemExists.quantity += 1;
          set({ items: [...items] });
        } else {
          set({ items: [...items, { ...item, quantity: 1 }] });
        }
      },
      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },
      updateItemQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
        } else {
          set((state) => ({
            items: state.items.map((item) =>
              item.id === itemId ? { ...item, quantity } : item
            ),
          }));
        }
      },
      clearCart: () => set({ items: [] }),
      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      getCartTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage', // unique name
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
