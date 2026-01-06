'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Check, Volume2, PartyPopper, X, ChevronLeft, CheckSquare, Square, Users } from 'lucide-react'
import confetti from 'canvas-confetti'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('성도')
  const [allSchedules, setAllSchedules] = useState<any[]>([])
  const [readHistory, setReadHistory] = useState<string[]>([])
  const [rankings, setRankings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [modalType, setModalType] = useState<'past' | null>(null)
  const [modalList, setModalList] = useState<any[]>([])
  const [tempSelected, setTempSelected] = useState<string[]>([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationDay, setCelebrationDay] = useState(0)

  const totalDays = 181
  const todayStr = new Date().toISOString().split('T')[0]

  const getRainbowColor = (index: number) => {
    const hue = (index / totalDays) * 280
    return `hsl(${hue}, 80%, 65%)`
  }

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) { router.push('/login'); return; }
    setUser(currentUser)
    fetchData(currentUser)
  }

  async function fetchData(currentUser: any) {
    const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', currentUser.id).maybeSingle()
    if (profile?.display_name) setUserName(profile.display_name)

    const { data: schedules } = await supabase.from('schedules').select('*').order('date', { ascending: true })
    if (schedules) setAllSchedules(schedules)

    const { data: history } = await supabase.from('progress').select('date').eq('user_id', currentUser.id)
    if (history) setReadHistory(history.map(h => h.date))

    await fetchRankings()
    setLoading(false)
  }

  async function fetchRankings() {
    const { data: allProgress } = await supabase.from('progress').select('user_id')
    const { data: allProfiles } = await supabase.from('profiles').select('id, display_name')
    if (allProgress && allProfiles) {
      const counts = allProgress.reduce((acc: any, cur: any) => { acc[cur.user_id] = (acc[cur.user_id] || 0) + 1; return acc; }, {})
      const sorted = Object.keys(counts).map(uid => ({ name: allProfiles.find(p => p.id === uid)?.display_name || '성도', count: counts[uid] })).sort((a, b) => b.count - a.count)
      setRankings(sorted)
    }
  }

  const playSound = (day: number) => {
    const fileName = day === 181 ? 'final.mp3' : `${day}.mp3`
    new Audio(`/sounds/${fileName}`).play().catch(() => {})
  }

  const playSmallPop = () => {
    const audio = new Audio('/sounds/small_pop.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => {});
  }

  const fireSmartConfetti = (index: number, currentTotal: number) => {
    if (currentTotal > 0 && (currentTotal % 10 === 0 || currentTotal === 181)) {
      setCelebrationDay(currentTotal); setShowCelebration(true);
      const duration = currentTotal === 181 ? 15 * 1000 : 4 * 1000;
      const end = Date.now() + duration;
      (function frame() {
        confetti({ particleCount: 10, spread: 100, origin: { x: Math.random(), y: 0.6 }, colors: [getRainbowColor(index), '#ffffff'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
    } else {
      playSmallPop();
      confetti({ particleCount: 50 + (currentTotal * 2), spread: 70, origin: { y: 0.7 }, colors: [getRainbowColor(index), '#ffffff'] });
    }
  }

  const handleToggle = async (date: string, index: number) => {
    if (!user) return
    const isRead = readHistory.includes(date)
    if (isRead) {
      await supabase.from('progress').delete().eq('user_id', user.id).eq('date', date)
      setReadHistory(prev => prev.filter(d => d !== date))
    } else {
      await supabase.from('progress').insert({ user_id: user.id, date: date })
      const newHistory = [...readHistory, date]
      setReadHistory(newHistory)
      fireSmartConfetti(index, newHistory.length)
    }
    await fetchRankings()
  }

  const openPastModal = () => {
    const filtered = allSchedules.filter(s => s.date < todayStr)
    setModalList(filtered); setTempSelected(filtered.filter(s => readHistory.includes(s.date)).map(s => s.date)); setModalType('past');
  }

  const saveBulkRead = async () => {
    if (!user) return
    const currentModalDates = modalList.map(m => m.date)
    const toDelete = currentModalDates.filter(date => readHistory.includes(date) && !tempSelected.includes(date))
    const toInsert = tempSelected.filter(date => !readHistory.includes(date)).map(date => ({ user_id: user.id, date }))
    if (toDelete.length > 0) await supabase.from('progress').delete().eq('user_id', user.id).in('date', toDelete)
    if (toInsert.length > 0) await supabase.from('progress').insert(toInsert)
    await fetchData(user); setModalType(null);
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen font-black text-blue-600">준비 중...</div>

  const todaySchedule = allSchedules.find(s => s.date === todayStr)
  const todayIdx = allSchedules.findIndex(s => s.date === todayStr)

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white pb-20 font-sans">
      {/* 1번 수정: 음표 제거된 헤더 */}
      <div className="p-6 flex justify-between items-center bg-white sticky top-0 z-50 border-b border-gray-50 shadow-sm">
        <h1 className="text-xl font-black text-gray-900 tracking-tight italic">시선통독 181 🌈</h1>
        <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
           <span className="text-xs font-black text-blue-600">{userName} <span className="font-medium opacity-60">성도님</span></span>
        </div>
      </div>

      <div className="p-6 space-y-12">
        {/* 오늘의 말씀 카드 */}
        <div className="flex items-center gap-4">
          <button onClick={openPastModal} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm"><ChevronLeft size={24}/></button>
          <div className="flex-1 bg-slate-900 text-white p-7 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="relative z-10 text-center">
              <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] block mb-2 uppercase italic">{todayStr}</span>
              <h2 className="text-2xl font-black mb-8 break-keep">{todaySchedule?.bible_range || "오늘은 쉬는 날입니다"}</h2>
              {todaySchedule && (
                <button onClick={() => handleToggle(todayStr, todayIdx)} className={`w-full py-4 rounded-[1.2rem] font-black text-lg transition-all ${readHistory.includes(todayStr) ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'}`}>
                  {readHistory.includes(todayStr) ? '✓ 통독 완료' : '오늘 말씀 읽기'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2번 수정: 클릭 기능이 제거된 순수 현황 그리드 */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-50">
          <h3 className="font-black text-gray-900 text-lg mb-6 px-1 underline decoration-blue-100 decoration-8 underline-offset-[-2px]">나의 말씀 현황</h3>
          <div className="grid grid-cols-10 gap-1.5 p-1">
            {allSchedules.map((day, index) => {
              const isRead = readHistory.includes(day.date)
              return (
                <div key={day.date} 
                  style={{ backgroundColor: isRead ? getRainbowColor(index) : '#F1F5F9' }}
                  className={`aspect-square rounded flex items-center justify-center text-[8px] transition-all ${isRead ? 'text-white font-bold scale-105 shadow-sm' : 'text-gray-300'}`}
                >
                  {isRead ? <Check size={10} strokeWidth={4}/> : index + 1}
                </div>
              )
            })}
          </div>
        </div>

        {/* 시선 친구들 엿보기 */}
        <div className="pt-4">
          <div className="flex items-center gap-2 mb-8 px-1"><Users className="text-blue-500" size={24}/><h3 className="font-black text-gray-900 text-xl">시선 친구들 엿보기</h3></div>
          <div className="space-y-8">
            {rankings.map((rank, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-center px-1"><span className="font-black text-gray-800">{rank.name} 성도님</span><span className="text-xs font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-md">{rank.count}일 완료</span></div>
                <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex p-[2px] shadow-inner">
                  {Array.from({ length: totalDays }).map((_, idx) => (
                    <div key={idx} className="h-full flex-1" style={{ backgroundColor: idx < rank.count ? getRainbowColor(idx) : 'transparent' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 모달 및 팝업 (기존과 동일) */}
      {modalType === 'past' && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-sm rounded-t-[3rem] h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="p-8 border-b flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-gray-900">이전 말씀 체크</h3>
                <button onClick={() => setTempSelected(tempSelected.length === modalList.length ? [] : modalList.map(m => m.date))} className="mt-4 text-xs font-black text-blue-600 flex items-center gap-1.5 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                  {tempSelected.length === modalList.length ? <CheckSquare size={14}/> : <Square size={14}/>} 전체선택
                </button>
              </div>
              <button onClick={() => setModalType(null)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50">
              {modalList.map((item) => (
                <div key={item.date} onClick={() => setTempSelected(prev => prev.includes(item.date) ? prev.filter(d => d !== item.date) : [...prev, item.date])} className={`flex items-center p-5 rounded-[1.8rem] border-2 bg-white transition-all ${tempSelected.includes(item.date) ? 'border-blue-500 shadow-md' : 'border-transparent'}`}>
                  <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${tempSelected.includes(item.date) ? 'bg-blue-500 border-blue-500' : 'border-gray-200'}`}>{tempSelected.includes(item.date) && <Check size={14} className="text-white" strokeWidth={4} />}</div>
                  <div><p className="text-[10px] font-bold text-gray-400 mb-0.5">{item.date}</p><p className="font-black text-gray-900 text-lg leading-tight">{item.bible_range}</p></div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-white border-t"><button onClick={saveBulkRead} className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl text-lg">저장하기</button></div>
          </div>
        </div>
      )}

      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center relative animate-in zoom-in-95">
            <button onClick={() => setShowCelebration(false)} className="absolute top-8 right-8 text-gray-300"><X size={28}/></button>
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8"><PartyPopper className="text-blue-600" size={40}/></div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">{celebrationDay === 181 ? '🎊 대장정 완독!' : `🌈 벌써 ${celebrationDay}일째!`}</h3>
            <p className="text-gray-500 font-bold mb-10 text-sm">{userName} 성도님, 정말 대단하십니다!<br/>축하 음성을 들어보세요.<br/><span className="text-[11px] text-red-400 mt-2 block font-medium">* 무음 모드를 해제해 주세요!</span></p>
            <button onClick={() => playSound(celebrationDay)} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-lg"><Volume2 size={24}/>축하 음성 듣기</button>
          </div>
        </div>
      )}
    </div>
  )
}