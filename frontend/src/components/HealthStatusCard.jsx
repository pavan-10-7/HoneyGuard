import { motion } from 'framer-motion'

const states = {
  loading: { label: 'Checking connection', detail: 'Verifying the HoneyGuard API.', tone: 'loading' },
  healthy: { label: 'Backend connected', detail: 'API and database are responding.', tone: 'healthy' },
  unavailable: { label: 'Backend unavailable', detail: 'Start the API service, then this status will retry.', tone: 'unavailable' },
}

export function HealthStatusCard({ isLoading, isHealthy }) {
  const status = isLoading ? states.loading : isHealthy ? states.healthy : states.unavailable

  return (
    <motion.section
      className="health-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      aria-live="polite"
    >
      <div className={`status-indicator status-indicator--${status.tone}`} aria-hidden="true" />
      <div>
        <p className="health-card__eyebrow">System link</p>
        <p className="health-card__title">{status.label}</p>
        <p className="health-card__detail">{status.detail}</p>
      </div>
    </motion.section>
  )
}
