import { createContext, useContext, useState, useEffect } from 'react'
import i18n from '../i18n'

const LanguageContext = createContext(null)
export const LANGUAGES = [
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'en', label: 'EN', name: 'English' },
]

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('es')
  useEffect(() => { i18n.changeLanguage(language); document.documentElement.lang = language }, [language])
  const changeLanguage = (code) => { if (LANGUAGES.some(l => l.code === code)) setLanguage(code) }
  return (
    <LanguageContext.Provider value={{ language, changeLanguage, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be within LanguageProvider')
  return ctx
}
