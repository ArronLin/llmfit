import { useEffect, useCallback } from 'react'
import { useAppStore } from '@/store'
import { systemApi, modelsApi } from '@/lib/api'
import { useTranslation } from '@/hooks/useTranslation'
import { HardwareCards } from '@/components/hardware-cards'
import { ModelTable } from '@/components/model-table'
import { FilterPanel } from '@/components/filter-panel'

export function HomePage() {
  const { t } = useTranslation()
  const { 
    systemSpecs, 
    setSystemSpecs, 
    models, 
    setModels,
    filters,
    providers,
    setProviders,
    useCases,
    setUseCases,
  } = useAppStore()

  const loadSystemSpecs = useCallback(async () => {
    try {
      const specs = await systemApi.getSpecs()
      setSystemSpecs(specs)
    } catch (error) {
      console.error('Failed to load system specs:', error)
    }
  }, [setSystemSpecs])

  const loadProviders = useCallback(async () => {
    try {
      const data = await modelsApi.getProviders()
      setProviders(data)
    } catch (error) {
      console.error('Failed to load providers:', error)
    }
  }, [setProviders])

  const loadUseCases = useCallback(async () => {
    try {
      const data = await modelsApi.getUseCases()
      setUseCases(data)
    } catch (error) {
      console.error('Failed to load use cases:', error)
    }
  }, [setUseCases])

  const loadModelFits = useCallback(async () => {
    try {
      const data = await modelsApi.getFit(filters)
      setModels(data)
    } catch (error) {
      console.error('Failed to load model fits:', error)
    }
  }, [filters, setModels])

  useEffect(() => {
    loadSystemSpecs()
    loadProviders()
    loadUseCases()
  }, [loadSystemSpecs, loadProviders, loadUseCases])

  useEffect(() => {
    loadModelFits()
  }, [loadModelFits])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('home.title')}</h2>
        <p className="text-muted-foreground">{t('home.description')}</p>
      </div>
      <HardwareCards specs={systemSpecs} />
      <div className="flex gap-6">
        <div className="w-80 shrink-0">
          <FilterPanel />
        </div>
        <div className="flex-1">
          <ModelTable models={models} />
        </div>
      </div>
    </div>
  )
}
