/**
 * 인증 컨텍스트 프로바이더
 *
 * 전역 인증 상태를 관리하고 하위 컴포넌트들에게 제공합니다.
 */
"use client"

import type React from "react"
import { createContext, useContext, type ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"
import type { User } from "@/lib/api"

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; message: string }>
  register: (userData: {
    username: string
    email: string
    password: string
    password_confirm: string
    first_name?: string
    last_name?: string
  }) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  updateProfile: (profileData: Partial<User>) => Promise<{ success: boolean; message: string }>
  changePassword: (passwordData: {
    old_password: string
    new_password: string
    new_password_confirm: string
  }) => Promise<{ success: boolean; message: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext는 AuthProvider 내에서 사용되어야 합니다.")
  }
  return context
}
