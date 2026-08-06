/**
 * Data access. Everything is async and goes through TanStack Query, even though
 * it currently resolves from the in-memory seed — so replacing this file with
 * real `fetch` calls requires no changes in any component.
 */
import { CLIENTS, DEPARTMENTS, ORDERS, PRODUCTS, STAFF, TENANTS } from '@/data/seed'
import { COUNTIES, INVOICES, LEADS } from '@/data/seed2'
import type { Client, Department, Order, Product, Staff, Tenant } from '@/data/types'
import type { County, Invoice, Lead } from '@/data/seed2'

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
  leads: ['leads'] as const,
  lead: (id: string) => ['leads', id] as const,
  invoices: ['invoices'] as const,
  counties: ['counties'] as const,
}

export const api = {
  orders: (): Promise<Order[]> => settle(ORDERS),
  order: (id: string): Promise<Order | undefined> => settle(ORDERS.find((o) => o.id === id)),
  staff: (): Promise<Staff[]> => settle(STAFF),
  clients: (): Promise<Client[]> => settle(CLIENTS),
  products: (): Promise<Product[]> => settle(PRODUCTS),
  departments: (): Promise<Department[]> => settle(DEPARTMENTS),
  tenants: (): Promise<Tenant[]> => settle(TENANTS),
  leads: (): Promise<Lead[]> => settle(LEADS),
  lead: (id: string): Promise<Lead | undefined> => settle(LEADS.find((l) => l.id === id)),
  invoices: (): Promise<Invoice[]> => settle(INVOICES),
  counties: (): Promise<County[]> => settle(COUNTIES),
}
