import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LangProvider } from './lib/i18n'
import { StoreProvider, useStore } from './lib/store'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import DriverDashboard from './pages/DriverDashboard'

function Protected({ role, children }) {
  const { user } = useStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />
  return children
}

export default function App() {
  return (
    <LangProvider>
      <StoreProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/student" element={<Protected role="student"><StudentDashboard /></Protected>} />
            <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
            <Route path="/driver" element={<Protected role="driver"><DriverDashboard /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </StoreProvider>
    </LangProvider>
  )
}
