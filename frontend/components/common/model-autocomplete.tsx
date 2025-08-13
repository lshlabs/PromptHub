'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { postsApi } from '@/lib/api/posts'
import type { ModelSuggestion } from '@/types/api'

interface ModelAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onInputChange?: (value: string) => void // 입력값 변경 시 호출
  onModelSelect?: (value: string) => void // 드롭다운에서 모델 선택 시 호출
  onCustomModelToggle?: (isCustom: boolean) => void
  platformId?: number
  placeholder?: string
  className?: string
  disabled?: boolean
  showCustomOption?: boolean
}

export default function ModelAutocomplete({
  value,
  onChange,
  onInputChange,
  onModelSelect,
  onCustomModelToggle,
  platformId,
  placeholder = '모델명을 입력하세요...',
  className = '',
  disabled = false,
  showCustomOption = false,
}: ModelAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<ModelSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()
  const suppressDropdownRef = useRef<boolean>(false)

  // value prop이 변경될 때 inputValue 동기화
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // 자동완성 검색 함수
  const fetchSuggestions = async (query: string) => {
    // X 클릭 직후에는 드롭다운을 강제로 닫고 검색도 중단
    if (suppressDropdownRef.current) {
      setSuggestions([])
      setIsOpen(false)
      return
    }
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    try {
      setLoading(true)
      const response = await postsApi.getModelSuggestions({
        query: query.trim(),
        platform_id: platformId,
        limit: 8,
      })

      if (response.status === 'success') {
        setSuggestions(response.data.suggestions)
        // 검색결과가 없어도 직접 입력 옵션을 보여주기 위해 드롭다운을 연다
        const hasResults = response.data.suggestions.length > 0
        const canShowCustom = showCustomOption && query.trim().length >= 2
        setIsOpen(hasResults || canShowCustom)
        setSelectedIndex(-1)
      } else {
        setSuggestions([])
        // 오류 시에는 닫음
        setIsOpen(false)
      }
    } catch (error) {
      console.error('모델 자동완성 검색 실패:', error)
      setSuggestions([])
      setIsOpen(false)
    } finally {
      setLoading(false)
    }
  }

  // 드롭다운 위치 계산
  const updateDropdownPosition = () => {
    if (inputRef.current && containerRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()

      setDropdownPosition({
        top: inputRect.bottom + window.scrollY,
        left: inputRect.left + window.scrollX,
        width: inputRect.width,
      })
    }
  }

  // 디바운싱 처리된 입력 핸들러
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)

    // onChange는 항상 호출 (부모 컴포넌트의 value prop 동기화를 위해)
    onChange(newValue)

    // 입력이 다시 시작되면 드롭다운 표시 억제 해제
    if (newValue.trim().length > 0) {
      suppressDropdownRef.current = false
    }

    // 입력 변경 콜백 호출 (선택이 아닌 직접 입력)
    if (onInputChange) {
      onInputChange(newValue)
    }

    // 드롭다운 위치 업데이트
    updateDropdownPosition()

    // 디바운스 클리어
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // 500ms 후 검색 실행
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 500)
  }

  // 제안 항목 선택
  const selectSuggestion = (suggestion: ModelSuggestion) => {
    const selectedName = suggestion.name
    console.log('ModelAutocomplete - selectSuggestion:', {
      selectedName,
      suggestionId: suggestion.id,
      platform: suggestion.platform.name,
    })

    // 기본 모델 이름을 입력창에 채우되, 이후 사용자가 상세명을 자유롭게 수정할 수 있게 둠
    setInputValue(selectedName)
    onChange(selectedName)

    // 모델 선택 콜백 호출 (드롭다운에서 실제 선택)
    if (onModelSelect) {
      onModelSelect(selectedName)
    }

    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % suggestions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // 외부 클릭 감지 및 리사이즈 처리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition()
      }
    }

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [isOpen])

  // 드롭다운이 열릴 때 위치 업데이트
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition()
    }
  }, [isOpen])

  // 입력 필드 클리어
  const clearInput = () => {
    console.log('ModelAutocomplete - clearInput called')
    // X 클릭 시 드롭다운 표시 억제 플래그 활성화
    suppressDropdownRef.current = true
    setInputValue('')
    onChange('')

    // 클리어 시에도 onInputChange 호출 (빈 문자열로)
    if (onInputChange) {
      onInputChange('')
    }

    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // 드롭다운 컴포넌트
  const DropdownContent = () => {
    if (!isOpen || (!suggestions.length && !showCustomOption && suggestions.length === 0)) {
      return null
    }

    if (suggestions.length === 0 && !loading && inputValue.length >= 2 && !showCustomOption) {
      return (
        <div
          ref={dropdownRef}
          className="pointer-events-auto rounded-xl border border-gray-200 bg-white shadow-lg"
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onMouseDown={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onWheel={e => {
            e.stopPropagation()
          }}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 99999,
            pointerEvents: 'auto',
          }}>
          <div
            className="px-4 py-3 text-center text-sm text-gray-500"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}>
            "{inputValue}"와(과) 일치하는 모델을 찾을 수 없습니다.
          </div>
        </div>
      )
    }

    if (suggestions.length > 0 || showCustomOption) {
      return (
        <div
          ref={dropdownRef}
          className="pointer-events-auto rounded-xl border border-gray-200 bg-white shadow-lg"
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onMouseDown={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onWheel={e => {
            // 스크롤 이벤트는 드롭다운 내부에서만 처리되도록 함
            e.stopPropagation()
          }}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 99999,
            pointerEvents: 'auto',
          }}>
          <div
            className="max-h-64 overflow-y-auto py-1"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onWheel={e => {
              // 스크롤 이벤트는 차단하지 않고 전파만 방지
              e.stopPropagation()
            }}>
            {/* 제안된 모델들 */}
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  selectSuggestion(suggestion)
                }}
                onMouseDown={e => {
                  e.preventDefault()
                }}
                className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${index === selectedIndex ? 'bg-blue-100' : ''} `}
                style={{ pointerEvents: 'auto' }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{suggestion.name}</div>
                    <div className="text-xs text-gray-500">{suggestion.platform.name}</div>
                  </div>
                </div>
              </button>
            ))}

            {/* 커스텀 모델 옵션 */}
            {showCustomOption && inputValue.length >= 2 && (
              <>
                {suggestions.length > 0 && <div className="my-1 border-t border-gray-100"></div>}
                <button
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    onCustomModelToggle?.(true)
                    setIsOpen(false)
                  }}
                  onMouseDown={e => {
                    e.preventDefault()
                  }}
                  className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-orange-50 focus:bg-orange-50 focus:outline-none"
                  style={{ pointerEvents: 'auto' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-orange-600">사용한 모델이 없나요?</div>
                      <div className="text-xs text-orange-500">직접 모델명을 입력하세요</div>
                    </div>
                    <div className="ml-2 text-xs text-orange-400">직접입력</div>
                  </div>
                </button>
              </>
            )}
          </div>

          {/* 푸터 */}
          <div
            className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}>
            {suggestions.length}개 모델 발견
            {showCustomOption && inputValue.length >= 2 && ' • 또는 직접 입력'}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <>
      <div ref={containerRef} className={`relative ${className}`}>
        {/* 입력 필드 */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-400" />
            ) : (
              <Search className="h-4 w-4 text-gray-400" />
            )}
          </div>

          <Input
            ref={inputRef}
            value={inputValue}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suppressDropdownRef.current) {
                return
              }
              const canShowCustom = showCustomOption && inputValue.trim().length >= 2
              if (suggestions.length > 0 || canShowCustom) {
                setIsOpen(true)
                updateDropdownPosition()
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full rounded-xl border-gray-200 bg-gray-50 pl-10 pr-10 text-xs focus:border-blue-300 focus:ring-0 sm:text-sm ${disabled ? 'cursor-not-allowed bg-gray-100' : ''} `}
          />

          {/* 클리어 버튼 */}
          {inputValue && !disabled && (
            <button
              onClick={clearInput}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 포탈을 사용한 드롭다운 렌더링 */}
      {typeof window !== 'undefined' && createPortal(<DropdownContent />, document.body)}
    </>
  )
}
