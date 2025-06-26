/**
 * 로그인 페이지
 */
import LoginForm from "@/components/forms/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">PromptHub에 로그인</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            또는{" "}
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              새 계정 만들기
            </a>
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
