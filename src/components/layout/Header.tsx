import { Bell, ChevronDown, CircleUserRound, Menu } from 'lucide-react'
import { useState } from 'react'
import { activePeriod, evaluators } from '../../data/evaluators'
import type { EvaluatorId } from '../../types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface HeaderProps {
  evaluatorId: EvaluatorId
  menuOpen: boolean
  onEvaluatorChange: (id: EvaluatorId) => void
  onOpenMenu: () => void
  onOpenProfile: () => void
}

export function Header({ evaluatorId, menuOpen, onEvaluatorChange, onOpenMenu, onOpenProfile }: HeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  return (
    <header className="border-b border-slate-200 bg-white px-3 py-2 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2">
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
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
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
        <label className="flex w-full min-w-0 items-center gap-2 text-sm font-medium text-slate-700 sm:order-none sm:w-auto">
          <span className="shrink-0">Simulasi peran</span>
          <span className="relative min-w-0 flex-1">
            <select
              value={evaluatorId}
              onChange={(event) => {
                const selected = evaluators.find((evaluator) => evaluator.id === event.target.value)
                if (selected) onEvaluatorChange(selected.id)
              }}
              className="min-h-11 w-full appearance-none rounded-lg border border-slate-500 bg-white py-2 pl-3 pr-9 text-sm text-slate-900 sm:w-48"
            >
              {evaluators.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
          </span>
        </label>
      </div>
      <Modal open={notificationsOpen} onClose={() => setNotificationsOpen(false)} title="Notifikasi">
        <p className="text-sm text-slate-700">Belum ada notifikasi.</p>
      </Modal>
    </header>
  )
}
