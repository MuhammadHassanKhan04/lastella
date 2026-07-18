import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  order_number: string;
  full_name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  total: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
}

const ORDERS_KEY = "lastella_orders";

export function getLocalOrders(): Order[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(ORDERS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export function saveLocalOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function useOrders(status?: string) {
  return useQuery({
    queryKey: ["orders", status],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 200));
      let orders = getLocalOrders();
      if (status && status !== "all") {
        orders = orders.filter(o => o.status === status);
      }
      // Sort by newest
      return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });
}

export function useUserOrders(email: string | null) {
  return useQuery({
    queryKey: ["orders", "user", email],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 200));
      if (!email) return [];
      const orders = getLocalOrders().filter(o => o.email.toLowerCase() === email.toLowerCase());
      return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!email
  });
}

export function useOrderActions() {
  const queryClient = useQueryClient();
  
  const createOrder = useMutation({
    mutationFn: async (order: Order) => {
      const orders = getLocalOrders();
      orders.unshift(order);
      saveLocalOrders(orders);
      return order;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] })
  });
  
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const orders = getLocalOrders();
      const idx = orders.findIndex(o => o.id === id);
      if (idx >= 0) {
        orders[idx].status = status;
        saveLocalOrders(orders);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] })
  });

  return { createOrder, updateStatus };
}
