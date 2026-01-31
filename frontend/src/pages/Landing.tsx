import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Users, Calendar, CheckCircle, ArrowRight, MapPin, Settings, Star } from 'lucide-react'
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
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#f0f9f9]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[min(100%,24rem)] h-72 bg-teal-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 sm:pb-24">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-base sm:text-lg text-gray-600 font-medium mt-4 mb-8 pb-4 border-b border-gray-200 max-w-xl mx-auto">
              Najdi si svého sparing partnera na trénink.
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Trénuj <span style={{ color: 'rgb(5 150 105)' }}>častěji</span>, buď <span style={{ color: 'rgb(249 115 22)' }}>lepší</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 leading-relaxed">
              Platforma pro párování tréninků. Najdi kvalitní sparing partnery ve tvém okolí na tvé úrovni. Bez zbytečností, bez chaosu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/register" className="btn btn-primary text-lg min-h-[48px] px-8">
                Zaregistrovat se
                <ArrowRight className="w-5 h-5 ml-2 flex-shrink-0" aria-hidden />
              </Link>
              <Link to="/login" className="btn btn-secondary text-lg min-h-[48px] px-8">
                Přihlásit se
              </Link>
              <Link to="/#jak-to-funguje" className="btn btn-secondary text-lg min-h-[48px] px-8">
                Jak to funguje
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Rychlý vstup – Nabídky a Poptávky */}
      <section className="py-12 sm:py-16 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link
              to="/trainings"
              className="card-hover flex items-center gap-4 p-6 rounded-2xl border-2 border-gray-100 hover:border-teal-200 group"
            >
              <div className="p-3 bg-teal-100 rounded-xl flex-shrink-0 group-hover:bg-teal-200/80 transition-colors">
                <Calendar className="w-8 h-8 text-teal-600" aria-hidden />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-sm font-semibold text-teal-600 mb-0.5">Bez přihlášení</p>
                <p className="text-xl font-bold text-gray-900 group-hover:text-teal-700">Nabídky tréninků</p>
                <p className="text-sm text-gray-600 mt-0.5">Prohlédni aktuální tréninky</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 flex-shrink-0" aria-hidden />
            </Link>
            <Link
              to="/training-requests"
              className="card-hover flex items-center gap-4 p-6 rounded-2xl border-2 border-gray-100 hover:border-teal-200 group"
            >
              <div className="p-3 bg-teal-100 rounded-xl flex-shrink-0 group-hover:bg-teal-200/80 transition-colors">
                <Users className="w-8 h-8 text-teal-600" aria-hidden />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-sm font-semibold text-teal-600 mb-0.5">Bez přihlášení</p>
                <p className="text-xl font-bold text-gray-900 group-hover:text-teal-700">Poptávky hráčů</p>
                <p className="text-sm text-gray-600 mt-0.5">Kdo hledá sparring</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 flex-shrink-0" aria-hidden />
            </Link>
          </div>
          <p className="mt-6 text-center text-gray-500 text-sm">
            Pro detail a přihlášení se <Link to="/register" className="text-teal-600 hover:underline font-medium">zaregistruj</Link> nebo <Link to="/login" className="text-teal-600 hover:underline font-medium">přihlas</Link>.
          </p>

          {/* Podporované sporty */}
          <div className="mt-12 sm:mt-16 pt-12 sm:pt-16 border-t border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 text-center">
              Podporované sporty
            </h2>
            <p className="text-gray-600 text-center mb-6 max-w-xl mx-auto">
              Na platformě můžeš hledat sparing partnery pro následující sporty.
            </p>
            <ul className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {SPORTS.map(({ value, label, emoji }) => (
                <li
                  key={value}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-gray-100 hover:border-teal-200 text-gray-800 font-medium transition-colors"
                >
                  <span className="text-xl" aria-hidden>{emoji}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-center text-gray-500 text-sm">
              Další sporty mohou v průběhu času přibýt.
            </p>
          </div>
        </div>
      </section>

      {/* Proč Můj trénink? */}
      <section className="py-16 sm:py-24 bg-[#f8fafb]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Proč Můj trénink?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Řešíme opakovaný problém pravidelného tréninku. Automaticky, transparentně, bez zbytečného chaosu.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Settings, title: 'Párování podle úrovně', desc: 'Automatické doporučení ideálního sparing partnera například podle ELO.', accent: 'teal' as const },
              { icon: MapPin, title: 'Regionální tréninky', desc: 'Najdi sparing partnery ve svém okolí. Zadej lokaci a hraj.', accent: 'orange' as const },
              { icon: Calendar, title: 'Automatizace', desc: 'Zjednodušená administrace, řízení tréninků, správa výsledků.', accent: 'teal' as const },
              { icon: Star, title: 'Spolehlivost', desc: 'Systém hodnocení pro férové a spolehlivé hráče.', accent: 'orange' as const },
            ].map(({ icon: Icon, title, desc, accent }) => (
              <div key={title} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${accent === 'orange' ? 'bg-orange-100' : 'bg-teal-100'}`}>
                  <Icon className={`w-6 h-6 ${accent === 'orange' ? 'text-orange-500' : 'text-teal-600'}`} aria-hidden />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jak to funguje */}
      <section id="jak-to-funguje" className="py-16 sm:py-24 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Jak to funguje?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Čtyři jednoduché kroky k tvému dalšímu tréninku.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Zaregistruj se', desc: 'Vytvoř si účet, vyplň data a preferovaný čas tréninku.' },
              { num: '02', title: 'Najdi trénink', desc: 'Procházej dostupné tréninky ve svém okolí podle úrovně.' },
              { num: '03', title: 'Přihlas se', desc: 'Jednoduše se přihlas. Tvůj sparring partner čeká.' },
              { num: '04', title: 'Trénuj', desc: 'Přijď a potrénuj. Bez chaosu, bez čekání.' },
            ].map(({ num, title, desc }, i) => (
              <div key={num} className="text-center sm:text-left">
                <p className={`text-2xl font-bold mb-2 ${i % 2 === 0 ? 'text-teal-600' : 'text-orange-500'}`}>{num}</p>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pro trenéry a kluby */}
      <section className="py-16 sm:py-24 bg-[#f8fafb]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Jsi trenér nebo vedoucí klubu?
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Přidej svůj klub a staň se součástí naší platformy. Získej kvalitní hráče pro tréninky, spravuj rozvrhy a rozšiř komunitu.
              </p>
              <ul className="space-y-4 mb-8">
                {['Automatické schvalování hráčů například podle ELO', 'Přehledná správa rezervací', 'Celkový přehled tréninků', 'Plánování a oznámení automatizovány'].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn bg-orange-500 hover:bg-orange-600 text-white min-h-[48px] px-8">
                Zjistit více
                <ArrowRight className="w-5 h-5 ml-2 flex-shrink-0" aria-hidden />
              </Link>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-sm aspect-square rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center border border-gray-100">
                <span className="text-8xl" aria-hidden>🏆</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-teal-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Připraven zlepšit svou hru?
          </h2>
          <p className="text-lg sm:text-xl text-teal-100 mb-8">
            Zaregistruj se ještě dnes a najdi si svého ideálního sparing partnera. Není důležité, kde jsi, ale kam směřuješ.
          </p>
          <Link to="/trainings" className="btn bg-white text-teal-600 hover:bg-teal-50 border-2 border-white min-h-[48px] px-8">
            Prohlédnout nabídky
            <ArrowRight className="w-5 h-5 ml-2 flex-shrink-0" aria-hidden />
          </Link>
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
