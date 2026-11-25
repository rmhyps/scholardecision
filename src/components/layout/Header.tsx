import { Bell, CircleUserRound, Menu } from 'lucide-react'
import { useState } from 'react'
import { activePeriod, evaluators } from '../../data/evaluators'
import type { EvaluatorId } from '../../types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface HeaderProps {
  evaluatorId: EvaluatorId
  menuOpen: boolean
  onOpenMenu: () => void
  onOpenProfile: () => void
}

export function Header({ evaluatorId, menuOpen, onOpenMenu, onOpenProfile }: HeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  return (
    <header className="border-b border-slate-200 bg-white px-3 py-2 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button
            variant="ghost"
            className="size-11 shrink-0 p-0 lg:hidden"
            aria-label="Buka navigasi"
            aria-haspopup="dialog"
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            onClick={onOpenMenu}
          >
            <Menu size={21} aria-hidden="true" />
          </Button>
          <Badge tone="active">
            <span className="size-1.5 shrink-0 rounded-full bg-teal-700" aria-hidden="true" />
            <span>Periode Aktif: {activePeriod}</span>
          </Badge>
        </div>
        <div className="flex shrink-0 flex-col items-end sm:flex-row sm:items-center sm:gap-2">
          <div className="flex items-center gap-0.5 sm:gap-2">
            <Button
              variant="ghost"
              className="size-11 p-0"
              aria-label="Notifikasi"
              aria-haspopup="dialog"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell size={19} aria-hidden="true" />
            </Button>
            <Button variant="ghost" className="size-11 p-0" aria-label="Profil penilai" onClick={onOpenProfile}>
              <CircleUserRound size={22} aria-hidden="true" />
            </Button>
          </div>
          <p className="max-w-[7rem] text-right text-xs font-medium text-slate-700 sm:max-w-none sm:text-sm">
            <span className="sr-only sm:not-sr-only">Akun aktif: </span>
            {evaluators.find(({ id }) => id === evaluatorId)?.name}
          </p>
        </div>
      </div>
      <Modal open={notificationsOpen} onClose={() => setNotificationsOpen(false)} title="Notifikasi">
        <p className="text-sm text-slate-700">Belum ada notifikasi.</p>
      </Modal>
    </header>
  )
}
