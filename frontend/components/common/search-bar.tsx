/**
 * SearchBar 컴포넌트
 *
 * 공용 검색 기능을 제공합니다.
 * 백엔드 core 앱의 검색 API를 사용합니다.
 */

'use client'

import { Search } from 'lucide-react'
import { useState, useCallback } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
  debounceMs?: number
}

export function SearchBar({
  onSearch,
  placeholder = '검색어를 입력하세요...',
  className = '',
  debounceMs = 300,
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // 디바운스된 검색 함수
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (query: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          onSearch(query)
        }, debounceMs)
      }
    })(),
    [onSearch, debounceMs],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    debouncedSearch(value)
  }

  return (
    <div className={`relative mx-auto max-w-md ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={searchTerm}
        placeholder={placeholder}
        onChange={handleInputChange}
        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-all duration-200 focus:border-blue-300 focus:outline-none focus:ring-0"
      />
    </div>
  )
}
