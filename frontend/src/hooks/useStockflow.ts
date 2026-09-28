import { useQuery } from "@tanstack/react-query";
import {
  analyticsService,
  customerService,
  orderService,
  productService,
  systemService,
} from "@/services/api";

export const useProducts = () =>
  useQuery({ queryKey: ["products"], queryFn: productService.list });

export const useProduct = (id: string) =>
  useQuery({ queryKey: ["products", id], queryFn: () => productService.get(id) });

export const useCustomers = () =>
  useQuery({ queryKey: ["customers"], queryFn: customerService.list });

export const useCustomer = (id: string) =>
  useQuery({ queryKey: ["customers", id], queryFn: () => customerService.get(id) });

export const useOrders = () => useQuery({ queryKey: ["orders"], queryFn: orderService.list });

export const useOrder = (id: string) =>
  useQuery({ queryKey: ["orders", id], queryFn: () => orderService.get(id) });

export const useSummary = () =>
  useQuery({ queryKey: ["analytics", "summary"], queryFn: analyticsService.summary });

export const useSales = () =>
  useQuery({ queryKey: ["analytics", "sales"], queryFn: analyticsService.sales });

export const useGrowth = () =>
  useQuery({ queryKey: ["analytics", "growth"], queryFn: analyticsService.growth });

export const useHealth = () => useQuery({ queryKey: ["health"], queryFn: systemService.health });

export const useApiLogs = () => useQuery({ queryKey: ["logs"], queryFn: systemService.logs });
