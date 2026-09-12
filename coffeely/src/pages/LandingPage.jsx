/**
 * LandingPage.jsx
 * Página de aterrizaje enterprise de Coffeely.
 * Ensambla: SystemBar → LandingHeader → HeroPreview →
 *           MetricsPreviewSection → ModulesSection →
 *           CtaFooterCard → AppFooter
 */
import SystemBar          from '../components/landing/SystemBar'
import LandingHeader      from '../components/landing/LandingHeader'
import HeroPreview        from '../components/landing/HeroPreview'
import MetricsPreviewSection from '../components/landing/MetricPreviewCard'
import ModulesSection     from '../components/landing/ModulesSection'
import CtaFooterCard      from '../components/landing/CtaFooterCard'
import AppFooter          from '../components/landing/AppFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-light flex flex-col font-sans text-text-main">
      <SystemBar />
      <LandingHeader />

      {/* Contenedor principal con espaciado generoso (TAREA 0.3) */}
      <main
        id="main-content"
        className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8
                   flex flex-col gap-10 py-10"
        role="main"
      >
        {/* Hero: imagen + tarjeta de bienvenida + micro-sección prueba social */}
        <HeroPreview />

        {/* Métricas de ejemplo */}
        <MetricsPreviewSection />

        {/* Módulos del sistema */}
        <ModulesSection />

        {/* CTA de cierre */}
        <CtaFooterCard />
      </main>

      <AppFooter />
    </div>
  )
}
