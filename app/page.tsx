'use client'

import { useState } from 'react'
import {
  Bell, ChevronRight, Coins, Crown, Dice5, Gamepad2, Gift, Heart, Home, Menu, Mic2,
  MoreHorizontal, Palette, Search, Sparkles, Trophy, Users, Video, WandSparkles, X,
  WalletCards, Eye, ShoppingBag, UserPlus, ShieldCheck, MessageCircle, UsersRound, Gem, CircleUserRound,
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

const profileModules = [
  { title: 'Edit avatar', detail: 'Outfits, frames and entrance effects', icon: WandSparkles, tone: 'from-[#ffe1e9] to-[#fff0f4]', accent: 'text-[#ef6687]' },
  { title: 'Profile visitors', detail: 'See who checked your profile', icon: Eye, tone: 'from-[#e4f5ff] to-[#eef8ff]', accent: 'text-[#4fa3d5]' },
  { title: 'Gift wall', detail: 'Your rare gifts and collections', icon: Gift, tone: 'from-[#fff0c9] to-[#fff8e2]', accent: 'text-[#d79d2d]' },
  { title: 'VIP center', detail: 'Level, benefits and renewal', icon: Crown, tone: 'from-[#ede5ff] to-[#f8f3ff]', accent: 'text-[#8664d7]' },
  { title: 'Followers', detail: 'Following, close friends and blocks', icon: UsersRound, tone: 'from-[#e5f8ed] to-[#f2fff6]', accent: 'text-[#4da978]' },
  { title: 'Account settings', detail: 'Privacy, safety and notifications', icon: ShieldCheck, tone: 'from-[#f1edf0] to-[#fbf9fb]', accent: 'text-[#837783]' },
]

const socialModules = [
  { title: 'Ring shop', detail: '4 ring tiers · proposals', icon: ShoppingBag, tone: 'from-[#fff0f4] to-[#ffe2ed]', accent: 'text-[#e45a83]' },
  { title: 'Couple space', detail: 'Your CP journey & date', icon: Heart, tone: 'from-[#fff3e7] to-[#ffe8d1]', accent: 'text-[#e68543]' },
  { title: 'Profile visitors', detail: '12 new visitors today', icon: Eye, tone: 'from-[#eaf3ff] to-[#e5eaff]', accent: 'text-[#5578cf]' },
  { title: 'Wallet & VIP', detail: 'Coins, gifts, membership', icon: WalletCards, tone: 'from-[#f1edff] to-[#e9e1ff]', accent: 'text-[#805cd8]' },
  { title: 'My family', detail: '2.4k members · level 12', icon: UsersRound, tone: 'from-[#e8faf0] to-[#dff5e8]', accent: 'text-[#3f9e6a]' },
  { title: 'Social inbox', detail: 'DMs, follows & stories', icon: MessageCircle, tone: 'from-[#fff9df] to-[#fff1c7]', accent: 'text-[#b48728]' },
  ]

  const rankingModules = [
    { title: 'Top this week', detail: 'Charm leaders · 12.8k to 9.7k', icon: Trophy, tone: 'from-[#fff2d8] to-[#ffe5bd]', accent: 'text-[#cf8a2e]' },
    { title: 'Gift sender ranking', detail: 'Top supporters this week', icon: Gift, tone: 'from-[#ffeaf2] to-[#ffdce9]', accent: 'text-[#e05d83]' },
    { title: 'Family ranking', detail: 'Weekly clan contribution', icon: UsersRound, tone: 'from-[#e7f8ef] to-[#d9f1e4]', accent: 'text-[#3f9e6a]' },
    { title: 'Couple ranking', detail: 'Intimacy and shared XP', icon: Heart, tone: 'from-[#fff0f0] to-[#ffe1e7]', accent: 'text-[#dc617e]' },
  ]

  function SectionPage({ active, notify }: { active: string; notify: (message: string) => void }) {
  const titles: Record<string, { eyebrow: string; title: string; description: string }> = {
    Discover: { eyebrow: 'Social feed', title: 'Find your people', description: 'Stories, posts, visitors and conversations from your VibeLy circle.' },
    Games: { eyebrow: 'Mini games', title: 'Pick your next room game', description: 'Only the party games you asked for, ready to launch from a room.' },
    Couples: { eyebrow: 'Wedding & CP', title: 'Build a story together', description: 'Shop rings, send proposals, celebrate anniversaries and manage your couple space.' },
    Rankings: { eyebrow: 'Rankings', title: 'Your social progress', description: 'Track charm, gifts, VIP, family and couple milestones in one place.' },
  Profile: { eyebrow: 'My profile', title: 'Your social identity', description: 'Manage your avatar, visitors, badges, gift wall, VIP status and account settings.' },
  }
  const copy = titles[active] ?? titles.Discover
  const modules = active === 'Games' ? games : active === 'Profile' ? profileModules : active === 'Rankings' ? rankingModules : socialModules
  const gameShortcuts = [
    { label: 'Rankings', icon: Trophy },
    { label: 'Tasks', icon: Sparkles },
    { label: 'Friends', icon: Users },
  ]
  if (active === 'Profile') return <section className="mt-7 rounded-[28px] bg-white p-4 shadow-sm shadow-[#eadfe0] sm:p-7">
    <div className="flex items-center justify-between"><button onClick={() => notify('Back to home')} className="rounded-xl p-2 text-[#8d8291]"><ChevronRight className="rotate-180" size={18}/></button><h2 className="text-base font-black">Me</h2><button onClick={() => notify('Profile settings')} className="rounded-xl p-2 text-[#8d8291]"><MoreHorizontal size={19}/></button></div>
    <div className="mt-5 rounded-[26px] bg-gradient-to-br from-[#201b38] via-[#3b2257] to-[#ff6689] p-5 text-white shadow-xl shadow-purple-100"><div className="flex items-center gap-4"><img src={avatars[0]} alt="Aarav Mehta" className="size-16 rounded-full object-cover ring-4 ring-white/30"/><div><p className="text-lg font-black">Aarav Mehta</p><p className="text-xs text-white/70">ID 884201 · Level 18</p><div className="mt-2 flex items-center gap-2 text-[10px] font-extrabold"><span className="rounded-full bg-white/15 px-2 py-1">VIP 3</span><span className="rounded-full bg-white/15 px-2 py-1">Charm 4.2k</span></div></div></div><div className="mt-5 grid grid-cols-3 gap-2 text-center"><div className="rounded-2xl bg-white/10 px-2 py-3"><p className="text-base font-black">128</p><p className="text-[10px] text-white/65">Following</p></div><div className="rounded-2xl bg-white/10 px-2 py-3"><p className="text-base font-black">2.4k</p><p className="text-[10px] text-white/65">Followers</p></div><div className="rounded-2xl bg-white/10 px-2 py-3"><p className="text-base font-black">89</p><p className="text-[10px] text-white/65">Visitors</p></div></div></div>
    <div className="mt-5 grid grid-cols-4 gap-2 text-center"><button onClick={() => notify('Moments opening')} className="rounded-2xl bg-[#fff4f6] p-3 text-[10px] font-black text-[#ec6685]"><Heart className="mx-auto mb-2" size={18}/>Moments</button><button onClick={() => notify('Gift wall opening')} className="rounded-2xl bg-[#fff9e8] p-3 text-[10px] font-black text-[#c3932c]"><Gift className="mx-auto mb-2" size={18}/>Gift wall</button><button onClick={() => notify('Visitors opening')} className="rounded-2xl bg-[#eef8ff] p-3 text-[10px] font-black text-[#4a9bd0]"><Eye className="mx-auto mb-2" size={18}/>Visitors</button><button onClick={() => notify('Invite friends opening')} className="rounded-2xl bg-[#f2efff] p-3 text-[10px] font-black text-[#8062d2]"><UserPlus className="mx-auto mb-2" size={18}/>Invite</button></div>
    <div className="mt-5 overflow-hidden rounded-2xl border border-[#f2e9eb]">{[{label:'My VIP & benefits', detail:'Level 3 · renewal in 18 days', icon:Crown},{label:'Badges & achievements', detail:'12 badges collected', icon:Trophy},{label:'Conversations', detail:'Messages, follows and requests', icon:MessageCircle},{label:'Language & privacy', detail:'English · private account off', icon:ShieldCheck}].map(({label,detail,icon:Icon}) => <button key={label} onClick={() => notify(`${label} opening`)} className="flex w-full items-center gap-3 border-b border-[#f4edef] p-4 text-left last:border-b-0"><span className="flex size-9 items-center justify-center rounded-xl bg-[#fff2f5] text-[#ec6685]"><Icon size={17}/></span><span className="min-w-0 flex-1"><span className="block text-xs font-black text-[#4a3b50]">{label}</span><span className="mt-1 block text-[10px] font-semibold text-[#a396a5]">{detail}</span></span><ChevronRight size={16} className="text-[#b7a9b5]"/></button>)}</div>
  </section>
  return <section className="mt-7 rounded-[28px] bg-white p-5 shadow-sm shadow-[#eadfe0] sm:p-7">
    {active === 'Games' && <div className="mb-6 grid grid-cols-3 gap-3">
      {gameShortcuts.map(({ label, icon: Icon }) => <button key={label} onClick={() => notify(`Opening ${label}`)} className="flex flex-col items-center gap-2 rounded-2xl bg-[#fffaf8] px-3 py-3 text-[10px] font-extrabold text-[#786c7c] transition hover:-translate-y-0.5 hover:bg-[#fff0f3]"><span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff6b89] to-[#8e63e8] text-white shadow-md shadow-pink-100"><Icon size={21}/></span>{label}</button>)}
    </div>}
    <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b89]">{copy.eyebrow}</p><h2 className="mt-2 text-2xl font-black">{copy.title}</h2></div>{active === 'Games' && <button onClick={() => notify('Opening game room')} className="text-xs font-black text-[#75697a]">Game Room <ChevronRight className="inline" size={14}/></button>}</div>
    <p className="mt-2 max-w-xl text-sm leading-6 text-[#958997]">{copy.description}</p>
    <div className={`mt-6 grid gap-3 sm:gap-4 ${active === 'Games' ? 'grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
      {modules.map((module: any, index: number) => { const Icon = module.icon; return <button key={module.title ?? module.name} onClick={() => notify(`Opening ${module.title ?? module.name}`)} className={`group min-h-[126px] rounded-3xl bg-gradient-to-br ${module.tone ?? module.color} p-4 text-left transition hover:-translate-y-1 hover:shadow-lg ${active === 'Games' && index < 2 ? 'col-span-2 min-h-[74px] sm:min-h-[92px]' : ''}`}><Icon className={module.accent ?? module.text} size={active === 'Games' && index < 2 ? 25 : 26}/><p className={`mt-5 text-base font-black ${module.accent ?? module.text}`}>{module.title ?? module.name}</p><p className="mt-1 text-xs font-semibold text-[#948899]">{module.detail ?? module.label}</p></button> })}
    </div>
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {(active === 'Couples' ? ['Ring shop · Silver, Gold, Diamond & custom rings', 'Proposal inbox · Accept or decline with a cinematic reveal', 'Wedding profile · Date, badge, couple ring and anniversary'] : active === 'Discover' ? ['24-hour stories & moments', 'Followers, visitor list & direct messages', 'Posts, comments, hashtags & gift tipping'] : active === 'Rankings' ? ['Charm & VIP level progress', 'Gift sender and receiver rankings', 'Family, room and couple seasons'] : ['Voice room game launcher', 'Room tournament entry', 'Daily missions and reward chest']).map(item => <div key={item} className="rounded-2xl border border-[#f4e8e8] bg-[#fffaf8] p-4 text-xs font-bold text-[#6f6272]"><span className="mr-2 text-[#ff6b89]">•</span>{item}</div>)}
    </div>
  </section>
}

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
            {[[Home,'Home'],[Users,'Discover'],[Gamepad2,'Games'],[Heart,'Couples'],[Trophy,'Rankings'],[CircleUserRound,'Profile']].map(([Icon,label]) => <button key={label as string} onClick={() => setActive(label as string)} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${active === label ? 'bg-[#fff0f3] text-[#f35f83]' : 'text-[#8c8297] hover:bg-[#faf6f5]'}`}><Icon size={19} /><span>{label as string}</span>{label === 'Couples' && <span className="ml-auto rounded-full bg-[#ffdfeb] px-1.5 py-0.5 text-[10px] text-[#e65d83]">NEW</span>}</button>)}
          </nav>
          <div className="mt-auto rounded-3xl bg-gradient-to-br from-[#fff0f3] to-[#f0eaff] p-4"><Sparkles className="mb-3 text-[#a26bfa]" size={20}/><p className="text-sm font-extrabold">Make your entrance unforgettable</p><p className="mt-1 text-xs leading-5 text-[#8d8193]">Unlock a special arrival effect.</p><button onClick={() => notify('VIP shop is opening soon')} className="mt-3 text-xs font-bold text-[#8857db]">Explore VIP <ChevronRight className="inline" size={14}/></button></div>
          <button onClick={() => notify('Profile settings')} className="mt-6 flex items-center gap-3 border-t border-[#f3e9e7] pt-5 text-left"><img src={avatars[0]} alt="Your profile" className="size-9 rounded-full object-cover"/><div><p className="text-xs font-extrabold">Aarav Mehta</p><p className="text-[10px] text-[#a098a4]">Level 18 · Charm 4.2k</p></div><MoreHorizontal className="ml-auto text-[#aaa0ad]" size={17}/></button>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-8 lg:px-10 lg:py-8">
          <header className="flex items-center justify-between gap-4"><div className="flex items-center gap-3 lg:hidden"><button className="rounded-xl bg-white p-2 shadow-sm"><Menu size={20}/></button><span className="text-lg font-black">Vibe<span className="text-[#ff6588]">ly</span></span></div><div className="hidden sm:block"><p className="text-sm font-semibold text-[#a39aa7]">Tuesday, October 22</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Good evening, Aarav <span>👋</span></h1></div><div className="flex items-center gap-2"><button onClick={() => notify('No new notifications')} aria-label="Notifications" className="relative rounded-2xl bg-white p-3 shadow-sm"><Bell size={19}/><span className="absolute right-2 top-2 size-2 rounded-full bg-[#ff6688]"/></button><button onClick={() => notify('Wallet: 12,840 coins')} className="flex items-center gap-2 rounded-2xl bg-[#fff4db] px-3 py-2.5 text-sm font-extrabold text-[#b87920]"><Coins size={18} fill="currentColor"/>12,840</button><button onClick={() => setActive('Profile')} aria-label="Open profile" className="overflow-hidden rounded-2xl bg-white p-1 shadow-sm"><img src={avatars[0]} alt="Open your profile" className="size-9 rounded-xl object-cover"/></button></div></header>

          {active === 'Home' && <div className="mt-7 grid grid-cols-3 gap-3 rounded-[26px] bg-white p-3 shadow-sm shadow-[#eadfe0] sm:max-w-[540px] sm:gap-5 sm:p-4"><button onClick={() => setActive('Rankings')} className="group flex flex-col items-center gap-2 rounded-2xl px-2 py-3 transition hover:bg-[#fff4f6]"><span className="flex size-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#ffe6a7] to-[#ffbd4a] text-white shadow-lg shadow-[#ffdca2] transition group-hover:-translate-y-1"><Trophy size={27} fill="currentColor" /></span><span className="text-xs font-extrabold text-[#3b3344]">Ranking</span></button><button onClick={() => notify('Daily tasks are opening soon')} className="group flex flex-col items-center gap-2 rounded-2xl px-2 py-3 transition hover:bg-[#f1fbff]"><span className="relative flex size-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#7fe1ff] to-[#4b9be8] text-white shadow-lg shadow-[#b9eafa] transition group-hover:-translate-y-1"><Sparkles size={27} /><span className="absolute -right-1 -top-1 size-3 rounded-full bg-[#ff5961] ring-4 ring-white" /></span><span className="text-xs font-extrabold text-[#3b3344]">Tasks</span></button><button onClick={() => setActive('Discover')} className="group flex flex-col items-center gap-2 rounded-2xl px-2 py-3 transition hover:bg-[#f0fffb]"><span className="flex size-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#65e5d5] to-[#16b8a7] text-white shadow-lg shadow-[#b8f1e8] transition group-hover:-translate-y-1"><Users size={27} /></span><span className="text-xs font-extrabold text-[#3b3344]">Friends</span></button></div>}

          <div className={`mt-7 grid gap-5 xl:grid-cols-[1fr_310px] ${active !== 'Home' ? 'hidden' : ''}`}>
            <div className="min-w-0">
              <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#6340c9] via-[#9c4ed2] to-[#f66b89] px-6 py-7 text-white shadow-xl shadow-purple-100 sm:px-9 sm:py-9"><div className="relative z-10 max-w-[380px]"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[10px] font-black tracking-widest"><Crown size={13} fill="currentColor"/> WEEKLY SPOTLIGHT</div><h2 className="text-2xl font-black leading-tight sm:text-3xl">Find your people.<br/>Make a memory.</h2><p className="mt-3 max-w-[300px] text-sm leading-6 text-white/80">Jump into a room, play a game, and let the good vibes find you.</p><button onClick={() => notify('Opening the room explorer')} className="mt-5 rounded-xl bg-white px-5 py-3 text-xs font-black text-[#7943c9] shadow-lg transition hover:scale-105">Explore live rooms <ChevronRight className="inline" size={15}/></button></div><div className="absolute -right-8 -top-12 size-48 rounded-full bg-white/10"/><div className="absolute -bottom-20 right-20 size-56 rounded-full bg-[#ffb05f]/30"/><div className="absolute bottom-3 right-7 hidden text-[100px] drop-shadow-2xl sm:block">🪩</div></section>

              <div className="mt-8 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b89]">Game room</p><h2 className="mt-1 text-xl font-black">Pick a game, start a vibe</h2></div><button onClick={() => notify('Showing all games')} className="text-xs font-bold text-[#9b8fa1]">See all <ChevronRight className="inline" size={14}/></button></div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{games.map((game) => { const Icon = game.icon; return <button key={game.name} onClick={() => notify(`Opening ${game.name}`)} className={`group relative min-h-[122px] overflow-hidden rounded-2xl ${game.color} p-4 text-left transition hover:-translate-y-1 hover:shadow-md`}><Icon className={`relative z-10 size-8 transition group-hover:scale-110 ${game.text}`} strokeWidth={1.8}/><div className={`absolute -right-3 -top-5 size-20 rounded-full border-[10px] border-white/30 ${game.text.replace('text-', 'bg-')}`}/><p className={`relative z-10 mt-5 text-sm font-black ${game.text}`}>{game.name}</p><p className="relative z-10 mt-1 text-[10px] font-semibold text-[#928993]">{game.label}</p></button>})}</div>

              <div className="mt-8 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b89]">Happening now</p><h2 className="mt-1 text-xl font-black">Live voice rooms</h2></div><button onClick={() => notify('Showing all rooms')} className="text-xs font-bold text-[#9b8fa1]">View all <ChevronRight className="inline" size={14}/></button></div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">{rooms.map((room) => <button key={room.title} onClick={() => notify(`Joining ${room.title}`)} className="group relative h-44 overflow-hidden rounded-2xl text-left"><img src={room.image} alt="" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"/><div className={`absolute inset-0 bg-gradient-to-t ${room.tone} opacity-70 mix-blend-multiply`}/><div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[9px] font-black text-[#e95f7e]">{room.tag}</div><div className="absolute inset-x-3 bottom-3 text-white"><p className="text-sm font-black">{room.title}</p><div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-white/80"><Mic2 size={12}/> {room.host} · {room.people} listening</div></div></button>)}</div>
            </div>

            <aside className="flex flex-col gap-5"><section className="rounded-[26px] bg-white p-5 shadow-sm shadow-[#eadfe0]"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-[#ff6b89]">Daily vibes</p><h3 className="mt-1 text-lg font-black">Your social streak</h3></div><div className="rounded-2xl bg-[#fff1d9] p-3 text-xl">🔥</div></div><div className="mt-5 flex justify-between">{['M','T','W','T','F','S','S'].map((day, index) => <div key={`${day}-${index}`} className="flex flex-col items-center gap-2"><span className={`flex size-7 items-center justify-center rounded-full text-[10px] font-black ${index < 4 ? 'bg-[#ff718b] text-white' : 'bg-[#fff3f4] text-[#d8a9b2]'}`}>{index < 4 ? '✓' : day}</span><span className="text-[9px] font-bold text-[#aaa0a9]">{day}</span></div>)}</div><div className="mt-5 flex items-center gap-3 rounded-xl bg-[#fff8ee] p-3"><Sparkles size={18} className="text-[#efa940]"/><p className="text-[11px] font-bold leading-4 text-[#9b7d49]">2 more days to unlock<br/><span className="text-[#d4972f]">a mystery gift box</span></p></div></section>
</aside>
          </div>
          {active !== 'Home' && <SectionPage active={active} notify={notify} />}
        </section>
      </div>
      <nav className="sticky bottom-0 z-20 flex items-center justify-around border-t border-[#f3e9e7] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">{[[Home,'Home'],[Users,'Discover'],[Gamepad2,'Games'],[Heart,'Couples'],[Trophy,'Rankings'],[CircleUserRound,'Profile']].map(([Icon,label]) => <button key={label as string} onClick={() => setActive(label as string)} className={`flex flex-col items-center gap-1 text-[10px] font-bold ${active === label ? 'text-[#f35f83]' : 'text-[#aaa0aa]'}`}><Icon size={19}/>{label as string}</button>)}</nav>
      {toast && <div role="status" className="fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#30253f] px-5 py-3 text-xs font-bold text-white shadow-xl lg:bottom-8"><Sparkles size={14} className="text-[#ffb4c5]"/>{toast}<button onClick={() => setToast('')} aria-label="Dismiss"><X size={14}/></button></div>}
    </main>
  )
}
