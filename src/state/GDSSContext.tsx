import { createContext, useContext, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { gdssDataset } from '../data/gdssDataset'
import type { CriterionId, CriterionVector, EvaluatorId } from '../types'
import { createGDSSState, deriveGDSS, gdssReducer } from './gdssState'
import type { GDSSState } from './gdssState'

type GDSSContextValue = GDSSState & ReturnType<typeof deriveGDSS> & {
  dataset: typeof gdssDataset
  setWeights: (evaluatorId: EvaluatorId, changes: Partial<CriterionVector>) => void
  setScore: (evaluatorId: EvaluatorId, alternativeId: string, criterionId: CriterionId, score: number) => void
  lockEvaluation: (evaluatorId: EvaluatorId) => void
  setQuota: (quota: number) => void
  freezeQuota: () => void
}

const GDSSContext = createContext<GDSSContextValue | null>(null)

export function GDSSProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gdssReducer, undefined, createGDSSState)
  const actions = useMemo<Pick<GDSSContextValue, 'setWeights' | 'setScore' | 'lockEvaluation' | 'setQuota' | 'freezeQuota'>>(() => ({
    setWeights: (evaluatorId, changes) => dispatch({ type: 'set-weights', evaluatorId, changes }),
    setScore: (evaluatorId, alternativeId, criterionId, score) => {
      dispatch({ type: 'set-score', evaluatorId, alternativeId, criterionId, score })
    },
    lockEvaluation: (evaluatorId) => dispatch({ type: 'lock-evaluation', evaluatorId }),
    setQuota: (quota) => dispatch({ type: 'set-quota', quota }),
    freezeQuota: () => dispatch({ type: 'freeze-quota' }),
  }), [dispatch])

  const value = useMemo<GDSSContextValue>(() => ({
    dataset: gdssDataset,
    ...state,
    ...deriveGDSS(state),
    ...actions,
  }), [state, actions])

  return <GDSSContext.Provider value={value}>{children}</GDSSContext.Provider>
}

export function useGDSS() {
  const context = useContext(GDSSContext)
  if (!context) {
    throw new Error('useGDSS harus dipakai di dalam GDSSProvider.')
  }
  return context
}
