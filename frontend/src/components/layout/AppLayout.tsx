import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Starfield } from '@/components/Starfield'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { WakeBanner } from './WakeBanner'

export function AppLayout() {
  const location = useLocation()
  return (
    <div className="flex min-h-svh flex-col">
      <Starfield />
      <Header />
      <WakeBanner />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>
      <footer className="border-t border-border pb-20 md:pb-0">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted sm:flex-row sm:justify-between">
          <span>Orbit · a window on the cosmos</span>
          <span>Data: NASA Open APIs, the NASA Image Library, and live ISS orbital data. Not affiliated with NASA.</span>
        </div>
      </footer>
      <BottomNav />
    </div>
  )
}
