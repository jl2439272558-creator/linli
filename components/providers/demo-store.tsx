'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  initialProducts,
  initialReviewItems,
  initialTasks,
  stores,
  type CollectTask,
  type Product,
  type ReviewItem,
} from '@/lib/mock-data'

type DemoStore = {
  storeId: string
  setStoreId: (id: string) => void
  currentStore: (typeof stores)[number]
  products: Product[]
  addProduct: (p: Omit<Product, 'id' | 'updatedAt'>) => Product
  updateProduct: (id: string, patch: Partial<Product>) => void
  deleteProducts: (ids: string[]) => void
  tasks: CollectTask[]
  addTask: (t: Omit<CollectTask, 'id' | 'createdAt' | 'operator'>) => CollectTask
  updateTask: (id: string, patch: Partial<CollectTask>) => void
  reviewItems: ReviewItem[]
  updateReviewItem: (id: string, patch: Partial<ReviewItem>) => void
  setReviewItems: (updater: (items: ReviewItem[]) => ReviewItem[]) => void
  meituanConnected: boolean
  setMeituanConnected: (v: boolean) => void
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
  const [meituanConnected, setMeituanConnected] = useState(false)
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
      currentStore: stores.find((s) => s.id === storeId) ?? stores[0],
      products,
      addProduct,
      updateProduct,
      deleteProducts,
      tasks,
      addTask,
      updateTask,
      reviewItems,
      updateReviewItem,
      setReviewItems,
      meituanConnected,
      setMeituanConnected,
    }),
    [storeId, products, addProduct, updateProduct, deleteProducts, tasks, addTask, updateTask, reviewItems, updateReviewItem, setReviewItems, meituanConnected],
  )

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>
}

export function useDemoStore() {
  const ctx = useContext(DemoStoreContext)
  if (!ctx) throw new Error('useDemoStore must be used within DemoStoreProvider')
  return ctx
}
