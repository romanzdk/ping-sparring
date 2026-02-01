import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Trainings from './pages/Trainings'
import Profile from './pages/Profile'
import TrainingDetail from './pages/TrainingDetail'
import TrainingCreate from './pages/TrainingCreate'
import TrainingEdit from './pages/TrainingEdit'
import TrainingRequests from './pages/TrainingRequests'
import TrainingRequestCreate from './pages/TrainingRequestCreate'
import TrainingRequestEdit from './pages/TrainingRequestEdit'
import TrainingRequestDetail from './pages/TrainingRequestDetail'
import MyTrainings from './pages/MyTrainings'
import Notifications from './pages/Notifications'
import RegistrationDetail from './pages/RegistrationDetail'
import Contact from './pages/Contact'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { NotificationsProvider } from './hooks/useNotifications'

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-teal-200 border-t-teal-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={!isAuthenticated ? <Landing /> : <Navigate to="/dashboard" />} />
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/trainings" element={<Trainings />} />
      <Route path="/my-trainings" element={isAuthenticated ? <MyTrainings /> : <Navigate to="/login" />} />
      <Route path="/trainings/new" element={isAuthenticated ? <TrainingCreate /> : <Navigate to="/login" />} />
      <Route path="/trainings/:id/edit" element={isAuthenticated ? <TrainingEdit /> : <Navigate to="/login" />} />
      <Route path="/trainings/:id" element={isAuthenticated ? <TrainingDetail /> : <Navigate to="/login" />} />
      <Route path="/training-requests" element={<TrainingRequests />} />
      <Route path="/training-requests/new" element={isAuthenticated ? <TrainingRequestCreate /> : <Navigate to="/login" />} />
      <Route path="/training-requests/:id/edit" element={isAuthenticated ? <TrainingRequestEdit /> : <Navigate to="/login" />} />
      <Route path="/training-requests/:id" element={isAuthenticated ? <TrainingRequestDetail /> : <Navigate to="/login" />} />
      <Route path="/registrations/:id" element={isAuthenticated ? <RegistrationDetail /> : <Navigate to="/login" />} />
      <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
      <Route path="/notifications" element={isAuthenticated ? <Notifications /> : <Navigate to="/login" />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <AppRoutes />
      </NotificationsProvider>
    </AuthProvider>
  )
}

export default App
