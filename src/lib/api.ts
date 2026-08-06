/**
 * Data access. Everything is async and goes through TanStack Query, even though
 * it currently resolves from the in-memory seed — so replacing this file with
 * real `fetch` calls requires no changes in any component.
 */
import { CLIENTS, DEPARTMENTS, ORDERS, PRODUCTS, STAFF, TENANTS } from '@/data/seed'
import type { Client, Department, Order, Product, Staff, Tenant } from '@/data/types'

/** Simulated latency so loading states are real and get exercised in dev. */
const LATENCY_MS = 120
const settle = <T,>(v: T): Promise<T> =>
  new Promise((r) => setTimeout(() => r(v), LATENCY_MS))

export const queryKeys = {
  orders: ['orders'] as const,
  order: (id: string) => ['orders', id] as const,
  staff: ['staff'] as const,
  clients: ['clients'] as const,
  products: ['products'] as const,
  departments: ['departments'] as const,
  tenants: ['tenants'] as const,
}

export const api = {
  orders: (): Promise<Order[]> => settle(ORDERS),
  order: (id: string): Promise<Order | undefined> => settle(ORDERS.find((o) => o.id === id)),
  staff: (): Promise<Staff[]> => settle(STAFF),
  clients: (): Promise<Client[]> => settle(CLIENTS),
  products: (): Promise<Product[]> => settle(PRODUCTS),
  departments: (): Promise<Department[]> => settle(DEPARTMENTS),
  tenants: (): Promise<Tenant[]> => settle(TENANTS),
}
