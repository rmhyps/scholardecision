import { useEffect, useRef, useState } from 'react'
import { MainLayout } from './components/layout/MainLayout'
import { evaluators } from './data/evaluators'
import { pages } from './pages'
import type { PageId } from './pages'
import { AssessmentFormPage } from './pages/AssessmentFormPage'
import type { AssessmentDraft } from './pages/AssessmentFormPage'
import { CandidatesPage } from './pages/CandidatesPage'
import { ConsensusPage } from './pages/ConsensusPage'
import { CriteriaPage } from './pages/CriteriaPage'
import { DashboardPage } from './pages/DashboardPage'
import { AuditPage } from './pages/AuditPage'
import { LoginPage } from './pages/LoginPage'
import { PeriodsPage } from './pages/PeriodsPage'
import { ProfilePage } from './pages/ProfilePage'
import { ReportsPage } from './pages/ReportsPage'
import { ValidationPage } from './pages/ValidationPage'
import { rememberedRole, rememberRole } from './lib/demoSession'
import { useSelection } from './state/SelectionContext'
import { TopsisResultsPage } from './pages/TopsisResultsPage'
import { WeightsPage } from './pages/WeightsPage'
import type { WeightDraft } from './pages/WeightsPage'
import type { EvaluatorId } from './types'

const emptyAssessment: AssessmentDraft = { values: {}, savedAt: null }

export default function App() {
  const [initialRole] = useState(rememberedRole)
  const [activePage, setActivePage] = useState<PageId>(initialRole ? 'dashboard' : 'login')
  const [evaluatorId, setEvaluatorId] = useState<EvaluatorId>(initialRole ?? evaluators[0].id)
  const [hasSession, setHasSession] = useState(Boolean(initialRole))
  const { track } = useSelection()
  const [weightDrafts, setWeightDrafts] = useState<Partial<Record<EvaluatorId, WeightDraft>>>({})
  const [assessmentDrafts, setAssessmentDrafts] = useState<Partial<Record<EvaluatorId, AssessmentDraft>>>({})
  const previousPage = useRef(activePage)
  const evaluator = evaluators.find(({ id }) => id === evaluatorId) ?? evaluators[0]
  const weightDraft = weightDrafts[evaluatorId] ?? {}

  useEffect(() => {
    document.title = `${pages[activePage].title} | ScholarDecision`
    if (previousPage.current === activePage) return
    previousPage.current = activePage
    window.scrollTo(0, 0)
    document.getElementById('page-title')?.focus({ preventScroll: true })
  }, [activePage])

  function logout() {
    rememberRole(null)
    setHasSession(false)
    setActivePage('login')
    void track({ actor: evaluatorId, category: 'akses', action: 'Keluar portal akademik', detail: 'Sesi login demo ditutup.', status: 'Tervalidasi' })
  }

  if (activePage === 'login') {
    return (
      <LoginPage
        onLogin={(id, remember) => {
          setEvaluatorId(id)
          rememberRole(remember ? id : null)
          setHasSession(true)
          setActivePage('dashboard')
        }}
        onReturn={hasSession ? () => setActivePage('dashboard') : undefined}
      />
    )
  }

  function renderPage() {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage evaluator={evaluator} onNavigate={setActivePage} />
      case 'data-mahasiswa':
        return <CandidatesPage />
      case 'kriteria':
        return <CriteriaPage evaluator={evaluator} />
      case 'bobot':
        return (
          <WeightsPage
            key={evaluatorId}
            evaluator={evaluator}
            draft={weightDraft}
            updateDraft={(update) => setWeightDrafts((previous) => ({
              ...previous, [evaluatorId]: update(previous[evaluatorId] ?? {}),
            }))}
          />
        )
      case 'penilaian':
        return (
          <AssessmentFormPage
            key={evaluatorId}
            evaluator={evaluator}
            draft={assessmentDrafts[evaluatorId] ?? emptyAssessment}
            hasUnsavedWeights={Object.keys(weightDraft).length > 0}
            updateDraft={(update) => setAssessmentDrafts((previous) => ({
              ...previous, [evaluatorId]: update(previous[evaluatorId] ?? emptyAssessment),
            }))}
          />
        )
      case 'topsis':
        return <TopsisResultsPage evaluator={evaluator} />
      case 'borda':
        return <ConsensusPage evaluator={evaluator} />
      case 'pengesahan':
        return <ValidationPage evaluator={evaluator} onReports={() => setActivePage('laporan')} />
      case 'profil':
        return <ProfilePage key={evaluatorId} evaluator={evaluator} onLogout={logout} />
      case 'periode':
        return <PeriodsPage evaluator={evaluator} />
      case 'laporan':
        return <ReportsPage />
      case 'audit':
        return <AuditPage />
    }
  }

  return (
    <MainLayout
      activePage={activePage}
      evaluatorId={evaluatorId}
      onEvaluatorChange={(id) => {
        if (id === evaluatorId) return
        setEvaluatorId(id)
        void track({ actor: id, category: 'akses', action: 'Beralih peran simulasi', detail: 'Konteks penilaian aktif berganti.', status: 'Tervalidasi' })
      }}
      onNavigate={setActivePage}
    >
      {renderPage()}
    </MainLayout>
  )
}
