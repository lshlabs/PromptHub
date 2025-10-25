/**
 * SearchBar 컴포넌트
 *
 * 공용 검색 기능을 제공합니다.
 * 백엔드 core 앱의 검색 API를 사용합니다.
 */

'use client'

import { Search, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SearchBarProps {
  onSearch: (query: string, searchType?: string) => void
  placeholder?: string
  className?: string
}

const searchTypes = [
  { value: 'title', label: '제목' },
  { value: 'content', label: '내용' },
  { value: 'title_content', label: '제목+내용' },
]

export function SearchBar({
  onSearch,
  placeholder = '검색어를 입력하세요...',
  className = '',
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('title')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleSearch = () => {
    onSearch(searchTerm.trim(), searchType)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={`mx-auto flex max-w-2xl gap-2 ${className}`}>
      {/* 검색 타입 선택 드롭다운 */}
      <Select value={searchType} onValueChange={setSearchType}>
        <SelectTrigger className="w-32 rounded-xl border border-gray-200 bg-white text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {searchTypes.map(type => (
            <SelectItem key={type.value} value={type.value} className="text-sm">
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 검색 입력창 */}
      <div className="relative flex-1">
        <input
          type="text"
          value={searchTerm}
          placeholder={placeholder}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-12 text-sm transition-all duration-200 focus:border-blue-300 focus:outline-none focus:ring-0"
        />
        <button
          onClick={handleSearch}
          className="absolute inset-y-0 right-0 flex items-center rounded-r-xl pr-3 transition-colors duration-200">
          <Search className="h-4 w-4 text-gray-400 hover:text-blue-500" />
        </button>
      </div>
    </div>
  )
}
