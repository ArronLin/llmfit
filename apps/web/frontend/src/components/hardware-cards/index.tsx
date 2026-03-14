import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Cpu, HardDrive, Monitor } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import type { SystemSpecs } from '@/lib/api'

interface HardwareCardsProps {
  specs: SystemSpecs | null
}

export function HardwareCards({ specs }: HardwareCardsProps) {
  const { t } = useTranslation()

  if (!specs) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('common.loading')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('hardware.cpu')}</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{specs.cpu_name}</div>
          <p className="text-xs text-muted-foreground">{specs.cpu_cores} {t('hardware.cores')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('hardware.memory')}</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {specs.ram_available_gb.toFixed(1)} / {specs.ram_total_gb.toFixed(1)} GB
          </div>
          <p className="text-xs text-muted-foreground">
            {((specs.ram_available_gb / specs.ram_total_gb) * 100).toFixed(0)}% {t('hardware.available')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('hardware.gpu')}</CardTitle>
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {specs.gpus.length > 0 ? (
            specs.gpus.map((gpu, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <div className="text-2xl font-bold">{gpu.name}</div>
                <p className="text-xs text-muted-foreground">
                  {gpu.vram_available_gb.toFixed(1)} / {gpu.vram_total_gb.toFixed(1)} GB VRAM
                </p>
              </div>
            ))
          ) : (
            <>
              <div className="text-2xl font-bold">{t('hardware.noGpu')}</div>
              <p className="text-xs text-muted-foreground">{t('hardware.cpuInference')}</p>
            </>
          )}
          {specs.unified_memory && (
            <p className="text-xs text-muted-foreground mt-2">{t('hardware.unifiedMemory')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
