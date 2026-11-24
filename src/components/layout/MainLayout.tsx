import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { PageId } from '../../pages'
import type { EvaluatorId } from '../../types'
import { Modal } from '../ui/Modal'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface MainLayoutProps {
  activePage: PageId
  children: ReactNode
  evaluatorId: EvaluatorId
  onEvaluatorChange: (id: EvaluatorId) => void
  onNavigate: (page: PageId) => void
  onLogout?: () => void
}

export function MainLayout({ activePage, children, evaluatorId, onEvaluatorChange, onNavigate, onLogout }: MainLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!menuOpen) return
    const wideViewport = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false)
    }

    wideViewport.addEventListener('change', closeOnDesktop)
    return () => wideViewport.removeEventListener('change', closeOnDesktop)
  }, [menuOpen])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:p-3"
      >
        Lompat ke konten utama
      </a>
      <aside className="sticky top-0 hidden h-dvh flex-col self-start bg-navy-950 lg:flex">
        <Sidebar activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} />
      </aside>
      <div className="min-w-0">
        <Header
          evaluatorId={evaluatorId}
          menuOpen={menuOpen}
          onEvaluatorChange={onEvaluatorChange}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenProfile={() => onNavigate('profil')}
        />
        <main id="konten-utama" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <motion.div
            key={activePage}
            initial={reduceMotion ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
      <Modal id="mobile-navigation" open={menuOpen} onClose={() => setMenuOpen(false)} drawer title="Menu">
        <Sidebar
          activePage={activePage}
          onNavigate={(page) => {
            setMenuOpen(false)
            onNavigate(page)
          }}
          onLogout={onLogout && (() => {
            setMenuOpen(false)
            onLogout()
          })}
        />
      </Modal>
    </div>
  )
}
