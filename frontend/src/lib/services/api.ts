/**
 * API 서비스 통합
 * 모든 API 요청을 중앙에서 관리
 */

// 기본 API 클라이언트
class ApiClient {
  private baseURL: string
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
  }

  private getHeaders(includeAuth = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (includeAuth) {
      const token = localStorage.getItem('authToken')
      if (token) {
        headers.Authorization = `Token ${token}`
      }
    }
    
    return headers
  }

  async request<T>(
    endpoint: string, 
    options: RequestInit & { skipAuth?: boolean } = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const { skipAuth, ...fetchOptions } = options
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...this.getHeaders(!skipAuth),
        ...fetchOptions.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = localStorage.getItem('authToken')
    const headers: Record<string, string> = {}
    
    if (token) {
      headers.Authorization = `Token ${token}`
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }
}

// API 클라이언트 인스턴스
export const apiClient = new ApiClient()

// 인증 관련 API
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post('/auth/login/', credentials),
    
  register: (data: { username: string; email: string; password: string; password_confirm: string }) =>
    apiClient.post('/auth/register/', data),
    
  logout: () =>
    apiClient.post('/auth/logout/'),
    
  getProfile: () =>
    apiClient.get('/auth/profile/'),
    
  updateProfile: (data: any) =>
    apiClient.patch('/auth/profile/', data),
    
  checkUsername: (username: string) =>
    apiClient.get(`/auth/check-username/?username=${encodeURIComponent(username)}`),
    
  changePassword: (data: { current_password: string; new_password: string; new_password_confirm: string }) =>
    apiClient.post('/auth/change-password/', data),
    
  deleteAccount: (data: { confirmation: string }) =>
    apiClient.post('/auth/delete-account/', data),
}

// 기타 API들 (향후 확장용)
export const communityApi = {
  // 커뮤니티 관련 API들
}

export const promptApi = {
  // 프롬프트 관련 API들
} 