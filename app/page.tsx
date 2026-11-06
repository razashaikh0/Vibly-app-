'use client'

import { useState } from 'react'
import {
  Bell, ChevronRight, Coins, Crown, Dice5, Gamepad2, Gift, Heart, Home, Menu, Mic2,
  MoreHorizontal, Palette, Search, Sparkles, Trophy, Users, Video, WandSparkles, X,
} from 'lucide-react'

const avatars = [
  'https://i.pravatar.cc/120?img=47', 'https://i.pravatar.cc/120?img=32', 'https://i.pravatar.cc/120?img=12',
  'https://i.pravatar.cc/120?img=49', 'https://i.pravatar.cc/120?img=5', 'https://i.pravatar.cc/120?img=25',
]

const rooms = [
  { title: 'Late Night Chai ☕', host: 'Sana & Friends', people: '2.4k', tag: 'LIVE NOW', tone: 'from-fuchsia-500 to-violet-700', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80' },
  { title: 'Dil Se Dil Tak', host: 'Ayaan’s Lounge', people: '1.8k', tag: 'TRENDING', tone: 'from-rose-500 to-orange-500', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80' },
  { title: 'Game Night 🎮', host: 'The Chill Fam', people: '936', tag: 'PLAYING LUDO', tone: 'from-cyan-500 to-blue-700', image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=900&q=80' },
]

const games = [
  { name: "Who's the Spy", label: 'Deduction party', icon: Search, color: 'bg-[#e9f5ff]', text: 'text-[#3276c7]' },
  { name: 'Paint to Hide', label: 'Creative challenge', icon: Palette, color: 'bg-[#fff0e2]', text: 'text-[#e97932]' },
  { name: "Trickster's Cafe", label: 'Social strategy', icon: WandSparkles, color: 'bg-[#fff0f4]', text: 'text-[#d84f79]' },
  { name: 'Hide & Seek', label: 'Quick party game', icon: Users, color: 'bg-[#eaf8ed]', text: 'text-[#399365]' },
  { name: 'Space Werewolf', label: 'Mystery lobby', icon: Sparkles, color: 'bg-[#f0eaff]', text: 'text-[#7654d9]' },
  { name: 'Oh My Card', label: 'Card battle', icon: Gift, color: 'bg-[#fff8de]', text: 'text-[#b48a20]' },
  { name: 'Ludo', label: 'Play with friends', icon: Dice5, color: 'bg-[#f0eaff]', text: 'text-[#7654d9]' },
  { name: 'Draw & Guess', label: 'Show your talent', icon: Palette, color: 'bg-[#e9f8ef]', text: 'text-[#3a9d68]' },
]

export default function Page() {
  const [active, setActive] = useState('Home')
  const [toast, setToast] = useState('')
  const notify = (message: string) => { setToast(message); setTimeout(() => setToast(''), 2200) }

  return (
    <main className="min-h-screen bg-[#fffaf8] text-[#2f2540]">
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[#f3e9e7] bg-white px-5 py-7 lg:flex">
          <div className="flex items-center gap-2 px-2"><div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff6d8c] to-[#8c4bff] text-xl text-white shadow-lg shadow-pink-200">✦</div><span className="text-xl font-black tracking-tight">Vibe<span className="text-[#ff6588]">ly</span></span></div>
          <nav className="mt-12 flex flex-col gap-2">
            {[[Home,'Home'],[Users,'Discover'],[Gamepad2,'Games'],[Heart,'Couples'],[Trophy,'Rankings']].map(([Icon,label]) => <button key={label as string} onClick={() => setActive(label as string)} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${active === label ? 'bg-[#fff0f3] text-[#f35f83]' : 'text-[#8c8297] hover:bg-[#faf6f5]'}`}><Icon size={19} /><span>{label as string}</span>{label === 'Couples' && <span className="ml-auto rounded-full bg-[#ffdfeb] px-1.5 py-0.5 text-[10px] text-[#e65d83]">NEW</span>}</button>)}
          </nav>
          <div className="mt-auto rounded-3xl bg-gradient-to-br from-[#fff0f3] to-[#f0eaff] p-4"><Sparkles className="mb-3 text-[#a26bfa]" size={20}/><p className="text-sm font-extrabold">Make your entrance unforgettable</p><p className="mt-1 text-xs leading-5 text-[#8d8193]">Unlock a special arrival effect.</p><button onClick={() => notify('VIP shop is opening soon')} className="mt-3 text-xs font-bold text-[#8857db]">Explore VIP <ChevronRight className="inline" size={14}/></button></div>
          <button onClick={() => notify('Profile settings')} className="mt-6 flex items-center gap-3 border-t border-[#f3e9e7] pt-5 text-left"><img src={avatars[0]} alt="Your profile" className="size-9 rounded-full object-cover"/><div><p className="text-xs font-extrabold">Aarav Mehta</p><p className="text-[10px] text-[#a098a4]">Level 18 · Charm 4.2k</p></div><MoreHorizontal className="ml-auto text-[#aaa0ad]" size={17}/></button>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-8 lg:px-10 lg:py-8">
          <header className="flex items-center justify-between gap-4"><div className="flex items-center gap-3 lg:hidden"><button className="rounded-xl bg-white p-2 shadow-sm"><Menu size={20}/></button><span className="text-lg font-black">Vibe<span className="text-[#ff6588]">ly</span></span></div><div className="hidden sm:block"><p className="text-sm font-semibold text-[#a39aa7]">Tuesday, October 22</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Good evening, Aarav <span>👋</span></h1></div><div className="flex items-center gap-2"><button onClick={() => notify('No new notifications')} aria-label="Notifications" className="relative rounded-2xl bg-white p-3 shadow-sm"><Bell size={19}/><span className="absolute right-2 top-2 size-2 rounded-full bg-[#ff6688]"/></button><button onClick={() => notify('Wallet: 12,840 coins')} className="flex items-center gap-2 rounded-2xl bg-[#fff4db] px-3 py-2.5 text-sm font-extrabold text-[#b87920]"><Coins size={18} fill="currentColor"/>12,840</button></div></header>

          <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_310px]">
            <div className="min-w-0">
              <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#6340c9] via-[#9c4ed2] to-[#f66b89] px-6 py-7 text-white shadow-xl shadow-purple-100 sm:px-9 sm:py-9"><div className="relative z-10 max-w-[380px]"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[10px] font-black tracking-widest"><Crown size={13} fill="currentColor"/> WEEKLY SPOTLIGHT</div><h2 className="text-2xl font-black leading-tight sm:text-3xl">Find your people.<br/>Make a memory.</h2><p className="mt-3 max-w-[300px] text-sm leading-6 text-white/80">Jump into a room, play a game, and let the good vibes find you.</p><button onClick={() => notify('Opening the room explorer')} className="mt-5 rounded-xl bg-white px-5 py-3 text-xs font-black text-[#7943c9] shadow-lg transition hover:scale-105">Explore live rooms <ChevronRight className="inline" size={15}/></button></div><div className="absolute -right-8 -top-12 size-48 rounded-full bg-white/10"/><div className="absolute -bottom-20 right-20 size-56 rounded-full bg-[#ffb05f]/30"/><div className="absolute bottom-3 right-7 hidden text-[100px] drop-shadow-2xl sm:block">🪩</div></section>

              <div className="mt-8 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b89]">Game room</p><h2 className="mt-1 text-xl font-black">Pick a game, start a vibe</h2></div><button onClick={() => notify('Showing all games')} className="text-xs font-bold text-[#9b8fa1]">See all <ChevronRight className="inline" size={14}/></button></div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{games.map((game) => { const Icon = game.icon; return <button key={game.name} onClick={() => notify(`Opening ${game.name}`)} className={`group relative min-h-[122px] overflow-hidden rounded-2xl ${game.color} p-4 text-left transition hover:-translate-y-1 hover:shadow-md`}><Icon className={`relative z-10 size-8 transition group-hover:scale-110 ${game.text}`} strokeWidth={1.8}/><div className={`absolute -right-3 -top-5 size-20 rounded-full border-[10px] border-white/30 ${game.text.replace('text-', 'bg-')}`}/><p className={`relative z-10 mt-5 text-sm font-black ${game.text}`}>{game.name}</p><p className="relative z-10 mt-1 text-[10px] font-semibold text-[#928993]">{game.label}</p></button>})}</div>

              <div className="mt-8 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b89]">Happening now</p><h2 className="mt-1 text-xl font-black">Live voice rooms</h2></div><button onClick={() => notify('Showing all rooms')} className="text-xs font-bold text-[#9b8fa1]">View all <ChevronRight className="inline" size={14}/></button></div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">{rooms.map((room) => <button key={room.title} onClick={() => notify(`Joining ${room.title}`)} className="group relative h-44 overflow-hidden rounded-2xl text-left"><img src={room.image} alt="" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"/><div className={`absolute inset-0 bg-gradient-to-t ${room.tone} opacity-70 mix-blend-multiply`}/><div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[9px] font-black text-[#e95f7e]">{room.tag}</div><div className="absolute inset-x-3 bottom-3 text-white"><p className="text-sm font-black">{room.title}</p><div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-white/80"><Mic2 size={12}/> {room.host} · {room.people} listening</div></div></button>)}</div>
            </div>

            <aside className="flex flex-col gap-5"><section className="rounded-[26px] bg-white p-5 shadow-sm shadow-[#eadfe0]"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-[#ff6b89]">Daily vibes</p><h3 className="mt-1 text-lg font-black">Your social streak</h3></div><div className="rounded-2xl bg-[#fff1d9] p-3 text-xl">🔥</div></div><div className="mt-5 flex justify-between">{['M','T','W','T','F','S','S'].map((day, index) => <div key={`${day}-${index}`} className="flex flex-col items-center gap-2"><span className={`flex size-7 items-center justify-center rounded-full text-[10px] font-black ${index < 4 ? 'bg-[#ff718b] text-white' : 'bg-[#fff3f4] text-[#d8a9b2]'}`}>{index < 4 ? '✓' : day}</span><span className="text-[9px] font-bold text-[#aaa0a9]">{day}</span></div>)}</div><div className="mt-5 flex items-center gap-3 rounded-xl bg-[#fff8ee] p-3"><Sparkles size={18} className="text-[#efa940]"/><p className="text-[11px] font-bold leading-4 text-[#9b7d49]">2 more days to unlock<br/><span className="text-[#d4972f]">a mystery gift box</span></p></div></section>
              <section className="rounded-[26px] bg-white p-5 shadow-sm shadow-[#eadfe0]"><div className="flex items-center justify-between"><h3 className="text-lg font-black">Top this week</h3><button onClick={() => setActive('Rankings')} className="text-[#ff6588]"><ChevronRight size={18}/></button></div><div className="mt-4 flex flex-col gap-4">{avatars.slice(1,4).map((avatar, i) => <div className="flex items-center gap-3" key={avatar}><span className="w-4 text-center text-xs font-black text-[#b3aab5]">{i + 1}</span><img src={avatar} alt="Top creator" className="size-9 rounded-full object-cover ring-2 ring-white"/><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold">{['Maya Kapoor','Zoya Khan','Rohan Verma'][i]}</p><p className="text-[10px] text-[#aaa0a9]">{['12.8k','10.4k','9.7k'][i]} charm</p></div><span className="text-sm">{['👑','✨','💎'][i]}</span></div>)}</div></section>
              <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#ffecf1] to-[#f0eaff] p-5"><div className="relative z-10"><div className="flex items-center gap-2 text-[#e85f82]"><Heart size={17} fill="currentColor"/><span className="text-xs font-black uppercase tracking-widest">Couple corner</span></div><h3 className="mt-3 text-xl font-black">Your story is<br/>waiting to begin</h3><p className="mt-2 text-xs leading-5 text-[#988c9b]">Meet someone over a game you both love.</p><button onClick={() => setActive('Couples')} className="mt-4 rounded-xl bg-[#f36387] px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-pink-200">Discover your match</button></div><div className="absolute -bottom-5 -right-2 text-7xl">💞</div></section></aside>
          </div>
        </section>
      </div>
      <nav className="sticky bottom-0 z-20 flex items-center justify-around border-t border-[#f3e9e7] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">{[[Home,'Home'],[Users,'Discover'],[Gamepad2,'Games'],[Heart,'Couples'],[Trophy,'Rankings']].map(([Icon,label]) => <button key={label as string} onClick={() => setActive(label as string)} className={`flex flex-col items-center gap-1 text-[10px] font-bold ${active === label ? 'text-[#f35f83]' : 'text-[#aaa0aa]'}`}><Icon size={19}/>{label as string}</button>)}</nav>
      {toast && <div role="status" className="fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#30253f] px-5 py-3 text-xs font-bold text-white shadow-xl lg:bottom-8"><Sparkles size={14} className="text-[#ffb4c5]"/>{toast}<button onClick={() => setToast('')} aria-label="Dismiss"><X size={14}/></button></div>}
    </main>
  )
}
