import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import type { Player, Club } from '../types'
import Layout from '../components/Layout'
import { User, UserCircle, Mail, Award, MapPin, Target, Calendar, Edit2, Save, X, Phone } from 'lucide-react'

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Player | Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/v1/users/me/profile')
      setProfile(res.data)
      setEditData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await api.put('/api/v1/users/me/profile', editData)
      setProfile(res.data)
      setIsEditing(false)

      // Success notification
      const notif = document.createElement('div')
      notif.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-lg animate-scale-in z-50'
      notif.innerHTML = '✓ Profil byl úspěšně aktualizován!'
      document.body.appendChild(notif)
      setTimeout(() => notif.remove(), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Chyba při ukládání profilu')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16">
          <div className="inline-block">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Načítání profilu...</p>
        </div>
      </Layout>
    )
  }

  const isPlayer = user?.role === 'player'
  const playerProfile = profile as Player
  const clubProfile = profile as Club

  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="card">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-teal-700">Můj profil</h1>
                <p className="text-gray-600 font-medium mt-1">Spravuj své informace</p>
              </div>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary flex items-center"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Upravit profil
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary flex items-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Zrušit
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary flex items-center"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Uložit
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}
          {isEditing && (
            <p className="text-sm text-gray-600 mb-6">Pole označená <span className="text-red-600 font-semibold">*</span> jsou povinná, ostatní jsou nepovinná.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-teal-50 rounded-xl border-2 border-teal-200">
              <div className="flex items-center mb-4">
                <Mail className="w-6 h-6 text-teal-600 mr-3" />
                <p className="font-bold text-gray-900 text-lg">Email</p>
              </div>
              <p className="text-gray-700 font-medium text-lg">{user?.email}</p>
              <p className="text-xs text-gray-500 mt-1">Email nelze změnit</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl border-2 border-cyan-200">
              <div className="flex items-center mb-4">
                <UserCircle className="w-6 h-6 text-cyan-600 mr-3" />
                <p className="font-bold text-gray-900 text-lg">Jméno <span className="text-gray-500 font-normal">(nepovinné)</span></p>
              </div>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={editData.first_name ?? ''}
                    onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                    className="input"
                    placeholder="Jméno"
                  />
                  <input
                    type="text"
                    value={editData.last_name ?? ''}
                    onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                    className="input"
                    placeholder="Příjmení"
                  />
                </div>
              ) : (
                <p className="text-gray-700 font-medium">
                  {(() => {
                    const fn = isPlayer ? playerProfile?.first_name : clubProfile?.first_name
                    const ln = isPlayer ? playerProfile?.last_name : clubProfile?.last_name
                    const name = [fn, ln].filter(Boolean).join(' ')
                    return name || 'Nezadáno'
                  })()}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">Zobrazuje se u poptávek a přihlášek</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
              <div className="flex items-center mb-4">
                <User className="w-6 h-6 text-purple-600 mr-3" />
                <p className="font-bold text-gray-900 text-lg">Role</p>
              </div>
              <p className="text-gray-700 font-medium text-lg capitalize">
                <span className="text-gray-700" aria-hidden>{user?.role === 'player' ? '🎯' : '🏢'}</span> {user?.role === 'player' ? 'Hráč' : 'Klub'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Role nelze změnit</p>
            </div>

            {isPlayer ? (
              <>
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center mb-4">
                    <Target className="w-6 h-6 text-green-600 mr-3" />
                    <p className="font-bold text-gray-900 text-lg">Hodnocení ELO {isEditing && <span className="text-red-600">*</span>}</p>
                  </div>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.elo || ''}
                      onChange={(e) => setEditData({ ...editData, elo: parseInt(e.target.value) })}
                      className="input"
                      required
                    />
                  ) : (
                    <p className="text-4xl font-black text-green-600">{playerProfile?.elo}</p>
                  )}
                  {playerProfile?.official_elo && (
                    <p className="text-sm text-gray-600 mt-2 font-medium">Oficiální: {playerProfile.official_elo}</p>
                  )}
                </div>

                <div className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border-2 border-pink-200">
                  <div className="flex items-center mb-4">
                    <MapPin className="w-6 h-6 text-pink-600 mr-3" />
                    <p className="font-bold text-gray-900 text-lg">Adresa {isEditing && <span className="text-gray-500 font-normal">(nepovinné)</span>}</p>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.home_address || ''}
                      onChange={(e) => setEditData({ ...editData, home_address: e.target.value })}
                      className="input"
                      placeholder="Vaše adresa"
                    />
                  ) : (
                    <p className="text-gray-700 font-medium">{playerProfile?.home_address || 'Nezadáno'}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center mb-4">
                    <Award className="w-6 h-6 text-green-600 mr-3" />
                    <p className="font-bold text-gray-900 text-lg">Název klubu {isEditing && <span className="text-red-600">*</span>}</p>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.club_name || ''}
                      onChange={(e) => setEditData({ ...editData, club_name: e.target.value })}
                      className="input"
                      placeholder="Název vašeho klubu"
                      required
                    />
                  ) : (
                    <p className="text-2xl font-black text-green-600">{clubProfile?.club_name || 'Nezadáno'}</p>
                  )}
                </div>
                <div className="p-6 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border-2 border-sky-200">
                  <div className="flex items-center mb-4">
                    <Phone className="w-6 h-6 text-sky-600 mr-3" />
                    <p className="font-bold text-gray-900 text-lg">Telefon <span className="text-gray-500 font-normal">(nepovinné)</span></p>
                  </div>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="input"
                      placeholder="+420 123 456 789"
                    />
                  ) : (
                    <p className="text-gray-700 font-medium">{clubProfile?.phone || 'Nezadáno'}</p>
                  )}
                </div>
              </>
            )}

            <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
              <div className="flex items-center mb-4">
                <Calendar className="w-6 h-6 text-amber-600 mr-3" />
                <p className="font-bold text-gray-900 text-lg">Člen od</p>
              </div>
              <p className="text-gray-700 font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('cs-CZ') : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
