import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Send, ArrowLeft, User, MessageSquare } from 'lucide-react'
import api from '../services/api'
import Layout from '../components/Layout'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      await api.post('/api/v1/contact/', {
        name: name.trim() || undefined,
        email: email.trim(),
        subject: subject.trim() || undefined,
        message: message.trim(),
      })
      setSent(true)
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { detail?: string } } }).response : undefined
      setError(res?.data?.detail ?? 'Zprávu se nepodařilo odeslat. Zkuste to znovu.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 font-medium mb-8"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Zpět na úvod
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-teal-100 rounded-xl">
              <Mail className="w-6 h-6 text-teal-600" aria-hidden />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Kontakt</h1>
          </div>
          <p className="text-gray-600 mb-8">
            Máte dotaz nebo návrh? Napište mi. Odpovídám obvykle do 24 hodin.
          </p>

          <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Kontaktní osoba
            </p>
            <p className="text-lg font-bold text-gray-900">Roman Žydyk</p>
            <p className="text-gray-600 text-sm mt-0.5">Můj trénink – platforma pro sparing partnery</p>
          </div>

          {sent ? (
            <div
              className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800"
              role="status"
            >
              <p className="font-semibold">Zpráva byla odeslána.</p>
              <p className="text-sm mt-1">
                Děkujeme. Ozveme se vám co nejdříve na váš e-mail.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-4 text-sm font-medium text-teal-600 hover:text-teal-700 underline"
              >
                Odeslat další zprávu
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="contact-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Jméno
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden />
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input pl-10"
                    placeholder="Vaše jméno"
                    maxLength={200}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden />
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="vas@email.cz"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Předmět
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input"
                  placeholder="Např. Dotaz k registraci klubu"
                  maxLength={300}
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Zpráva <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" aria-hidden />
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input min-h-[140px] pl-10 resize-y"
                    placeholder="Napište nám..."
                    required
                    minLength={1}
                    maxLength={5000}
                    rows={5}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">{message.length} / 5000</p>
              </div>

              <button
                type="submit"
                disabled={sending || !email.trim() || !message.trim()}
                className="btn btn-primary w-full sm:w-auto min-h-[48px] px-8"
              >
                {sending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden />
                    Odesílám…
                  </span>
                ) : (
                  <>
                    Odeslat zprávu
                    <Send className="w-5 h-5 ml-2 inline-block" aria-hidden />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  )
}
