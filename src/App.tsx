import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { MobileLayout } from '@/layouts/MobileLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RoleSelectPage } from '@/pages/auth/RoleSelectPage'
import { InstitutionalLoginPage } from '@/pages/auth/InstitutionalLoginPage'
import { SetupAccountPage } from '@/pages/auth/SetupAccountPage'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { ConsumerRoutes } from '@/routes/ConsumerRoutes'
import { ManufacturerRoutes } from '@/routes/ManufacturerRoutes'
import { RecyclerRoutes } from '@/routes/RecyclerRoutes'
import { RegulatorRoutes } from '@/routes/RegulatorRoutes'
import { AuditorRoutes } from '@/routes/AuditorRoutes'
import { AdminRoutes } from '@/routes/AdminRoutes'
import { MobileRoutes } from '@/routes/MobileRoutes'
import { MobileLoginPage } from '@/pages/mobile/MobileLoginPage'
import { AccountSettingsPage } from '@/pages/shared/AccountSettingsPage'

export default function App() {
  const { isLoading, isAuthenticated, profile, activeRole } = useAuth()

  if (isLoading) return <LoadingScreen />

  // First-time invited users have no full_name — send them to account setup
  const needsSetup = isAuthenticated && profile !== null && !profile.full_name

  return (
    <Routes>
      {/* Public auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/institutional" element={<InstitutionalLoginPage />} />

        {/* Account setup — authenticated but no name/password yet */}
        <Route
          path="/setup-account"
          element={isAuthenticated ? <SetupAccountPage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/role-select"
          element={
            !isAuthenticated
              ? <Navigate to="/login" replace />
              : needsSetup
              ? <Navigate to="/setup-account" replace />
              : <RoleSelectPage />
          }
        />
      </Route>

      {/* Mobile login — public */}
      <Route
        path="/mobile/login"
        element={isAuthenticated ? <Navigate to="/mobile" replace /> : <MobileLoginPage />}
      />

      {/* Mobile app routes — protected */}
      <Route
        element={
          !isAuthenticated
            ? <Navigate to="/mobile/login" replace />
            : <MobileLayout />
        }
      >
        <Route path="/mobile/*" element={<MobileRoutes />} />
      </Route>

      {/* Protected dashboard routes */}
      <Route
        element={
          !isAuthenticated
            ? <Navigate to="/login" replace />
            : needsSetup
            ? <Navigate to="/setup-account" replace />
            : <DashboardLayout />
        }
      >
        <Route index element={<Navigate to={`/${activeRole ?? 'login'}`} replace />} />
        <Route path="/account" element={<AccountSettingsPage />} />
        <Route path="/consumer/*" element={<ConsumerRoutes />} />
        <Route path="/manufacturer/*" element={<ManufacturerRoutes />} />
        <Route path="/recycler/*" element={<RecyclerRoutes />} />
        <Route path="/regulator/*" element={<RegulatorRoutes />} />
        <Route path="/auditor/*" element={<AuditorRoutes />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
