import { Outlet } from 'react-router-dom'

export function BaseLayout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="HoneyGuard home">
          <span className="brand__mark" aria-hidden="true">H</span>
          <span>HoneyGuard</span>
        </a>
        <span className="topbar__label">Foundation · Phase 1.3</span>
      </header>
      <main className="app-main"><Outlet /></main>
    </div>
  )
}
