'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AccountInfoSection } from '@/components/profile/settings/account-info-section'
import { NotificationSection } from '@/components/profile/settings/notification-section'
import { PrivacySection } from '@/components/profile/settings/privacy-section'
import { SecuritySection } from '@/components/profile/settings/security-section'
import { AccountManagement } from '@/components/profile/settings/account-management'
import { useAuthContext } from '@/features/auth'
import { authApi } from '@/lib/api/auth'

export default function SettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuthContext()

  // State for all settings fields
  const accountEmail = user?.email ?? ''
  const [accountNotificationsEnabled, setAccountNotificationsEnabled] = useState(true)
  const [accountInAppNotificationsEnabled, setAccountInAppNotificationsEnabled] = useState(true)
  const [accountPublicProfile, setAccountPublicProfile] = useState(true)
  const [accountDataSharing, setAccountDataSharing] = useState(false)
  const [securityTwoFactorAuth, setSecurityTwoFactorAuth] = useState(false)

  // 초기 설정 로드
  useEffect(() => {
    const initSettings = async () => {
      try {
        const s = await authApi.getSettings()
        setAccountNotificationsEnabled(!!s.email_notifications_enabled)
        setAccountInAppNotificationsEnabled(!!s.in_app_notifications_enabled)
        setAccountPublicProfile(!!s.public_profile)
        setAccountDataSharing(!!s.data_sharing)
        setSecurityTwoFactorAuth(!!s.two_factor_auth_enabled)
      } catch (e) {
        console.error('설정 로드 실패:', e)
      }
    }
    initSettings()
  }, [])

  const handleBack = () => {
    router.back()
  }

  // 실시간 저장 함수들
  const handleNotificationsChange = async (value: boolean) => {
    const prev = accountNotificationsEnabled
    setAccountNotificationsEnabled(value)
    try {
      await authApi.updateSettings({ email_notifications_enabled: value })
    } catch (e) {
      setAccountNotificationsEnabled(prev)
      alert('설정 저장 중 오류가 발생했습니다.')
    }
  }

  const handleInAppNotificationsChange = async (value: boolean) => {
    const prev = accountInAppNotificationsEnabled
    setAccountInAppNotificationsEnabled(value)
    try {
      await authApi.updateSettings({ in_app_notifications_enabled: value })
    } catch (e) {
      setAccountInAppNotificationsEnabled(prev)
      alert('설정 저장 중 오류가 발생했습니다.')
    }
  }

  const handlePublicProfileChange = async (value: boolean) => {
    const prev = accountPublicProfile
    setAccountPublicProfile(value)
    try {
      await authApi.updateSettings({ public_profile: value })
    } catch (e) {
      setAccountPublicProfile(prev)
      alert('설정 저장 중 오류가 발생했습니다.')
    }
  }

  const handleDataSharingChange = async (value: boolean) => {
    const prev = accountDataSharing
    setAccountDataSharing(value)
    try {
      await authApi.updateSettings({ data_sharing: value })
    } catch (e) {
      setAccountDataSharing(prev)
      alert('설정 저장 중 오류가 발생했습니다.')
    }
  }

  const handleTwoFactorAuthChange = async (value: boolean) => {
    const prev = securityTwoFactorAuth
    setSecurityTwoFactorAuth(value)
    try {
      await authApi.updateSettings({ two_factor_auth_enabled: value })
    } catch (e) {
      setSecurityTwoFactorAuth(prev)
      alert('설정 저장 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteAccount = async (confirmation: string) => {
    if (confirmation !== '계정 삭제') {
      alert('확인 문구를 정확히 입력해주세요.')
      return
    }
    try {
      const res = await authApi.deleteAccount(confirmation)
      alert(res.message || '계정이 성공적으로 삭제되었습니다.')
      await logout()
      router.push('/auth/login')
    } catch (error: any) {
      const message = error?.message || '계정 삭제 중 오류가 발생했습니다.'
      alert(message)
    }
  }

  const handleTerminateSession = (sessionId: number) => {
    console.log('세션 종료:', sessionId)
    alert('세션이 종료되었습니다.')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl space-y-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4 flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            뒤로 가기
          </Button>
          <Card className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <CardHeader className="p-6 pb-0">
              <CardTitle className="text-2xl font-bold text-gray-900">설정</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid gap-8 p-6">
                <AccountInfoSection email={accountEmail} />

                <Separator />

                <NotificationSection
                  emailNotificationsEnabled={accountNotificationsEnabled}
                  inAppNotificationsEnabled={accountInAppNotificationsEnabled}
                  onEmailNotificationsChange={handleNotificationsChange}
                  onInAppNotificationsChange={handleInAppNotificationsChange}
                />

                <Separator />

                <PrivacySection
                  publicProfile={accountPublicProfile}
                  dataSharing={accountDataSharing}
                  onPublicProfileChange={handlePublicProfileChange}
                  onDataSharingChange={handleDataSharingChange}
                />

                <Separator />

                <SecuritySection
                  twoFactorAuth={securityTwoFactorAuth}
                  onTwoFactorAuthChange={handleTwoFactorAuthChange}
                  onTerminateSession={handleTerminateSession}
                />

                <Separator />

                <AccountManagement onDeleteAccount={handleDeleteAccount} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
