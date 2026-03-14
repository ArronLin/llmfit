import { useAppStore } from '@/store'
import { t, type Language } from '@/lib/i18n'

export function useTranslation() {
  const language = useAppStore((state) => state.language)
  
  return {
    language,
    t: (key: string) => t(language as Language, key),
  }
}
