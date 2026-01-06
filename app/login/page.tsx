'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { User, Lock } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.length < 2 || phone.length !== 4) {
      alert('성함과 핸드폰 뒷 4자리를 정확히 입력해주세요.')
      return
    }

    setLoading(true)

    // 한글 이름을 안전하게 변환하여 이메일 형식 생성
    const safeName = encodeURIComponent(name).replace(/%/g, '').toLowerCase()
    const fakeEmail = `user${safeName}${phone}@gmail.com`
    const password = `${name}${phone}`

    // 해결 포인트 1: 타입을 any로 지정하여 TypeScript의 엄격한 검사를 통과시킵니다.
    let authData: any = null

    // 1. 로그인 시도
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: password,
    })

    if (signInError) {
      // 2. 로그인 실패 시(계정이 없으면) 회원가입 진행
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: password,
      })
      
      if (signUpError) {
        alert('로그인 오류: ' + signUpError.message)
        setLoading(false)
        return
      }
      // 해결 포인트 2: 회원가입 성공 시 데이터를 할당합니다.
      authData = signUpData
    } else {
      // 로그인 성공 시 데이터를 할당합니다.
      authData = signInData
    }

    // 3. 프로필 정보 업데이트 (upsert)
    if (authData?.user) {
      const { error } = await supabase.from('profiles').upsert({
        id: authData.user.id,     // Auth의 UID
        display_name: name        // 성함
      })
      if (error) console.error("프로필 저장 에러:", error.message)
    }

    setLoading(false)
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 p-6 font-sans">
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-10 shadow-2xl">
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-blue-600 rounded-3xl mb-4 shadow-lg shadow-blue-200">
            <span className="text-3xl font-bold text-white">⛪️</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">시선교회</h1>
          <p className="text-slate-500 font-bold tracking-tight">성경 통독 181일 캠페인</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <label className="text-[13px] font-black text-slate-700 ml-1 mb-2 block">성도 성함</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="이름을 입력하세요"
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-slate-200 focus:border-blue-600 focus:ring-0 outline-none text-slate-900 font-extrabold transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-[13px] font-black text-slate-700 ml-1 mb-2 block">핸드폰 번호 뒷 4자리</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                inputMode="numeric"
                placeholder="번호 4자리"
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-slate-200 focus:border-blue-600 focus:ring-0 outline-none text-slate-900 font-extrabold tracking-widest transition-all shadow-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={4}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all mt-6 text-lg"
          >
            {loading ? '연결 중...' : '통독 시작하기'}
          </button>
        </form>

        <div className="mt-10 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[11px] text-center text-slate-400 font-bold leading-relaxed">
            * 처음 오신 분은 입력하신 정보로 자동 가입됩니다.<br/>
            * 성함과 번호는 본인 확인용으로만 사용됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}