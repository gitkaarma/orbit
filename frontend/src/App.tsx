import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { isRetryable } from '@/api/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui/spinner'

const Today = lazy(() => import('@/pages/Today').then((m) => ({ default: m.Today })))
const Apod = lazy(() => import('@/pages/Apod').then((m) => ({ default: m.Apod })))
const Explore = lazy(() => import('@/pages/Explore').then((m) => ({ default: m.Explore })))
const Iss = lazy(() => import('@/pages/Iss').then((m) => ({ default: m.Iss })))
const Asteroids = lazy(() => import('@/pages/Asteroids').then((m) => ({ default: m.Asteroids })))
const Earth = lazy(() => import('@/pages/Earth').then((m) => ({ default: m.Earth })))
const Saved = lazy(() => import('@/pages/Saved').then((m) => ({ default: m.Saved })))
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => isRetryable(error) && failureCount < 2,
      refetchOnWindowFocus: false,
    },
  },
})

function Page({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Spinner className="size-6 text-muted" /></div>}>
      {children}
    </Suspense>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Page><Today /></Page>} />
            <Route path="/apod" element={<Page><Apod /></Page>} />
            <Route path="/explore" element={<Page><Explore /></Page>} />
            <Route path="/iss" element={<Page><Iss /></Page>} />
            <Route path="/asteroids" element={<Page><Asteroids /></Page>} />
            <Route path="/earth" element={<Page><Earth /></Page>} />
            <Route path="/saved" element={<Page><Saved /></Page>} />
            <Route path="*" element={<Page><NotFound /></Page>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
