'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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

type DemoStore = {
  storeId: string
  setStoreId: (id: string) => void
  currentStore: (typeof stores)[number]
  products: Product[]
  addProduct: (p: Omit<Product, 'id' | 'updatedAt'>) => Product
  updateProduct: (id: string, patch: Partial<Product>) => void
  deleteProducts: (ids: string[]) => void
  adjustStock: (id: string, delta: number) => void
  tasks: CollectTask[]
  addTask: (t: Omit<CollectTask, 'id' | 'createdAt' | 'operator'>) => CollectTask
  updateTask: (id: string, patch: Partial<CollectTask>) => void
  reviewItems: ReviewItem[]
  updateReviewItem: (id: string, patch: Partial<ReviewItem>) => void
  setReviewItems: (updater: (items: ReviewItem[]) => ReviewItem[]) => void
  purchaseOrders: PurchaseOrder[]
  addPurchaseOrder: (o: Omit<PurchaseOrder, 'id' | 'createdAt' | 'operator'>) => PurchaseOrder
  updatePurchaseOrder: (id: string, patch: Partial<PurchaseOrder>) => void
  stockInRecords: StockInRecord[]
  addStockInRecord: (r: Omit<StockInRecord, 'id' | 'arrivedAt' | 'operator'>) => StockInRecord
  saleOrders: SaleOrder[]
  addSaleOrder: (o: Omit<SaleOrder, 'id' | 'createdAt'>) => SaleOrder
  updateSaleOrder: (id: string, patch: Partial<SaleOrder>) => void
  refunds: RefundRecord[]
  addRefund: (r: Omit<RefundRecord, 'id' | 'createdAt' | 'operator'>) => RefundRecord
  updateRefund: (id: string, patch: Partial<RefundRecord>) => void
  meituanConnected: boolean
  setMeituanConnected: (v: boolean) => void
  categoryList: string[]
  addCategory: (name: string) => void
  renameCategory: (oldName: string, newName: string) => void
  deleteCategory: (name: string) => void
  moveCategory: (name: string, dir: -1 | 1) => void
  brandList: string[]
  addBrand: (name: string) => void
  renameBrand: (oldName: string, newName: string) => void
  deleteBrand: (name: string) => void
  supplierList: SupplierDetail[]
  addSupplier: (s: Omit<SupplierDetail, 'id'>) => SupplierDetail
  updateSupplier: (id: string, patch: Partial<SupplierDetail>) => void
  staffList: StaffMember[]
  addStaff: (s: Omit<StaffMember, 'id' | 'lastLoginAt'>) => StaffMember
  updateStaff: (id: string, patch: Partial<StaffMember>) => void
  storeList: StoreInfo[]
  addStore: (s: Omit<StoreInfo, 'id' | 'monthSales'>) => StoreInfo
  updateStore: (id: string, patch: Partial<StoreInfo>) => void
  priceLogs: PriceLog[]
  addPriceLog: (l: Omit<PriceLog, 'id' | 'createdAt' | 'operator'>) => PriceLog
}

const DemoStoreContext = createContext<DemoStore | null>(null)

function nowString() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreId] = useState(stores[0].id)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [tasks, setTasks] = useState<CollectTask[]>(initialTasks)
  const [reviewItems, setReviewItemsState] = useState<ReviewItem[]>(initialReviewItems)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders)
  const [stockInRecords, setStockInRecords] = useState<StockInRecord[]>(initialStockInRecords)
  const [saleOrders, setSaleOrders] = useState<SaleOrder[]>(initialSaleOrders)
  const [refunds, setRefunds] = useState<RefundRecord[]>(initialRefunds)
  const [meituanConnected, setMeituanConnected] = useState(false)
  const [categoryList, setCategoryList] = useState<string[]>(categories)
  const [brandList, setBrandList] = useState<string[]>(brands)
  const [supplierList, setSupplierList] = useState<SupplierDetail[]>(initialSupplierDetails)
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff)
  const [storeList, setStoreList] = useState<StoreInfo[]>(stores)
  const [priceLogs, setPriceLogs] = useState<PriceLog[]>(initialPriceLogs)
  const seq = useRef(100)

  const addProduct = useCallback((p: Omit<Product, 'id' | 'updatedAt'>) => {
    seq.current += 1
    const product: Product = { ...p, id: `P${10000 + seq.current}`, updatedAt: nowString() }
    setProducts((prev) => [product, ...prev])
    return product
  }, [])

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: nowString() } : p)))
  }, [])

  const deleteProducts = useCallback((ids: string[]) => {
    setProducts((prev) => prev.filter((p) => !ids.includes(p.id)))
  }, [])

  const adjustStock = useCallback((id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta), updatedAt: nowString() } : p)),
    )
  }, [])

  const addPurchaseOrder = useCallback((o: Omit<PurchaseOrder, 'id' | 'createdAt' | 'operator'>) => {
    seq.current += 1
    const order: PurchaseOrder = {
      ...o,
      id: `PO20261020${String(seq.current).padStart(3, '0')}`,
      createdAt: nowString(),
      operator: '王店长',
    }
    setPurchaseOrders((prev) => [order, ...prev])
    return order
  }, [])

  const updatePurchaseOrder = useCallback((id: string, patch: Partial<PurchaseOrder>) => {
    setPurchaseOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }, [])

  const addStockInRecord = useCallback((r: Omit<StockInRecord, 'id' | 'arrivedAt' | 'operator'>) => {
    seq.current += 1
    const record: StockInRecord = {
      ...r,
      id: `SI20261020${String(seq.current).padStart(3, '0')}`,
      arrivedAt: nowString(),
      operator: '王店长',
    }
    setStockInRecords((prev) => [record, ...prev])
    return record
  }, [])

  const addSaleOrder = useCallback((o: Omit<SaleOrder, 'id' | 'createdAt'>) => {
    seq.current += 1
    const order: SaleOrder = { ...o, id: `SO20261020${String(seq.current).padStart(3, '0')}`, createdAt: nowString() }
    setSaleOrders((prev) => [order, ...prev])
    return order
  }, [])

  const updateSaleOrder = useCallback((id: string, patch: Partial<SaleOrder>) => {
    setSaleOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }, [])

  const addRefund = useCallback((r: Omit<RefundRecord, 'id' | 'createdAt' | 'operator'>) => {
    seq.current += 1
    const record: RefundRecord = {
      ...r,
      id: `RF20261020${String(seq.current).padStart(3, '0')}`,
      createdAt: nowString(),
      operator: '王店长',
    }
    setRefunds((prev) => [record, ...prev])
    return record
  }, [])

  const updateRefund = useCallback((id: string, patch: Partial<RefundRecord>) => {
    setRefunds((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const addTask = useCallback((t: Omit<CollectTask, 'id' | 'createdAt' | 'operator'>) => {
    seq.current += 1
    const task: CollectTask = {
      ...t,
      id: `AT20261020${String(seq.current).padStart(3, '0')}`,
      createdAt: nowString(),
      operator: '王店长',
    }
    setTasks((prev) => [task, ...prev])
    return task
  }, [])

  const updateTask = useCallback((id: string, patch: Partial<CollectTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const updateReviewItem = useCallback((id: string, patch: Partial<ReviewItem>) => {
    setReviewItemsState((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const setReviewItems = useCallback((updater: (items: ReviewItem[]) => ReviewItem[]) => {
    setReviewItemsState(updater)
  }, [])

  const addCategory = useCallback((name: string) => {
    setCategoryList((prev) => (prev.includes(name) ? prev : [...prev, name]))
  }, [])

  const renameCategory = useCallback((oldName: string, newName: string) => {
    setCategoryList((prev) => prev.map((c) => (c === oldName ? newName : c)))
    setProducts((prev) => prev.map((p) => (p.category === oldName ? { ...p, category: newName, updatedAt: nowString() } : p)))
  }, [])

  const deleteCategory = useCallback((name: string) => {
    setCategoryList((prev) => prev.filter((c) => c !== name))
  }, [])

  const moveCategory = useCallback((name: string, dir: -1 | 1) => {
    setCategoryList((prev) => {
      const i = prev.indexOf(name)
      const j = i + dir
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }, [])

  const addBrand = useCallback((name: string) => {
    setBrandList((prev) => (prev.includes(name) ? prev : [...prev, name]))
  }, [])

  const renameBrand = useCallback((oldName: string, newName: string) => {
    setBrandList((prev) => prev.map((b) => (b === oldName ? newName : b)))
    setProducts((prev) => prev.map((p) => (p.brand === oldName ? { ...p, brand: newName, updatedAt: nowString() } : p)))
  }, [])

  const deleteBrand = useCallback((name: string) => {
    setBrandList((prev) => prev.filter((b) => b !== name))
  }, [])

  const addSupplier = useCallback((s: Omit<SupplierDetail, 'id'>) => {
    seq.current += 1
    const supplier: SupplierDetail = { ...s, id: `SUP${String(seq.current).padStart(2, '0')}` }
    setSupplierList((prev) => [supplier, ...prev])
    return supplier
  }, [])

  const updateSupplier = useCallback((id: string, patch: Partial<SupplierDetail>) => {
    setSupplierList((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const addStaff = useCallback((s: Omit<StaffMember, 'id' | 'lastLoginAt'>) => {
    seq.current += 1
    const member: StaffMember = { ...s, id: `E${String(seq.current).padStart(3, '0')}`, lastLoginAt: null }
    setStaffList((prev) => [member, ...prev])
    return member
  }, [])

  const updateStaff = useCallback((id: string, patch: Partial<StaffMember>) => {
    setStaffList((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const addStore = useCallback((s: Omit<StoreInfo, 'id' | 'monthSales'>) => {
    seq.current += 1
    const store: StoreInfo = { ...s, id: `s${seq.current}`, monthSales: 0 }
    setStoreList((prev) => [...prev, store])
    return store
  }, [])

  const updateStore = useCallback((id: string, patch: Partial<StoreInfo>) => {
    setStoreList((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const addPriceLog = useCallback((l: Omit<PriceLog, 'id' | 'createdAt' | 'operator'>) => {
    seq.current += 1
    const log: PriceLog = { ...l, id: `PL20261020${String(seq.current).padStart(3, '0')}`, createdAt: nowString(), operator: '王建国' }
    setPriceLogs((prev) => [log, ...prev])
    return log
  }, [])

  // 演示：「识别中」的 Excel 任务进度缓慢推进
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
      setReviewItems,
      purchaseOrders,
      addPurchaseOrder,
      updatePurchaseOrder,
      stockInRecords,
      addStockInRecord,
      saleOrders,
      addSaleOrder,
      updateSaleOrder,
      refunds,
      addRefund,
      updateRefund,
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
    }),
    [storeId, products, addProduct, updateProduct, deleteProducts, adjustStock, tasks, addTask, updateTask, reviewItems, updateReviewItem, setReviewItems, purchaseOrders, addPurchaseOrder, updatePurchaseOrder, stockInRecords, addStockInRecord, saleOrders, addSaleOrder, updateSaleOrder, refunds, addRefund, updateRefund, meituanConnected, categoryList, addCategory, renameCategory, deleteCategory, moveCategory, brandList, addBrand, renameBrand, deleteBrand, supplierList, addSupplier, updateSupplier, staffList, addStaff, updateStaff, storeList, addStore, updateStore, priceLogs, addPriceLog],
  )

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>
}

export function useDemoStore() {
  const ctx = useContext(DemoStoreContext)
  if (!ctx) throw new Error('useDemoStore must be used within DemoStoreProvider')
  return ctx
}
