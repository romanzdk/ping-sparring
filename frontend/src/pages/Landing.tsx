import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Users, Calendar, CheckCircle, ArrowRight, MapPin, Settings, Star, UserPlus, Search, MousePointer, Trophy, ChevronRight } from 'lucide-react'
import { SPORTS } from '../types'

export default function Landing() {
  const { hash } = useLocation()
  useEffect(() => {
    if (hash === '#jak-to-funguje') {
      document.getElementById('jak-to-funguje')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [hash])
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-teal-50/30 to-orange-50/20">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[min(100%,32rem)] h-96 bg-gradient-to-br from-teal-200/40 to-cyan-200/30 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 animate-pulse-soft" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-200/30 to-amber-100/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-teal-100/20 via-transparent to-orange-100/20 rounded-full blur-3xl" />
          {/* Decorative dots pattern */}
          <div className="absolute top-20 left-10 w-32 h-32 opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {[...Array(25)].map((_, i) => (
                <circle key={i} cx={(i % 5) * 25 + 10} cy={Math.floor(i / 5) * 25 + 10} r="2" fill="currentColor" className="text-teal-600" />
              ))}
            </svg>
          </div>
          <div className="absolute bottom-20 right-10 w-24 h-24 opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {[...Array(16)].map((_, i) => (
                <circle key={i} cx={(i % 4) * 30 + 10} cy={Math.floor(i / 4) * 30 + 10} r="2" fill="currentColor" className="text-orange-500" />
              ))}
            </svg>
          </div>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-teal-100 shadow-sm mb-6">
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-gray-600">Najdi si svého sparing partnera</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Trénuj{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">častěji</span>
                  <svg className="absolute -bottom-1 left-0 w-full h-2" viewBox="0 0 100 8" preserveAspectRatio="none">
                    <path d="M0 7 Q 50 0 100 7" stroke="rgb(20 184 166)" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
                , buď{' '}
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">lepší</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Platforma pro párování tréninků. Najdi kvalitní sparing partnery ve tvém okolí na tvé úrovni. Bez zbytečností, bez chaosu.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="btn btn-primary text-lg min-h-[52px] px-8 shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 transition-all">
                  Zaregistrovat se
                  <ArrowRight className="w-5 h-5 ml-2 flex-shrink-0" aria-hidden />
                </Link>
                <Link to="/login" className="btn btn-secondary text-lg min-h-[52px] px-8">
                  Přihlásit se
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500" />
                  <span>Zdarma</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500" />
                  <span>Bez reklam</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500" />
                  <span>Jednoduché</span>
                </div>
              </div>
            </div>
            {/* Right illustration */}
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative w-full max-w-md aspect-square">
                {/* Main illustration container */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-cyan-50 rounded-3xl rotate-3 shadow-xl"></div>
                <div className="absolute inset-0 bg-white rounded-3xl shadow-lg flex items-center justify-center overflow-hidden">
                  {/* Ping pong illustration */}
                  <div className="relative w-full h-full p-8">
                    {/* Table representation */}
                    <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-32 bg-gradient-to-b from-teal-500 to-teal-600 rounded-xl shadow-lg">
                      <div className="absolute inset-x-0 top-1/2 h-1 bg-white/80"></div>
                      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-white/60"></div>
                    </div>
                    {/* Paddles */}
                    <div className="absolute left-12 top-1/3 w-16 h-20 animate-float">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-full shadow-md"></div>
                      <div className="absolute top-10 left-5 w-3 h-10 bg-gradient-to-b from-amber-700 to-amber-800 rounded-b-lg"></div>
                    </div>
                    <div className="absolute right-12 bottom-1/3 w-16 h-20 animate-float" style={{ animationDelay: '1.5s' }}>
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full shadow-md"></div>
                      <div className="absolute top-10 left-5 w-3 h-10 bg-gradient-to-b from-amber-700 to-amber-800 rounded-b-lg"></div>
                    </div>
                    {/* Ball */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full shadow-lg animate-bounce"></div>
                    {/* Players icons */}
                    <div className="absolute bottom-6 left-8 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-md">
                      <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-500 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">Hráč 1</span>
                    </div>
                    <div className="absolute bottom-6 right-8 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-md">
                      <span className="text-sm font-semibold text-gray-700">Hráč 2</span>
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating stats cards */}
                <div className="absolute -left-6 top-1/4 bg-white rounded-xl shadow-lg p-3 flex items-center gap-3 animate-float" style={{ animationDelay: '0.5s' }}>
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tréninků</p>
                    <p className="text-lg font-bold text-gray-900">150+</p>
                  </div>
                </div>
                <div className="absolute -right-6 bottom-1/4 bg-white rounded-xl shadow-lg p-3 flex items-center gap-3 animate-float" style={{ animationDelay: '1s' }}>
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hodnocení</p>
                    <p className="text-lg font-bold text-gray-900">4.9</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full h-auto">
            <path d="M0 60V30C240 10 480 0 720 10C960 20 1200 40 1440 30V60H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Rychlý vstup – Nabídky a Poptávky */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Prozkoumej možnosti</h2>
            <p className="text-gray-600">Podívej se, co nabízíme – bez nutnosti přihlášení</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Link
              to="/trainings"
              className="group relative overflow-hidden bg-gradient-to-br from-teal-50 to-white p-6 rounded-2xl border-2 border-teal-100 hover:border-teal-300 hover:shadow-lg transition-all duration-300"
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-teal-200/50 transition-colors" />
              <div className="relative flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex-shrink-0 shadow-lg shadow-teal-500/25 group-hover:scale-110 transition-transform">
                  <Calendar className="w-7 h-7 text-white" aria-hidden />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 rounded-full mb-1">
                    <span className="text-xs font-semibold text-teal-700">Bez přihlášení</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 group-hover:text-teal-700 transition-colors">Nabídky tréninků</p>
                  <p className="text-sm text-gray-600 mt-0.5">Prohlédni aktuální tréninky</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors flex-shrink-0">
                  <ArrowRight className="w-5 h-5 text-teal-600 group-hover:translate-x-0.5 transition-transform" aria-hidden />
                </div>
              </div>
            </Link>
            
            <Link
              to="/training-requests"
              className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border-2 border-orange-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300"
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-200/50 transition-colors" />
              <div className="relative flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex-shrink-0 shadow-lg shadow-orange-500/25 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-white" aria-hidden />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 rounded-full mb-1">
                    <span className="text-xs font-semibold text-orange-700">Bez přihlášení</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">Poptávky hráčů</p>
                  <p className="text-sm text-gray-600 mt-0.5">Kdo hledá sparring</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors flex-shrink-0">
                  <ArrowRight className="w-5 h-5 text-orange-500 group-hover:translate-x-0.5 transition-transform" aria-hidden />
                </div>
              </div>
            </Link>
          </div>
          
          <p className="mt-8 text-center text-gray-500 text-sm">
            Pro detail a přihlášení se <Link to="/register" className="text-teal-600 hover:underline font-medium">zaregistruj</Link> nebo <Link to="/login" className="text-teal-600 hover:underline font-medium">přihlas</Link>.
          </p>

          {/* Podporované sporty */}
          <div className="mt-16 sm:mt-20 pt-12 sm:pt-16 border-t border-gray-100">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100 mb-4">
                <span className="text-lg">🎾</span>
                <span className="text-sm font-semibold text-gray-700">Více sportů</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Podporované sporty
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                Na platformě můžeš hledat sparing partnery pro následující sporty.
              </p>
            </div>
            <ul className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {SPORTS.map(({ value, label, emoji }, i) => (
                <li
                  key={value}
                  className={`group inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                    i % 2 === 0 
                      ? 'border-teal-100 hover:border-teal-300' 
                      : 'border-orange-100 hover:border-orange-300'
                  }`}
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform" aria-hidden>{emoji}</span>
                  <span className="font-semibold text-gray-800">{label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center text-gray-500 text-sm">
              Další sporty mohou v průběhu času přibýt.
            </p>
          </div>
        </div>
      </section>

      {/* Proč Můj trénink? */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-[#f8fafb] to-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute top-0 right-0 w-64 h-64 text-teal-100 opacity-50" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 4" />
          </svg>
          <svg className="absolute bottom-0 left-0 w-48 h-48 text-orange-100 opacity-50" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" />
          </svg>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-50 to-orange-50 rounded-full border border-gray-100 mb-4">
              <Star className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-gray-700">Výhody platformy</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Proč Můj trénink?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Řešíme opakovaný problém pravidelného tréninku. Automaticky, transparentně, bez zbytečného chaosu.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Settings, title: 'Párování podle úrovně', desc: 'Automatické doporučení ideálního sparing partnera například podle ELO.', accent: 'teal' as const },
              { icon: MapPin, title: 'Regionální tréninky', desc: 'Najdi sparing partnery ve svém okolí. Zadej lokaci a hraj.', accent: 'orange' as const },
              { icon: Calendar, title: 'Automatizace', desc: 'Zjednodušená administrace, řízení tréninků, správa výsledků.', accent: 'teal' as const },
              { icon: Star, title: 'Spolehlivost', desc: 'Systém hodnocení pro férové a spolehlivé hráče.', accent: 'orange' as const },
            ].map(({ icon: Icon, title, desc, accent }) => (
              <div 
                key={title} 
                className="group relative bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  accent === 'orange' 
                    ? 'bg-gradient-to-br from-orange-50/50 to-transparent' 
                    : 'bg-gradient-to-br from-teal-50/50 to-transparent'
                }`} />
                
                <div className="relative">
                  {/* Icon with ring */}
                  <div className="relative w-14 h-14 mb-5">
                    <div className={`absolute inset-0 rounded-xl ${accent === 'orange' ? 'bg-orange-100' : 'bg-teal-100'} group-hover:scale-110 transition-transform duration-300`} />
                    <div className={`absolute inset-0 rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-7 h-7 ${accent === 'orange' ? 'text-orange-500' : 'text-teal-600'}`} aria-hidden />
                    </div>
                    {/* Decorative ring */}
                    <div className={`absolute -inset-1 rounded-xl border-2 border-dashed opacity-0 group-hover:opacity-30 transition-opacity ${
                      accent === 'orange' ? 'border-orange-300' : 'border-teal-300'
                    }`} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jak to funguje */}
      <section id="jak-to-funguje" className="py-16 sm:py-24 bg-gradient-to-b from-white to-gray-50 scroll-mt-20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-teal-100/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-orange-100/30 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full border border-teal-100 mb-4">
              <span className="text-sm font-semibold text-teal-700">Jednoduché kroky</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Jak to funguje?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Čtyři jednoduché kroky k tvému dalšímu tréninku.
            </p>
          </div>
          
          {/* Steps with arrows */}
          <div className="relative">
            {/* Connection line - desktop */}
            <div className="hidden lg:block absolute top-24 left-[12%] right-[12%] h-1">
              <div className="w-full h-full bg-gradient-to-r from-teal-200 via-orange-200 to-teal-200 rounded-full" />
              {/* Animated dots on line */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-3 h-3 bg-teal-400 rounded-full animate-pulse" />
              <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-3 h-3 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="absolute top-1/2 -translate-y-1/2 left-2/3 w-3 h-3 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 -translate-y-1/2 right-0 w-3 h-3 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
              {[
                { num: '01', title: 'Zaregistruj se', desc: 'Vytvoř si účet, vyplň data a preferovaný čas tréninku.', icon: UserPlus, accent: 'teal' as const },
                { num: '02', title: 'Najdi trénink', desc: 'Procházej dostupné tréninky ve svém okolí podle úrovně.', icon: Search, accent: 'orange' as const },
                { num: '03', title: 'Přihlas se', desc: 'Jednoduše se přihlas. Tvůj sparring partner čeká.', icon: MousePointer, accent: 'teal' as const },
                { num: '04', title: 'Trénuj', desc: 'Přijď a potrénuj. Bez chaosu, bez čekání.', icon: Trophy, accent: 'orange' as const },
              ].map(({ num, title, desc, icon: Icon, accent }, i, arr) => (
                <div key={num} className="relative flex flex-col items-center">
                  {/* Card */}
                  <div className={`relative w-full bg-white rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group ${
                    accent === 'teal' 
                      ? 'border-teal-100 hover:border-teal-300' 
                      : 'border-orange-100 hover:border-orange-300'
                  }`}>
                    {/* Number badge */}
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ${
                      accent === 'teal' 
                        ? 'bg-gradient-to-br from-teal-500 to-teal-600' 
                        : 'bg-gradient-to-br from-orange-400 to-orange-500'
                    }`}>
                      {num.replace('0', '')}
                    </div>
                    
                    {/* Icon */}
                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                      accent === 'teal' 
                        ? 'bg-gradient-to-br from-teal-50 to-teal-100' 
                        : 'bg-gradient-to-br from-orange-50 to-orange-100'
                    }`}>
                      <Icon className={`w-8 h-8 ${accent === 'teal' ? 'text-teal-600' : 'text-orange-500'}`} />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{title}</h3>
                    <p className="text-gray-600 leading-relaxed text-center text-sm">{desc}</p>
                  </div>
                  
                  {/* Arrow to next step - mobile/tablet */}
                  {i < arr.length - 1 && (
                    <div className="lg:hidden flex justify-center my-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        accent === 'teal' ? 'bg-teal-100' : 'bg-orange-100'
                      }`}>
                        <ChevronRight className={`w-5 h-5 rotate-90 ${accent === 'teal' ? 'text-teal-600' : 'text-orange-500'}`} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* CTA under steps */}
          <div className="mt-12 text-center">
            <Link to="/#jak-to-funguje" onClick={(e: React.MouseEvent) => { e.preventDefault(); document.getElementById('jak-to-funguje')?.scrollIntoView({ behavior: 'smooth' }); }} className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700 transition-colors">
              <span>Je to opravdu jednoduché</span>
              <CheckCircle className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pro trenéry a kluby */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-gray-50 via-white to-teal-50/30 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-l from-orange-100/40 to-transparent rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full border border-orange-100 mb-6">
                <Trophy className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-orange-700">Pro kluby a trenéry</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Jsi trenér nebo vedoucí klubu?
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Přidej svůj klub a staň se součástí naší platformy. Získej kvalitní hráče pro tréninky, spravuj rozvrhy a rozšiř komunitu.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { text: 'Automatické schvalování hráčů například podle ELO', icon: Settings },
                  { text: 'Přehledná správa rezervací', icon: Calendar },
                  { text: 'Celkový přehled tréninků', icon: Users },
                  { text: 'Plánování a oznámení automatizovány', icon: CheckCircle },
                ].map(({ text, icon: Icon }) => (
                  <li key={text} className="flex items-start gap-4 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4 text-teal-600" aria-hidden />
                    </div>
                    <span className="text-gray-700 font-medium pt-1">{text}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white min-h-[52px] px-8 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all">
                Zjistit více
                <ArrowRight className="w-5 h-5 ml-2 flex-shrink-0" aria-hidden />
              </Link>
            </div>
            
            {/* Visual illustration */}
            <div className="flex justify-center order-first lg:order-last">
              <div className="relative w-full max-w-md">
                {/* Main card */}
                <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Trophy className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Můj Klub</h3>
                      <p className="text-sm text-gray-500">Přehled tréninků</p>
                    </div>
                  </div>
                  
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-teal-700">24</p>
                      <p className="text-xs text-teal-600">Aktivních hráčů</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-orange-600">12</p>
                      <p className="text-xs text-orange-500">Tréninků/týden</p>
                    </div>
                  </div>
                  
                  {/* Mini schedule */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dnešní tréninky</p>
                    {[
                      { time: '16:00', name: 'Sparring - začátečníci', spots: '4/6' },
                      { time: '18:00', name: 'Sparring - pokročilí', spots: '3/4' },
                    ].map((training) => (
                      <div key={training.time} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="text-sm font-bold text-teal-600 w-12">{training.time}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{training.name}</p>
                        </div>
                        <div className="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded-full">{training.spots}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Floating notification */}
                <div className="absolute -right-4 top-1/4 bg-white rounded-xl shadow-lg p-3 border border-gray-100 animate-float" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Nová registrace</p>
                      <p className="text-xs text-gray-500">Před 2 min</p>
                    </div>
                  </div>
                </div>
                
                {/* Floating badge */}
                <div className="absolute -left-4 bottom-1/4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl shadow-lg p-3 text-white animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    <span className="text-sm font-bold">4.9 hodnocení</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
          {/* Decorative pattern */}
          <svg className="absolute bottom-0 left-0 w-full h-32 text-teal-500/10" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0 120V60C240 20 480 0 720 20C960 40 1200 80 1440 60V120H0Z" fill="currentColor" />
          </svg>
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
            <Trophy className="w-4 h-4 text-orange-300" />
            <span className="text-sm font-semibold text-white/90">Začni trénovat ještě dnes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Připraven zlepšit svou hru?
          </h2>
          <p className="text-lg sm:text-xl text-teal-100 mb-10 max-w-2xl mx-auto">
            Zaregistruj se ještě dnes a najdi si svého ideálního sparing partnera. Není důležité, kde jsi, ale kam směřuješ.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn bg-white text-teal-700 hover:bg-teal-50 min-h-[52px] px-8 shadow-lg shadow-black/10 hover:shadow-xl transition-all">
              Zaregistrovat se zdarma
              <ArrowRight className="w-5 h-5 ml-2 flex-shrink-0" aria-hidden />
            </Link>
            <Link to="/trainings" className="btn bg-transparent text-white border-2 border-white/30 hover:bg-white/10 hover:border-white/50 min-h-[52px] px-8 transition-all">
              Prohlédnout nabídky
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-16 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl" aria-hidden>🏆</span>
                <span className="text-xl font-bold">Můj trénink</span>
              </div>
              <p className="text-gray-400 text-sm">
                Najdi si svého ideálního sparing partnera.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
              <div>
                <p className="font-semibold text-white mb-3">Platforma</p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link to="/#jak-to-funguje" className="hover:text-white transition-colors">Jak to funguje</Link></li>
                  <li><Link to="/login" className="hover:text-white transition-colors">Přihlásit se</Link></li>
                  <li><Link to="/register" className="hover:text-white transition-colors">Registrace</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-white mb-3">Pro hráče</p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link to="/trainings" className="hover:text-white transition-colors">Tréninky</Link></li>
                  <li><Link to="/training-requests" className="hover:text-white transition-colors">Poptávky</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-white mb-3">Podpora</p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link to="/contact" className="hover:text-white transition-colors">Kontakt</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
            © 2026 Můj trénink. Všechna práva vyhrazena.
          </div>
        </div>
      </footer>
    </div>
  )
}
