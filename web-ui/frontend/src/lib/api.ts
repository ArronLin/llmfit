import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface GpuInfo {
  name: string
  vram_total_gb: number
  vram_available_gb: number
}

export interface SystemSpecs {
  cpu_name: string
  cpu_cores: number
  ram_total_gb: number
  ram_available_gb: number
  gpus: GpuInfo[]
  unified_memory: boolean
}

export interface LlmModel {
  name: string
  provider: string
  parameter_count: number
  min_ram_gb: number
  recommended_ram_gb: number
  min_vram_gb?: number
  quantization: string
  context_length: number
  use_case: string
}

export interface UtilizationScores {
  vram: number
  ram: number
}

export type FitLevel = 'Perfect' | 'Good' | 'Marginal' | 'TooTight'
export type RunMode = 'Gpu' | 'CpuOffload' | 'CpuOnly'

export interface ModelFit {
  model: LlmModel
  fit_level: FitLevel
  run_mode: RunMode
  utilization: UtilizationScores
  quality_score: number
  speed_score: number
  context_score: number
  overall_score: number
}

export interface FilterOptions {
  search_text?: string
  providers?: string[]
  fit_levels?: FitLevel[]
  min_params?: number
  max_params?: number
  min_context?: number
  use_cases?: string[]
}

export const systemApi = {
  getSpecs: async (): Promise<SystemSpecs> => {
    const response = await api.get('/system')
    return response.data
  },
}

export const modelsApi = {
  getAll: async (q?: string): Promise<LlmModel[]> => {
    const response = await api.get('/models', { params: q ? { q } : {} })
    return response.data
  },
  getProviders: async (): Promise<string[]> => {
    const response = await api.get('/models/providers')
    return response.data
  },
  getUseCases: async (): Promise<string[]> => {
    const response = await api.get('/models/use-cases')
    return response.data
  },
  getFit: async (filters?: FilterOptions): Promise<ModelFit[]> => {
    const response = await api.get('/fit', { params: filters })
    return response.data
  },
}

export const exportApi = {
  export: async (format: 'json' | 'csv', filters?: FilterOptions) => {
    const response = await api.get('/export', {
      params: { format, ...filters },
      responseType: 'blob',
    })
    return response.data
  },
}

export default api
