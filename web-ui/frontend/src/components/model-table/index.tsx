import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/hooks/useTranslation'
import type { ModelFit } from '@/lib/api'

interface ModelTableProps {
  models: ModelFit[]
}

const getFitLevelColor = (level: string) => {
  switch (level) {
    case 'Perfect':
      return 'bg-green-500'
    case 'Good':
      return 'bg-blue-500'
    case 'Marginal':
      return 'bg-yellow-500'
    case 'TooTight':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

const getRunModeLabel = (mode: string) => {
  switch (mode) {
    case 'Gpu':
      return 'GPU'
    case 'CpuOffload':
      return 'CPU Offload'
    case 'CpuOnly':
      return 'CPU Only'
    default:
      return mode
  }
}

const formatParams = (params: number) => {
  if (params >= 1e12) {
    return `${(params / 1e12).toFixed(1)}T`
  } else if (params >= 1e9) {
    return `${(params / 1e9).toFixed(1)}B`
  } else if (params >= 1e6) {
    return `${(params / 1e6).toFixed(1)}M`
  }
  return params.toString()
}

export function ModelTable({ models }: ModelTableProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('table.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {models.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('common.noResults')}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.modelName')}</TableHead>
                  <TableHead>{t('table.provider')}</TableHead>
                  <TableHead>{t('table.parameters')}</TableHead>
                  <TableHead>{t('table.fitLevel')}</TableHead>
                  <TableHead>{t('table.runMode')}</TableHead>
                  <TableHead>{t('table.overallScore')}</TableHead>
                  <TableHead>{t('table.quality')}</TableHead>
                  <TableHead>{t('table.speed')}</TableHead>
                  <TableHead>{t('table.context')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((fit, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {fit.model.name.split('/').pop()}
                    </TableCell>
                    <TableCell>{fit.model.provider}</TableCell>
                    <TableCell>{formatParams(fit.model.parameter_count)}</TableCell>
                    <TableCell>
                      <Badge className={getFitLevelColor(fit.fit_level)}>
                        {fit.fit_level}
                      </Badge>
                    </TableCell>
                    <TableCell>{getRunModeLabel(fit.run_mode)}</TableCell>
                    <TableCell>
                      {(fit.overall_score * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell>
                      {(fit.quality_score * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell>
                      {(fit.speed_score * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell>
                      {(fit.context_score * 100).toFixed(0)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
