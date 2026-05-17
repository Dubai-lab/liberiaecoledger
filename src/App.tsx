import { Routes, Route, Navigate } from 'react-router-dom'
import { ScrollToTop } from '@/components/ScrollToTop'
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
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { LandingPage } from '@/pages/landing/LandingPage'
import { PrivacyPolicyPage } from '@/pages/legal/PrivacyPolicyPage'
import { TermsOfServicePage } from '@/pages/legal/TermsOfServicePage'
import { CookiePolicyPage } from '@/pages/legal/CookiePolicyPage'
import { CodeOfEthicsPage } from '@/pages/legal/CodeOfEthicsPage'
import { GDPRCompliancePage } from '@/pages/legal/GDPRCompliancePage'
import { ConsumersPage } from '@/pages/platform/ConsumersPage'
import { ManufacturersPage } from '@/pages/platform/ManufacturersPage'
import { RecyclersPage } from '@/pages/platform/RecyclersPage'
import { RegulatorsPage } from '@/pages/platform/RegulatorsPage'
import { AuditorsPage } from '@/pages/platform/AuditorsPage'
import { WhitepaperPage } from '@/pages/resources/WhitepaperPage'
import { APIDocsPage } from '@/pages/resources/APIDocsPage'
import { BlockExplorerPage } from '@/pages/resources/BlockExplorerPage'
import { PressKitPage } from '@/pages/resources/PressKitPage'
import { ChangelogPage } from '@/pages/resources/ChangelogPage'

export default function App() {
  const { isLoading, isAuthenticated, profile, activeRole } = useAuth()

  if (isLoading) return <LoadingScreen />

  // First-time invited users have no full_name — send them to account setup
  const needsSetup = isAuthenticated && profile !== null && !profile.full_name

  return (
    <>
    <ScrollToTop />
    <Routes>
      {/* Landing page — public */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to={`/${activeRole ?? 'consumer'}`} replace />
            : <LandingPage />
        }
      />

      {/* Platform pages — public */}
      <Route path="/platform/consumers"     element={<ConsumersPage />} />
      <Route path="/platform/manufacturers" element={<ManufacturersPage />} />
      <Route path="/platform/recyclers"     element={<RecyclersPage />} />
      <Route path="/platform/regulators"    element={<RegulatorsPage />} />
      <Route path="/platform/auditors"      element={<AuditorsPage />} />

      {/* Resources pages — public */}
      <Route path="/whitepaper"     element={<WhitepaperPage />} />
      <Route path="/api-docs"       element={<APIDocsPage />} />
      <Route path="/block-explorer" element={<BlockExplorerPage />} />
      <Route path="/press-kit"      element={<PressKitPage />} />
      <Route path="/changelog"      element={<ChangelogPage />} />

      {/* Legal pages — public */}
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms"   element={<TermsOfServicePage />} />
      <Route path="/cookies" element={<CookiePolicyPage />} />
      <Route path="/ethics"  element={<CodeOfEthicsPage />} />
      <Route path="/gdpr"    element={<GDPRCompliancePage />} />

      {/* Password reset — public, no layout needed */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

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
        <Route path="/account" element={<AccountSettingsPage />} />
        <Route path="/consumer/*" element={<ConsumerRoutes />} />
        <Route path="/manufacturer/*" element={<ManufacturerRoutes />} />
        <Route path="/recycler/*" element={<RecyclerRoutes />} />
        <Route path="/regulator/*" element={<RegulatorRoutes />} />
        <Route path="/auditor/*" element={<AuditorRoutes />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
