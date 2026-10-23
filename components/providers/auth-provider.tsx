'use client'

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { permissionModules, rolePermissions, type StaffRole } from '@/lib/mock-data'
import type { PermissionModule } from '@/lib/authz'

export type AuthUser = {
  id: string
  name: string
  account: string
  role: StaffRole
}

type AuthContextValue = {
  user: AuthUser
  /** 当前角色可见的权限模块 */
  modules: PermissionModule[]
  can: (module: PermissionModule) => boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** 由服务端 (app)/layout 注入当前登录用户；登出后整页跳转登录页 */
export function AuthProvider({ user, children }: { user: AuthUser; children: ReactNode }) {
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/login'
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const modules = (permissionModules as readonly string[]).filter((m) =>
      rolePermissions[user.role].includes(m as (typeof permissionModules)[number]),
    ) as PermissionModule[]
    return {
      user,
      modules,
      can: (module) => rolePermissions[user.role].includes(module),
      logout,
    }
  }, [user, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
