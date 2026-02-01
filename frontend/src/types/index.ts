export interface User {
  id: number
  email: string
  role: 'player' | 'club'
  first_name?: string
  last_name?: string
  created_at: string
  club_name?: string
}

export interface Player {
  id: number
  user_id: number
  elo: number
  official_elo: number | null
  primary_districts: number[]
  home_address: string | null
  max_travel_distance: number | null
  availability: Record<string, string[]> | null
  max_trainings_per_week: number | null
  first_name?: string | null
  last_name?: string | null
}

export interface Club {
  id: number
  user_id: number
  club_name: string
  phone?: string | null
  contact_info: Record<string, any> | null
  first_name?: string | null
  last_name?: string | null
}

export type ScheduleType = 'recurring' | 'one_time'

/** Sport options for trainings and requests. Value is API slug. */
export const SPORTS = [
  { value: 'stolni_tenis', label: 'Stolní tenis', emoji: '🏓' },
] as const

export type SportValue = (typeof SPORTS)[number]['value']

export interface Training {
  id: number
  club_id: number
  sport?: string
  title: string
  description: string | null
  schedule_type?: ScheduleType
  day_of_week: number
  start_time: string
  end_time: string
  location: string
  address: string
  district_id: number
  region_id: number
  elo_min: number
  elo_max: number
  elo_tolerance: number
  capacity: number
  fee: number | null
  rules: string | null
  approval_mode: 'auto' | 'manual'
  is_active: boolean
  created_at: string
  contact_email?: string | null
  contact_phone?: string | null
  club_name?: string | null
  /** For one_time: date of the single session (ISO string). */
  session_date?: string | null
  /** Free spots on next upcoming scheduled session (from list API). */
  free_spots_next?: number | null
}

export interface TrainingSession {
  id: number
  training_id: number
  date: string
  status: 'scheduled' | 'cancelled' | 'completed'
  actual_participants_count: number
  registered_count?: number
  created_at: string
}

export interface Registration {
  id: number
  player_id: number
  training_session_id: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'waitlist'
  created_at: string
  approved_at: string | null
  cancelled_at: string | null
}

export interface RegistrationDetail extends Registration {
  session_date: string
  training_id: number
  training_title: string
  training_location: string
}

export interface RegistrationWithPlayer extends Registration {
  player_name: string
}

/** Full attendee details for club view (registrations per session). */
export interface RegistrationWithPlayerDetail extends RegistrationWithPlayer {
  player_email?: string | null
  player_first_name?: string | null
  player_last_name?: string | null
  elo?: number
  official_elo?: number | null
  primary_district_names?: string[]
  reliability_score?: number | null
  home_address?: string | null
  max_travel_distance?: number | null
  max_trainings_per_week?: number | null
}

export interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  read: boolean
  action_url: string | null
  created_at: string
}

export interface TrainingRequest {
  id: number
  player_id: number
  sport?: string
  title: string
  description?: string
  preferred_days: number[]
  preferred_times?: any
  district_ids: number[]
  elo_min: number
  elo_max: number
  phone?: string | null
  status: 'open' | 'matched' | 'closed'
  created_at: string
  updated_at: string
  player_email?: string | null
  player_name?: string | null
}
