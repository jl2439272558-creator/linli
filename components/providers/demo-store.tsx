'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  brands,
  categories,
  initialProducts,
  initialPriceLogs,
  initialPurchaseOrders,
  initialRefunds,
  initialReviewItems,
  initialSaleOrders,
  initialStaff,
  initialStockInRecords,
  initialSupplierDetails,
  initialTasks,
  stores,
  type CollectTask,
  type PriceLog,
  type Product,
  type PurchaseOrder,
  type RefundRecord,
  type ReviewItem,
  type SaleOrder,
  type StaffMember,
  type StockInRecord,
  type StoreInfo,
  type SupplierDetail,
} from '@/lib/mock-data'

/** 收银挂单：购物车明细 */
export type HeldItem = { productId: string; name: string; price: number; unit: string; qty: number; stock: number }

export type HeldOrder = {
  id: string
  createdAt: string
  items: HeldItem[]
  amount: number
  count: number
  member: boolean
  memberId: string | null
  memberName: string | null
  memberPhone: string | null
}

/** 入库确认入参（与采购单明细字段对齐） */
export type StockInLine = {
  productId: string
  name: string
  spec: string | null
  unit: string
  orderedQty: number | null
  alreadyIn: number
  receive: number
  price: number | null
}

type DemoStore = {
  /** 数据库是否已连通；false 时停留在本地演示模式 */
  hydrated: boolean
  storeId: string
  setStoreId: (id: string) => void
  currentStore: (typeof stores)[number]
  products: Product[]
  addProduct: (p: Omit<Product, 'id' | 'updatedAt'>) => Promise<Product>
  updateProduct: (id: string, patch: Partial<Product>) => void
  deleteProducts: (ids: string[]) => void
  adjustStock: (id: string, delta: number) => void
  tasks: CollectTask[]
  addTask: (t: Omit<CollectTask, 'id' | 'createdAt' | 'operator'>) => Promise<CollectTask>
  updateTask: (id: string, patch: Partial<CollectTask>) => void
  reviewItems: ReviewItem[]
  updateReviewItem: (id: string, patch: Partial<ReviewItem>) => void
  purchaseOrders: PurchaseOrder[]
  addPurchaseOrder: (o: Omit<PurchaseOrder, 'id' | 'createdAt' | 'operator'>) => Promise<PurchaseOrder>
  updatePurchaseOrder: (id: string, patch: Partial<PurchaseOrder>) => void
  stockInRecords: StockInRecord[]
  saleOrders: SaleOrder[]
  updateSaleOrder: (id: string, patch: Partial<SaleOrder>) => void
  refunds: RefundRecord[]
  addRefund: (r: Omit<RefundRecord, 'id' | 'createdAt' | 'operator'>) => Promise<RefundRecord>
  updateRefund: (id: string, patch: Partial<RefundRecord>) => void
  /** 收银结算：扣库存 + 写订单，数据库事务内完成 */
  checkoutSale: (input: Omit<SaleOrder, 'id' | 'createdAt'>) => Promise<SaleOrder | null>
  /** 确认退款：回滚库存 + 更新订单 + 更新退货单，单事务 */
  approveRefund: (refundId: string) => Promise<{ refund: RefundRecord; order: SaleOrder | null } | null>
  /** 采购入库：加库存 + 写入库单 + 回写采购单，单事务 */
  confirmStockIn: (orderId: string | null, lines: StockInLine[]) => Promise<StockInRecord | null>
  /** 批量调价 + 调价记录，单事务 */
  bulkPriceAdjust: (payload: { ids: string[]; field: string; changes: Record<string, number>; log: { field: string; mode: string; scope: string; affected: number } }) => Promise<void>
  /** 批量更新同一批商品的同一字段（单条 UPDATE） */
  bulkUpdateProducts: (ids: string[], patch: Partial<Product>) => Promise<void>
  meituanConnected: boolean
  setMeituanConnected: (v: boolean) => void
  categoryList: string[]
  addCategory: (name: string) => Promise<void>
  renameCategory: (oldName: string, newName: string) => Promise<void>
  deleteCategory: (name: string) => Promise<void>
  moveCategory: (name: string, dir: -1 | 1) => Promise<void>
  brandList: string[]
  addBrand: (name: string) => Promise<void>
  renameBrand: (oldName: string, newName: string) => Promise<void>
  deleteBrand: (name: string) => Promise<void>
  supplierList: SupplierDetail[]
  addSupplier: (s: Omit<SupplierDetail, 'id'>) => Promise<SupplierDetail>
  updateSupplier: (id: string, patch: Partial<SupplierDetail>) => void
  staffList: StaffMember[]
  addStaff: (s: Omit<StaffMember, 'id' | 'lastLoginAt'>) => Promise<StaffMember>
  updateStaff: (id: string, patch: Partial<StaffMember>) => void
  storeList: StoreInfo[]
  addStore: (s: Omit<StoreInfo, 'id' | 'monthSales'>) => Promise<StoreInfo>
  updateStore: (id: string, patch: Partial<StoreInfo>) => void
  priceLogs: PriceLog[]
  addPriceLog: (l: Omit<PriceLog, 'id' | 'createdAt' | 'operator'>) => Promise<PriceLog>
  /** 挂单（收银暂存） */
  heldOrders: HeldOrder[]
  holdCart: (input: Omit<HeldOrder, 'id' | 'createdAt'>) => Promise<HeldOrder | null>
  takeHeld: (id: string) => HeldOrder | null
  /** 基础设置（key-value，落库） */
  settings: Record<string, string>
  saveSetting: (k: string, v: string) => Promise<void>
  /** 将默认安全库存一次性应用到全部商品（单条 UPDATE） */
  applySafetyStock: (n: number) => Promise<void>
}

const DemoStoreContext = createContext<DemoStore | null>(null)

/** 本地演示模式下的单号生成（与服务端 sequences 规则一致） */
const LOCAL_ID_GEN: Record<string, { prefix: string; pad: number; perDay?: boolean; start: number }> = {
  products: { prefix: 'P', pad: 5, start: 10013 },
  suppliers: { prefix: 'SUP', pad: 2, start: 6 },
  staff: { prefix: 'E', pad: 3, start: 7 },
  stores: { prefix: 's', pad: 0, start: 4 },
  purchaseOrders: { prefix: 'PO', pad: 3, perDay: true, start: 1 },
  stockInRecords: { prefix: 'SI', pad: 3, perDay: true, start: 1 },
  saleOrders: { prefix: 'SO', pad: 3, perDay: true, start: 1 },
  refunds: { prefix: 'RF', pad: 3, perDay: true, start: 1 },
  tasks: { prefix: 'AT', pad: 3, perDay: true, start: 1 },
  priceLogs: { prefix: 'PL', pad: 3, perDay: true, start: 1 },
  heldOrders: { prefix: 'HD', pad: 3, perDay: true, start: 1 },
}

function shanghaiDateCompact() {
  const d = new Date(Date.now() + 8 * 3600 * 1000)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function nowString() {
  const d = new Date(Date.now() + 8 * 3600 * 1000)
  return d.toISOString().slice(0, 16).replace('T', ' ')
}

async function postJson(url: string, body: unknown): Promise<any> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (resp.status === 401) {
    // 会话过期：整页跳转登录页
    window.location.href = '/login'
    throw new Error('登录已过期')
  }
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok || data.ok === false) throw new Error(data.error || `请求失败（HTTP ${resp.status}）`)
  return data
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [storeId, setStoreId] = useState(stores[0].id)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [tasks, setTasks] = useState<CollectTask[]>(initialTasks)
  const [reviewItems, setReviewItemsState] = useState<ReviewItem[]>(initialReviewItems)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders)
  const [stockInRecords, setStockInRecords] = useState<StockInRecord[]>(initialStockInRecords)
  const [saleOrders, setSaleOrders] = useState<SaleOrder[]>(initialSaleOrders)
  const [refunds, setRefunds] = useState<RefundRecord[]>(initialRefunds)
  const [meituanConnected, setMeituanConnectedState] = useState(false)
  const [categoryList, setCategoryList] = useState<string[]>(categories)
  const [brandList, setBrandList] = useState<string[]>(brands)
  const [supplierList, setSupplierList] = useState<SupplierDetail[]>(initialSupplierDetails)
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff)
  const [storeList, setStoreList] = useState<StoreInfo[]>(stores)
  const [priceLogs, setPriceLogs] = useState<PriceLog[]>(initialPriceLogs)
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const localSeq = useRef<Record<string, number>>({})
  const remoteRef = useRef(false)
  const notifiedOffline = useRef(false)

  // 供异步动作读取最新列表（本地演示模式）
  const stateRef = useRef({ saleOrders, refunds, purchaseOrders, heldOrders })
  stateRef.current = { saleOrders, refunds, purchaseOrders, heldOrders }

  const localNextId = useCallback((key: string): string => {
    const gen = LOCAL_ID_GEN[key]
    if (!gen) return `X${Date.now()}`
    const base = gen.perDay ? `${key}:${shanghaiDateCompact()}` : key
    const start = gen.start - 1
    if (localSeq.current[base] === undefined) localSeq.current[base] = start
    localSeq.current[base] += 1
    const n = localSeq.current[base]
    const seq = gen.pad > 0 ? String(n).padStart(gen.pad, '0') : String(n)
    return `${gen.prefix}${gen.perDay ? shanghaiDateCompact() : ''}${seq}`
  }, [])

  const persistError = useCallback((err: unknown, what: string) => {
    toast.error(`${what}保存失败`, { description: err instanceof Error ? err.message : String(err) })
  }, [])

  const persist = useCallback(
    (resource: string, op: string, extra: Record<string, unknown>) => {
      if (!remoteRef.current) return
      postJson('/api/data', { resource, op, ...extra }).catch((err) => persistError(err, '数据'))
    },
    [persistError],
  )

  /** 单条语句类写入：本地立即生效，远程异步落库 */
  const updateRow = useCallback(
    (resource: string, id: string, patch: Record<string, unknown>) => persist(resource, 'update', { id, patch }),
    [persist],
  )

  /** 事务类动作（仅远程模式） */
  const runAction = useCallback(
    async (action: string, payload: unknown): Promise<any> => {
      try {
        return await postJson('/api/actions', { action, payload })
      } catch (err) {
        persistError(err, '操作')
        return null
      }
    },
    [persistError],
  )

  /** 远程创建：拿服务端单号；失败时回退本地单号，当前会话仍可用 */
  const createRow = useCallback(
    async (resource: string, entity: Record<string, unknown>): Promise<Record<string, unknown>> => {
      if (remoteRef.current) {
        try {
          const res = await postJson('/api/data', { resource, op: 'create', entity })
          return res.entity as Record<string, unknown>
        } catch (err) {
          persistError(err, '新增')
        }
      }
      return { ...entity, id: localNextId(resource) }
    },
    [localNextId, persistError],
  )

  /** bootstrap：一次拉齐全部数据；失败则保持本地演示数据 */
  useEffect(() => {
    let cancelled = false
    fetch('/api/bootstrap')
      .then((r) => {
        if (r.status === 401) {
          // 会话过期：整页跳转登录页
          if (!cancelled) window.location.href = '/login'
          throw new Error('登录已过期')
        }
        return r.json()
      })
      .then((res: { ok?: boolean; data?: Record<string, unknown>; error?: string }) => {
        if (cancelled) return
        if (!res.ok || !res.data) throw new Error(res.error || 'bootstrap 失败')
        const d = res.data
        if (Array.isArray(d.products)) setProducts(d.products as Product[])
        if (Array.isArray(d.tasks)) setTasks(d.tasks as CollectTask[])
        if (Array.isArray(d.reviewItems)) setReviewItemsState(d.reviewItems as ReviewItem[])
        if (Array.isArray(d.purchaseOrders)) setPurchaseOrders(d.purchaseOrders as PurchaseOrder[])
        if (Array.isArray(d.stockInRecords)) setStockInRecords(d.stockInRecords as StockInRecord[])
        if (Array.isArray(d.saleOrders)) setSaleOrders(d.saleOrders as SaleOrder[])
        if (Array.isArray(d.refunds)) setRefunds(d.refunds as RefundRecord[])
        if (Array.isArray(d.suppliers)) setSupplierList(d.suppliers as SupplierDetail[])
        if (Array.isArray(d.staff)) setStaffList(d.staff as StaffMember[])
        if (Array.isArray(d.stores)) setStoreList(d.stores as StoreInfo[])
        if (Array.isArray(d.priceLogs)) setPriceLogs(d.priceLogs as PriceLog[])
        if (Array.isArray(d.heldOrders)) setHeldOrders(d.heldOrders as HeldOrder[])
        const s = (d.settings ?? {}) as Record<string, string>
        setSettings(s)
        try {
          if (s.categories) setCategoryList(JSON.parse(s.categories))
          if (s.brands) setBrandList(JSON.parse(s.brands))
        } catch {
          /* 配置损坏时保留默认列表 */
        }
        setMeituanConnectedState(s.meituan === '1')
        remoteRef.current = true
        setHydrated(true)
      })
      .catch((err) => {
        if (cancelled || notifiedOffline.current) return
        notifiedOffline.current = true
        toast.info('数据库未连接，当前为本地演示模式', {
          description: err instanceof Error ? err.message : '数据不会被保存',
        })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const addProduct = useCallback(
    async (p: Omit<Product, 'id' | 'updatedAt'>): Promise<Product> => {
      const entity = { ...p, updatedAt: nowString() }
      const created = (await createRow('products', entity)) as unknown as Product
      setProducts((prev) => [created, ...prev])
      return created
    },
    [createRow],
  )

  const updateProduct = useCallback(
    (id: string, patch: Partial<Product>) => {
      const next = { ...patch, updatedAt: nowString() }
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...next } : p)))
      updateRow('products', id, next)
    },
    [updateRow],
  )

  const deleteProducts = useCallback(
    (ids: string[]) => {
      if (!ids.length) return
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)))
      persist('products', 'delete', { ids })
    },
    [persist],
  )

  const adjustStock = useCallback(
    (id: string, delta: number) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta), updatedAt: nowString() } : p)),
      )
      if (remoteRef.current) {
        postJson('/api/data', { resource: 'products', op: 'adjust-stock', id, delta }).catch((err) => persistError(err, '库存'))
      }
    },
    [persistError],
  )

  const addPurchaseOrder = useCallback(
    async (o: Omit<PurchaseOrder, 'id' | 'createdAt' | 'operator'>): Promise<PurchaseOrder> => {
      const entity = { ...o, createdAt: nowString(), operator: '王店长' }
      const created = (await createRow('purchaseOrders', entity)) as unknown as PurchaseOrder
      setPurchaseOrders((prev) => [created, ...prev])
      return created
    },
    [createRow],
  )

  const updatePurchaseOrder = useCallback(
    (id: string, patch: Partial<PurchaseOrder>) => {
      setPurchaseOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
      updateRow('purchaseOrders', id, patch)
    },
    [updateRow],
  )

  const addSaleOrderLocal = (input: Omit<SaleOrder, 'id' | 'createdAt'>): SaleOrder => {
    const order: SaleOrder = { ...input, id: localNextId('saleOrders'), createdAt: nowString() }
    setSaleOrders((prev) => [order, ...prev])
    setProducts((prev) =>
      prev.map((p) => {
        const line = order.items.find((i) => i.productId === p.id)
        return line ? { ...p, stock: Math.max(0, p.stock - line.quantity), updatedAt: nowString() } : p
      }),
    )
    return order
  }

  const applyProductPatches = (patches: { id: string; stock?: number; updatedAt?: string }[]) => {
    if (!Array.isArray(patches) || !patches.length) return
    setProducts((prev) =>
      prev.map((p) => {
        const patch = patches.find((x) => x.id === p.id)
        if (!patch) return p
        return { ...p, ...(patch.stock !== undefined ? { stock: patch.stock } : {}), ...(patch.updatedAt ? { updatedAt: patch.updatedAt } : {}) }
      }),
    )
  }

  const checkoutSale = useCallback(
    async (input: Omit<SaleOrder, 'id' | 'createdAt'>): Promise<SaleOrder | null> => {
      if (!remoteRef.current) return addSaleOrderLocal(input)
      const res = await runAction('checkout', { order: input })
      if (!res) return null
      const order = res.order as SaleOrder
      setSaleOrders((prev) => [order, ...prev])
      applyProductPatches(res.products)
      return order
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runAction],
  )

  const approveRefund = useCallback(
    async (refundId: string): Promise<{ refund: RefundRecord; order: SaleOrder | null } | null> => {
      if (!remoteRef.current) {
        // 本地演示：按原逻辑回滚库存、更新订单与退货单
        const refund = stateRef.current.refunds.find((r) => r.id === refundId)
        if (!refund || refund.status !== '待处理') return null
        refund.items.forEach((i) => adjustStock(i.productId, i.quantity))
        const order = stateRef.current.saleOrders.find((o) => o.id === refund.orderId)
        if (order) {
          const refunded = Math.round((order.refunded + refund.amount) * 100) / 100
          const status = refunded >= order.paid ? '已退款' : '部分退款'
          setSaleOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, refunded, status } : o)))
        }
        const handledAt = nowString()
        setRefunds((prev) => prev.map((r) => (r.id === refundId ? { ...r, status: '已退款', handledAt, stockRolledBack: true } : r)))
        return { refund: { ...refund, status: '已退款', handledAt, stockRolledBack: true }, order: order ?? null }
      }
      const res = await runAction('approve-refund', { refundId })
      if (!res) return null
      setRefunds((prev) => prev.map((r) => (r.id === refundId ? (res.refund as RefundRecord) : r)))
      if (res.order) {
        const order = res.order as SaleOrder
        setSaleOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)))
      }
      applyProductPatches(res.products)
      return { refund: res.refund as RefundRecord, order: (res.order as SaleOrder) ?? null }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runAction, adjustStock],
  )

  const confirmStockIn = useCallback(
    async (orderId: string | null, lines: StockInLine[]): Promise<StockInRecord | null> => {
      const receivable = lines.filter((l) => Number(l.receive) > 0)
      if (!receivable.length) return null
      if (!remoteRef.current) {
        receivable.forEach((l) => adjustStock(l.productId, Number(l.receive)))
        const items = lines.map((l) => ({
          productId: l.productId,
          name: l.name,
          spec: l.spec,
          unit: l.unit,
          quantity: l.orderedQty ?? Number(l.receive),
          received: l.alreadyIn + Number(l.receive),
          price: l.price ?? 0,
        }))
        const lineStatus = (l: StockInLine) => {
          const receive = Number(l.receive)
          const target = l.orderedQty == null ? null : l.orderedQty - l.alreadyIn
          return receive <= 0 ? '待收货' : target !== null && receive < target ? '部分入库' : '已入库'
        }
        const allIn = lines.every((l) => lineStatus(l) === '已入库')
        const order = orderId ? stateRef.current.purchaseOrders.find((o) => o.id === orderId) ?? null : null
        const record: StockInRecord = {
          id: localNextId('stockInRecords'),
          orderId,
          supplier: order ? order.supplier : orderId ? '未指定供应商' : '未关联采购单',
          status: allIn ? '已入库' : '部分入库',
          arrivedAt: nowString(),
          operator: '王店长',
          items,
        }
        if (order) {
          const merged = order.items.map((i) => {
            const line = lines.find((l) => l.productId === i.productId)
            return line ? { ...i, received: i.received + Number(line.receive) } : i
          })
          updatePurchaseOrder(order.id, {
            items: merged,
            status: merged.every((i) => i.received >= i.quantity) ? '已入库' : '部分入库',
          })
        }
        setStockInRecords((prev) => [record, ...prev])
        return record
      }
      const res = await runAction('confirm-stock-in', { orderId, lines })
      if (!res) return null
      const record = res.record as StockInRecord
      setStockInRecords((prev) => [record, ...prev])
      if (res.order) {
        const order = res.order as PurchaseOrder
        setPurchaseOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)))
      }
      applyProductPatches(res.products)
      return record
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runAction, adjustStock, localNextId, updatePurchaseOrder],
  )

  const updateSaleOrder = useCallback(
    (id: string, patch: Partial<SaleOrder>) => {
      setSaleOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
      updateRow('saleOrders', id, patch)
    },
    [updateRow],
  )

  const addRefund = useCallback(
    async (r: Omit<RefundRecord, 'id' | 'createdAt' | 'operator'>): Promise<RefundRecord> => {
      const entity = { ...r, createdAt: nowString(), operator: '王店长' }
      const created = (await createRow('refunds', entity)) as unknown as RefundRecord
      setRefunds((prev) => [created, ...prev])
      return created
    },
    [createRow],
  )

  const updateRefund = useCallback(
    (id: string, patch: Partial<RefundRecord>) => {
      setRefunds((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
      updateRow('refunds', id, patch)
    },
    [updateRow],
  )

  const addTask = useCallback(
    async (t: Omit<CollectTask, 'id' | 'createdAt' | 'operator'>): Promise<CollectTask> => {
      const entity = { ...t, createdAt: nowString(), operator: '王店长' }
      const created = (await createRow('tasks', entity)) as unknown as CollectTask
      setTasks((prev) => [created, ...prev])
      return created
    },
    [createRow],
  )

  const updateTask = useCallback(
    (id: string, patch: Partial<CollectTask>) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
      updateRow('tasks', id, patch)
    },
    [updateRow],
  )

  const updateReviewItem = useCallback(
    (id: string, patch: Partial<ReviewItem>) => {
      setReviewItemsState((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
      updateRow('reviewItems', id, patch)
    },
    [updateRow],
  )

  /** 分类 / 品牌：本地立即生效，远程由事务动作接管并回读列表 */
  const listAction = useCallback(
    async (kind: 'categories' | 'brands', op: string, extra: Record<string, unknown>, applyLocal: () => void) => {
      applyLocal()
      if (!remoteRef.current) return
      const res = await runAction('list-op', { kind, op, ...extra })
      if (res?.list) {
        if (kind === 'categories') setCategoryList(res.list as string[])
        else setBrandList(res.list as string[])
      }
    },
    [runAction],
  )

  const addCategory = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return Promise.resolve()
      return listAction('categories', 'add', { name: trimmed }, () => {
        setCategoryList((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
      })
    },
    [listAction],
  )

  const renameCategory = useCallback(
    (oldName: string, newName: string) => {
      const trimmed = newName.trim()
      if (!trimmed || oldName === trimmed) return Promise.resolve()
      return listAction('categories', 'rename', { oldName, newName: trimmed }, () => {
        setCategoryList((prev) => prev.map((c) => (c === oldName ? trimmed : c)))
        setProducts((prev) => prev.map((p) => (p.category === oldName ? { ...p, category: trimmed, updatedAt: nowString() } : p)))
      })
    },
    [listAction],
  )

  const deleteCategory = useCallback(
    (name: string) => {
      return listAction('categories', 'delete', { name }, () => {
        setCategoryList((prev) => prev.filter((c) => c !== name))
      })
    },
    [listAction],
  )

  const moveCategory = useCallback(
    (name: string, dir: -1 | 1) => {
      return listAction('categories', 'move', { name, dir }, () => {
        setCategoryList((prev) => {
          const i = prev.indexOf(name)
          const j = i + dir
          if (i < 0 || j < 0 || j >= prev.length) return prev
          const next = [...prev]
          const tmp = next[i]
          next[i] = next[j]
          next[j] = tmp
          return next
        })
      })
    },
    [listAction],
  )

  const addBrand = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return Promise.resolve()
      return listAction('brands', 'add', { name: trimmed }, () => {
        setBrandList((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
      })
    },
    [listAction],
  )

  const renameBrand = useCallback(
    (oldName: string, newName: string) => {
      const trimmed = newName.trim()
      if (!trimmed || oldName === trimmed) return Promise.resolve()
      return listAction('brands', 'rename', { oldName, newName: trimmed }, () => {
        setBrandList((prev) => prev.map((b) => (b === oldName ? trimmed : b)))
        setProducts((prev) => prev.map((p) => (p.brand === oldName ? { ...p, brand: trimmed, updatedAt: nowString() } : p)))
      })
    },
    [listAction],
  )

  const deleteBrand = useCallback(
    (name: string) => {
      return listAction('brands', 'delete', { name }, () => {
        setBrandList((prev) => prev.filter((b) => b !== name))
      })
    },
    [listAction],
  )

  const addSupplier = useCallback(
    async (s: Omit<SupplierDetail, 'id'>): Promise<SupplierDetail> => {
      const created = (await createRow('suppliers', s as unknown as Record<string, unknown>)) as unknown as SupplierDetail
      setSupplierList((prev) => [...prev, created])
      return created
    },
    [createRow],
  )

  const updateSupplier = useCallback(
    (id: string, patch: Partial<SupplierDetail>) => {
      setSupplierList((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
      updateRow('suppliers', id, patch)
    },
    [updateRow],
  )

  const addStaff = useCallback(
    async (s: Omit<StaffMember, 'id' | 'lastLoginAt'>): Promise<StaffMember> => {
      const created = (await createRow('staff', { ...s, lastLoginAt: null })) as unknown as StaffMember
      setStaffList((prev) => [...prev, created])
      return created
    },
    [createRow],
  )

  const updateStaff = useCallback(
    (id: string, patch: Partial<StaffMember>) => {
      setStaffList((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
      updateRow('staff', id, patch)
    },
    [updateRow],
  )

  const addStore = useCallback(
    async (s: Omit<StoreInfo, 'id' | 'monthSales'>): Promise<StoreInfo> => {
      const created = (await createRow('stores', { ...s, monthSales: 0 })) as unknown as StoreInfo
      setStoreList((prev) => [...prev, created])
      return created
    },
    [createRow],
  )

  const updateStore = useCallback(
    (id: string, patch: Partial<StoreInfo>) => {
      setStoreList((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
      updateRow('stores', id, patch)
    },
    [updateRow],
  )

  const addPriceLog = useCallback(
    async (l: Omit<PriceLog, 'id' | 'createdAt' | 'operator'>): Promise<PriceLog> => {
      const entity = { ...l, createdAt: nowString(), operator: '王建国' }
      const created = (await createRow('priceLogs', entity)) as unknown as PriceLog
      setPriceLogs((prev) => [created, ...prev])
      return created
    },
    [createRow],
  )

  const bulkPriceAdjust = useCallback(
    async (payload: { ids: string[]; field: string; changes: Record<string, number>; log: { field: string; mode: string; scope: string; affected: number } }) => {
      const applyLocal = () => {
        const stamp = nowString()
        setProducts((prev) =>
          prev.map((p) => {
            const next = payload.changes[p.id]
            if (next === undefined) return p
            return { ...p, [payload.field]: next, updatedAt: stamp } as Product
          }),
        )
        const log: PriceLog = {
          id: localNextId('priceLogs'),
          createdAt: stamp,
          field: (payload.log.field || payload.field) as PriceLog['field'],
          mode: payload.log.mode,
          scope: payload.log.scope,
          affected: payload.log.affected,
          operator: '王建国',
        }
        setPriceLogs((prev) => [log, ...prev])
      }
      if (!remoteRef.current) {
        applyLocal()
        return
      }
      const res = await runAction('bulk-price', payload)
      if (!res) return
      const stamp = res.stamp as string
      const field = res.field as string
      setProducts((prev) =>
        prev.map((p) => {
          const next = payload.changes[p.id]
          if (next === undefined) return p
          return { ...p, [field]: next, updatedAt: stamp } as Product
        }),
      )
      setPriceLogs((prev) => [res.log as PriceLog, ...prev])
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runAction, localNextId],
  )

  const setMeituanConnected = useCallback(
    (v: boolean) => {
      setMeituanConnectedState(v)
      persist('settings', 'set', { k: 'meituan', v: v ? '1' : '0' })
    },
    [persist],
  )

  const bulkUpdateProducts = useCallback(
    async (ids: string[], patch: Partial<Product>) => {
      if (!ids.length) return
      const next = { ...patch, updatedAt: nowString() }
      setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, ...next } : p)))
      if (remoteRef.current) {
        try {
          await postJson('/api/data', { resource: 'products', op: 'update-many', ids, patch: next })
        } catch (err) {
          persistError(err, '数据')
        }
      }
    },
    [persistError],
  )

  const saveSetting = useCallback(
    async (k: string, v: string) => {
      setSettings((prev) => ({ ...prev, [k]: v }))
      if (remoteRef.current) {
        try {
          await postJson('/api/data', { resource: 'settings', op: 'set', k, v })
        } catch (err) {
          persistError(err, '设置')
        }
      }
    },
    [persistError],
  )

  const applySafetyStock = useCallback(
    async (n: number) => {
      setProducts((prev) => prev.map((p) => ({ ...p, safetyStock: n })))
      if (remoteRef.current) {
        try {
          await postJson('/api/data', { resource: 'products', op: 'update-all', patch: { safetyStock: n } })
        } catch (err) {
          persistError(err, '设置')
        }
      }
    },
    [persistError],
  )

  const holdCart = useCallback(
    async (input: Omit<HeldOrder, 'id' | 'createdAt'>): Promise<HeldOrder | null> => {
      const created = (await createRow('heldOrders', { ...input, createdAt: nowString() })) as unknown as HeldOrder
      setHeldOrders((prev) => [created, ...prev])
      return created
    },
    [createRow],
  )

  const takeHeld = useCallback((id: string): HeldOrder | null => {
    const held = stateRef.current.heldOrders.find((h) => h.id === id)
    if (!held) return null
    setHeldOrders((prev) => prev.filter((h) => h.id !== id))
    persist('heldOrders', 'delete', { ids: [id] })
    return held
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persist])

  // 演示：「识别中」的采集任务进度缓慢推进（仅影响本地视图，不写库）
  useEffect(() => {
    const timer = setInterval(() => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.status !== '识别中') return t
          const progress = Math.min(t.progress + 3, 99)
          return { ...t, progress }
        }),
      )
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  const value = useMemo<DemoStore>(
    () => ({
      hydrated,
      storeId,
      setStoreId,
      currentStore: storeList.find((s) => s.id === storeId) ?? storeList[0],
      products,
      addProduct,
      updateProduct,
      deleteProducts,
      adjustStock,
      tasks,
      addTask,
      updateTask,
      reviewItems,
      updateReviewItem,
      purchaseOrders,
      addPurchaseOrder,
      updatePurchaseOrder,
      stockInRecords,
      saleOrders,
      updateSaleOrder,
      refunds,
      addRefund,
      updateRefund,
      checkoutSale,
      approveRefund,
      confirmStockIn,
      bulkPriceAdjust,
      bulkUpdateProducts,
      meituanConnected,
      setMeituanConnected,
      categoryList,
      addCategory,
      renameCategory,
      deleteCategory,
      moveCategory,
      brandList,
      addBrand,
      renameBrand,
      deleteBrand,
      supplierList,
      addSupplier,
      updateSupplier,
      staffList,
      addStaff,
      updateStaff,
      storeList,
      addStore,
      updateStore,
      priceLogs,
      addPriceLog,
      heldOrders,
      holdCart,
      takeHeld,
      settings,
      saveSetting,
      applySafetyStock,
    }),
    [
      hydrated,
      storeId,
      storeList,
      products,
      addProduct,
      updateProduct,
      deleteProducts,
      adjustStock,
      tasks,
      addTask,
      updateTask,
      reviewItems,
      updateReviewItem,
      purchaseOrders,
      addPurchaseOrder,
      updatePurchaseOrder,
      stockInRecords,
      saleOrders,
      updateSaleOrder,
      refunds,
      addRefund,
      updateRefund,
      checkoutSale,
      approveRefund,
      confirmStockIn,
      bulkPriceAdjust,
      bulkUpdateProducts,
      meituanConnected,
      setMeituanConnected,
      categoryList,
      addCategory,
      renameCategory,
      deleteCategory,
      moveCategory,
      brandList,
      addBrand,
      renameBrand,
      deleteBrand,
      supplierList,
      addSupplier,
      updateSupplier,
      staffList,
      addStaff,
      updateStaff,
      addStore,
      updateStore,
      priceLogs,
      addPriceLog,
      heldOrders,
      holdCart,
      takeHeld,
      settings,
      saveSetting,
      applySafetyStock,
    ],
  )

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>
}

export function useDemoStore() {
  const ctx = useContext(DemoStoreContext)
  if (!ctx) throw new Error('useDemoStore must be used within DemoStoreProvider')
  return ctx
}
