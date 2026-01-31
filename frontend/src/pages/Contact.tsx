import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import Layout from '../components/Layout'

const CONTACT_EMAIL = 'info@mujtrenink.cz'

export default function Contact() {
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

          <p className="text-gray-700 mb-4">
            Napište nám e-mailem:
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 btn btn-primary"
          >
            <Mail className="w-5 h-5" aria-hidden />
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </Layout>
  )
}
