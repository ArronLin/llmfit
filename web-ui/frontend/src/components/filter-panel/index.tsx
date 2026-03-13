import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store'
import { useTranslation } from '@/hooks/useTranslation'
import { Search } from 'lucide-react'

export function FilterPanel() {
  const { t } = useTranslation()
  const { filters, setFilters, providers, useCases } = useAppStore()

  const handleSearchChange = (value: string) => {
    setFilters({ search_text: value })
  }

  const handleProviderToggle = (provider: string) => {
    const current = filters.providers || []
    const next = current.includes(provider)
      ? current.filter((p) => p !== provider)
      : [...current, provider]
    setFilters({ providers: next })
  }

  const handleFitLevelToggle = (level: string) => {
    const current = filters.fit_levels || []
    const next = current.includes(level as any)
      ? current.filter((l) => l !== level)
      : [...current, level as any]
    setFilters({ fit_levels: next })
  }

  const handleUseCaseToggle = (useCase: string) => {
    const current = filters.use_cases || []
    const next = current.includes(useCase)
      ? current.filter((uc) => uc !== useCase)
      : [...current, useCase]
    setFilters({ use_cases: next })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('filters.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>{t('filters.search')}</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('filters.searchPlaceholder')}
              value={filters.search_text}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('filters.provider')}</Label>
          <div className="space-y-2">
            {providers.map((provider) => (
              <div key={provider} className="flex items-center space-x-2">
                <Checkbox
                  id={`provider-${provider}`}
                  checked={(filters.providers || []).includes(provider)}
                  onCheckedChange={() => handleProviderToggle(provider)}
                />
                <Label htmlFor={`provider-${provider}`} className="text-sm">
                  {provider}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('filters.fitLevel')}</Label>
          <div className="space-y-2">
            {(['Perfect', 'Good', 'Marginal', 'TooTight'] as const).map((level) => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox
                  id={`fit-${level}`}
                  checked={(filters.fit_levels || []).includes(level)}
                  onCheckedChange={() => handleFitLevelToggle(level)}
                />
                <Label htmlFor={`fit-${level}`} className="text-sm">
                  {level}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('filters.useCase')}</Label>
          <div className="space-y-2">
            {useCases.map((useCase) => (
              <div key={useCase} className="flex items-center space-x-2">
                <Checkbox
                  id={`usecase-${useCase}`}
                  checked={(filters.use_cases || []).includes(useCase)}
                  onCheckedChange={() => handleUseCaseToggle(useCase)}
                />
                <Label htmlFor={`usecase-${useCase}`} className="text-sm">
                  {useCase}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
