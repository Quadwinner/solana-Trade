import { UiLayout } from '@/components/ui/ui-layout'
import { lazy } from 'react'
import { Navigate, RouteObject, useRoutes } from 'react-router-dom'
import { AdminRoute } from '../components/auth/AdminRoute'
import { LoginForm } from '../components/auth/LoginForm'
import { AdminPanel } from '../components/auth/AdminPanel'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

const AccountListFeature = lazy(() => import('../components/account/account-list-feature'))
const AccountDetailFeature = lazy(() => import('../components/account/account-detail-feature'))
const ClusterFeature = lazy(() => import('../components/cluster/cluster-feature'))
const SolanaTradeFeature = lazy(() => import('../components/SolanaTrade/SolanaTrade-feature'))
const DashboardFeature = lazy(() => import('../components/dashboard/dashboard-feature'))
const MarketplaceFeature = lazy(() => import('../components/trading/marketplace-wrapper'))
const PortfolioFeature = lazy(() => import('../components/trading/portfolio-wrapper'))

const links: { label: string; path: string }[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'Marketplace', path: '/marketplace' },
  { label: 'Account', path: '/account' },
  { label: 'Clusters', path: '/clusters' },
  { label: 'Admin', path: '/admin' },
]

export function AppRoutes() {
  const router = useRoutes([
    { index: true, element: <Navigate to={'/dashboard'} replace={true} /> },
    { 
      path: '/dashboard', 
      element: (
        <UiLayout links={links}>
          <ProtectedRoute>
            <DashboardFeature />
          </ProtectedRoute>
        </UiLayout> 
      )
    },
    { path: '/account/', element: <UiLayout links={links}><AccountListFeature /></UiLayout> },
    { 
      path: '/account/:address', 
      element: (
        <UiLayout links={links}>
          <ProtectedRoute>
            <AccountDetailFeature />
          </ProtectedRoute>
        </UiLayout>
      )
    },
    { path: '/clusters', element: <UiLayout links={links}><ClusterFeature /></UiLayout> },
    { 
      path: '/portfolio', 
      element: (
        <UiLayout links={links}>
          <ProtectedRoute>
            <PortfolioFeature />
          </ProtectedRoute>
        </UiLayout>
      )
    },
    { 
      path: '/marketplace', 
      element: (
        <UiLayout links={links}>
          <ProtectedRoute>
            <MarketplaceFeature />
          </ProtectedRoute>
        </UiLayout>
      )
    },
    { path: '/login', element: <UiLayout links={links}><LoginForm /></UiLayout> },
    { 
      path: '/admin', 
      element: (
        <UiLayout links={links}>
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        </UiLayout>
      )
    },
    { path: '*', element: <Navigate to={'/dashboard'} replace={true} /> },
  ])
  
  return router;
}
