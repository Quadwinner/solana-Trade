import { lazy } from 'react'

const IntraDayTradingFeature = lazy(() => import('./IntraDayTradingFeature'))

export default function IntraDayWrapper() {
  return <IntraDayTradingFeature />
} 