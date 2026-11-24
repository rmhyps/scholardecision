import { GraduationCap } from 'lucide-react'
import { cn } from '../../lib/cn'
import { navigationGroups, pages } from '../../pages'
import type { PageId } from '../../pages'

interface SidebarProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-white/15 px-5 py-5 lg:py-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal-100 text-teal-900">
          <GraduationCap size={23} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold leading-tight text-white">ScholarDecision</p>
          <p className="mt-1 text-xs text-slate-300">GDSS TOPSIS &amp; Borda</p>
        </div>
      </div>
      <nav aria-label="Navigasi utama" className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {navigationGroups.map(({ label, pageIds }) => (
          <div key={label}>
            <p className="mb-1 px-3 text-xs font-semibold text-slate-300">{label}</p>
            <ul className="space-y-0.5">
              {pageIds.map((id) => {
                const { title, icon: Icon } = pages[id]
                const isActive = activePage === id
                return (
                  <li key={id}>
                    <button
                      type="button"
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => onNavigate(id)}
                      className={cn(
                        'flex min-h-11 w-full items-center gap-3 rounded-lg border-l-2 border-transparent px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-teal-300 motion-reduce:transition-none',
                        isActive
                          ? 'border-teal-300 bg-[#071a31] font-semibold text-white'
                          : 'text-slate-200 hover:bg-navy-800 hover:text-white',
                      )}
                    >
                      <Icon size={17} aria-hidden="true" className={cn('shrink-0', isActive && 'text-teal-300')} />
                      {title}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}
