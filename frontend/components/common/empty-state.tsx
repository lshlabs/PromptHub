/**
 * EmptyState 컴포넌트
 *
 * 빈 상태를 표시하는 공통 컴포넌트입니다.
 */

'use client';

import { Button } from '@/components/ui/button';
import { FolderOpen, Search, FileText, Users, Bookmark, TrendingUp } from 'lucide-react';

interface EmptyStateProps {
  type?: 'posts' | 'search' | 'reviews' | 'users' | 'bookmark' | 'trending' | 'user-posts';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  type = 'posts',
  title,
  description,
  actionText,
  onAction,
  className = '',
}: EmptyStateProps) {
  const getDefaultContent = () => {
    switch (type) {
      case 'posts':
        return {
          icon: FileText,
          defaultTitle: '게시글이 없습니다',
          defaultDescription: '아직 작성된 게시글이 없습니다. 첫 번째 게시글을 작성해보세요!',
          defaultActionText: '게시글 작성하기',
        };
      case 'search':
        return {
          icon: Search,
          defaultTitle: '검색 결과가 없습니다',
          defaultDescription: '검색 조건에 맞는 결과를 찾을 수 없습니다. 다른 키워드로 검색해보세요.',
          defaultActionText: '다시 검색하기',
        };
      case 'reviews':
        return {
          icon: FileText,
          defaultTitle: '리뷰가 없습니다',
          defaultDescription: '아직 작성된 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!',
          defaultActionText: '리뷰 작성하기',
        };
      case 'users':
        return {
          icon: Users,
          defaultTitle: '사용자가 없습니다',
          defaultDescription: '아직 등록된 사용자가 없습니다.',
          defaultActionText: '사용자 초대하기',
        };
      case 'bookmark':
        return {
          icon: Bookmark,
          defaultTitle: '아직 북마크한 프롬프트가 없습니다',
          defaultDescription: '마음에 드는 프롬프트를 북마크해서 나중에 쉽게 찾아보세요',
          defaultActionText: '프롬프트 둘러보기',
        };
      case 'trending':
        return {
          icon: TrendingUp,
          defaultTitle: '트렌딩 게시글이 없습니다',
          defaultDescription: '곧 새로운 트렌딩 게시글이 나타날 예정입니다!',
          defaultActionText: '',
        };
      case 'user-posts':
        return {
          icon: FileText,
          defaultTitle: '아직 작성한 리뷰가 없습니다',
          defaultDescription: '첫 번째 리뷰를 작성해보세요!',
          defaultActionText: '리뷰 작성하기',
        };
      default:
        return {
          icon: FolderOpen,
          defaultTitle: '데이터가 없습니다',
          defaultDescription: '표시할 데이터가 없습니다.',
          defaultActionText: '새로 만들기',
        };
    }
  };

  const content = getDefaultContent();
  const Icon = content.icon;

  return (
    <div className={`py-12 text-center ${className}`}>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">{title || content.defaultTitle}</h3>
      <p className="mx-auto mb-6 max-w-md text-gray-600">{description || content.defaultDescription}</p>
      {actionText && onAction && (
        <Button
          onClick={onAction}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700">
          {actionText || content.defaultActionText}
        </Button>
      )}
    </div>
  );
}
