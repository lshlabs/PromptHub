/**
 * ProfileHeader 컴포넌트
 *
 * 프로필 페이지의 헤더 섹션을 표시합니다.
 */

'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Settings, Edit } from 'lucide-react';

interface ProfileHeaderProps {
  username: string;
  userInitial: string;
  avatarColor: string;
  postCount: number;
  likeCount: number;
  onEditProfile?: () => void;
  onSettings?: () => void;
}

export function ProfileHeader({
  username,
  userInitial,
  avatarColor,
  postCount,
  likeCount,
  onEditProfile,
  onSettings,
}: ProfileHeaderProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-4 ring-gray-100">
              <AvatarFallback className="text-lg font-bold text-white" style={{ backgroundColor: avatarColor }}>
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="mb-1 text-2xl font-bold text-gray-900">{username}</h1>
              <p className="text-sm text-gray-600">프롬프트 리뷰어</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEditProfile && (
              <Button variant="outline" size="sm" onClick={onEditProfile} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                프로필 수정
              </Button>
            )}
            {onSettings && (
              <Button variant="ghost" size="sm" onClick={onSettings} className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                설정
              </Button>
            )}
          </div>
        </div>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
            <div className="mb-1 text-2xl font-bold text-blue-700">{postCount}</div>
            <p className="text-sm font-medium text-blue-600">작성한 리뷰</p>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center">
            <div className="mb-1 text-2xl font-bold text-green-700">{likeCount}</div>
            <p className="text-sm font-medium text-green-600">받은 좋아요</p>
          </div>
        </div>
      </div>
    </div>
  );
}
