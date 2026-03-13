import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SystemSpecs, ModelFit, FilterOptions } from '@/lib/api'

interface AppState {
  theme: 'light' | 'dark' | 'system'
  language: 'zh' | 'en'
  systemSpecs: SystemSpecs | null
  models: ModelFit[]
  filters: FilterOptions
  providers: string[]
  useCases: string[]
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLanguage: (lang: 'zh' | 'en') => void
  setSystemSpecs: (specs: SystemSpecs | null) => void
  setModels: (models: ModelFit[]) => void
  setFilters: (filters: Partial<FilterOptions>) => void
  setProviders: (providers: string[]) => void
  setUseCases: (useCases: string[]) => void
}

const defaultFilters: FilterOptions = {
  search_text: '',
  providers: [],
  fit_levels: [],
  min_params: undefined,
  max_params: undefined,
  min_context: undefined,
  use_cases: [],
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'zh',
      systemSpecs: null,
      models: [],
      filters: defaultFilters,
      providers: [],
      useCases: [],
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setSystemSpecs: (systemSpecs) => set({ systemSpecs }),
      setModels: (models) => set({ models }),
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      setProviders: (providers) => set({ providers }),
      setUseCases: (useCases) => set({ useCases }),
    }),
    {
      name: 'llmfit-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
)
