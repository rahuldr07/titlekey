export type StaffAvailability = 'ok' | 'leave' | 'shift'

export interface Department {
  id: string
  name: string
  desc: string
  /** Included in the automatic assignment pass. `Doc Req` is not. */
  auto: boolean
  /** If set, this department QCs that one — what the self-review rule keys off. */
  pair: string | null
  qc: boolean
}

export interface Staff {
  id: string
  name: string
  departments: string[]
  role: RoleId
  /** Orders this person can hold in a day. */
  capacity: number
  open: number
  availability: StaffAvailability
  active: boolean
  email: string
}

export type RoleId = 'staff' | 'lead' | 'admin'

export interface Role {
  id: RoleId
  name: string
  desc: string
  locked?: boolean
  permissions: Permission[]
}

export type Permission =
  | 'own' | 'all' | 'assign' | 'pricing' | 'qc' | 'config' | 'people' | 'export' | 'override'

export interface Product {
  id: string
  name: string
  fee: number
  /** Default client promise, in hours. */
  slaHours: number
}

export interface Client {
  name: string
  displayCode: string
  orders: number
  invoiced: number
  total: number
  paid: number
  email: string
  phone: string
  terms: string
  active: boolean
}

export type OrderStatus =
  | 'search' | 'wip' | 'sq' | 'typing' | 'tqc' | 'rts' | 'upload'
  | 'sent' | 'hold' | 'docreq' | 'fee' | 'eff' | 'clar' | 'canc'

export interface Order {
  id: string
  client: string
  product: string
  status: OrderStatus
  state: string
  county: string
  property: string
  /** Department name → staff id, or null when unassigned. */
  assignments: Record<string, string | null>
  dueAt: Date
  receivedAt: Date
  fee: number
  age: string
  done?: boolean
  flag?: string
  promiseHours: number
}

export interface Tenant {
  id: string
  name: string
  plan: string
  state: string
}
