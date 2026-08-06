import { motion } from 'framer-motion'
import { HealthStatusCard } from '../components/HealthStatusCard'
import { useHealthStatus } from '../hooks/useHealthStatus'
import './HomePage.css'

export function HomePage() {
  const { data, isLoading } = useHealthStatus()
  const isHealthy = data?.success === true && data?.data?.backend?.status === 'healthy'

  return (
    <section className="home-page">
      <motion.div
        className="intro-panel"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <p className="eyebrow">Security operations platform</p>
        <h1>HoneyGuard</h1>
        <p className="subtitle">Deception-Based Attack Intelligence</p>
        <p className="supporting-copy">A secure foundation is online. Dashboard intelligence will be introduced in later phases.</p>
      </motion.div>
      <HealthStatusCard isLoading={isLoading} isHealthy={isHealthy} />
    </section>
  )
}
