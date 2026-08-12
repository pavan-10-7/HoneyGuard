import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Database,
  Gauge,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldCheck,
  Wifi,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const DETECTION_RULES = [
  {
    name: "Multiple Requests",
    score: "+20",
    description:
      "Triggered when repeated requests are observed.",
  },
  {
    name: "High Request Volume",
    score: "+20",
    description:
      "Detects unusually high request activity.",
  },
  {
    name: "Multiple Decoys Targeted",
    score: "+20",
    description:
      "Identifies probing across multiple decoy services.",
  },
  {
    name: "Sensitive File Targeted",
    score: "+30",
    description:
      "Triggered when sensitive resources such as .env are targeted.",
  },
  {
    name: "Administrative Interfaces Probed",
    score: "+20",
    description:
      "Detects probing of administrative interfaces.",
  },
];

async function checkBackend() {
  const response = await fetch(
    `${API_BASE_URL}/health`,
    {
      signal: AbortSignal.timeout(3000),
    }
  );

  return response.ok;
}

async function startNewDemoSession() {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/sessions/demo/new`,
    {
      method: "POST",
    }
  );

  const payload =
    await response.json().catch(() => null);

  if (
    !response.ok ||
    payload?.success === false
  ) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        "Unable to start a new demo session."
    );
  }

  return payload;
}

export function SettingsPage() {
  const [backendStatus, setBackendStatus] =
    useState("checking");

  const [startingSession, setStartingSession] =
    useState(false);

  const [sessionMessage, setSessionMessage] =
    useState("");

  const [error, setError] = useState("");

  const checkSystem = useCallback(
    async () => {
      setBackendStatus("checking");

      try {
        const healthy =
          await checkBackend();

        setBackendStatus(
          healthy ? "connected" : "unavailable"
        );
      } catch {
        setBackendStatus("unavailable");
      }
    },
    []
  );

  useEffect(() => {
    checkSystem();
  }, [checkSystem]);

  const handleNewDemoSession =
    async () => {
      setStartingSession(true);
      setSessionMessage("");
      setError("");

      try {
        const payload =
          await startNewDemoSession();

        setSessionMessage(
          payload?.message ||
            "Demo session reset successfully."
        );

        await checkSystem();
      } catch (err) {
        setError(
          err.message ||
            "Unable to start a new demo session."
        );
      } finally {
        setStartingSession(false);
      }
    };

  return (
    <motion.div
      className="mx-auto w-full max-w-[1800px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
    >
      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="hg-label">
            System / Configuration
          </div>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Settings
          </h2>

          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#777] sm:text-[12px]">
            HoneyGuard monitoring, detection and
            demonstration configuration.
          </p>
        </div>

        <button
          type="button"
          onClick={checkSystem}
          className="hg-control flex min-h-[42px] items-center justify-center gap-2 px-3 py-2 text-[10px] font-medium"
        >
          <RefreshCw size={13} />

          Refresh Status
        </button>
      </section>

      {sessionMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#294a35] bg-[#0d1711] px-4 py-3 text-[10px] text-[#8bc99a]">
          <CheckCircle2 size={13} />

          {sessionMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-[#4a2929] bg-[#171010] px-4 py-3 text-[10px] text-[#d99090]">
          {error}
        </div>
      )}

      {/* =====================================================
          MONITORING + DETECTION
          ===================================================== */}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* MONITORING */}

        <SettingsPanel
          icon={<Activity size={15} />}
          title="Monitoring"
          subtitle="HoneyGuard telemetry configuration"
        >
          <StatusRow
            label="Monitoring Status"
            value="ACTIVE"
            status="success"
          />

          <StatusRow
            label="Event Capture"
            value="ENABLED"
            status="success"
          />

          <StatusRow
            label="Real-time Updates"
            value="ENABLED"
            status="success"
          />

          <StatusRow
            label="WebSocket"
            value="LIVE"
            status="success"
          />

          <StatusRow
            label="Session Tracking"
            value="ENABLED"
            status="success"
          />
        </SettingsPanel>

        {/* DETECTION */}

        <SettingsPanel
          icon={<ShieldCheck size={15} />}
          title="Detection Engine"
          subtitle="Current rule-based threat analysis"
        >
          <StatusRow
            label="Engine Status"
            value="ACTIVE"
            status="success"
          />

          <StatusRow
            label="Detection Mode"
            value="RULE-BASED"
          />

          <StatusRow
            label="Live Scoring"
            value="ENABLED"
            status="success"
          />

          <StatusRow
            label="Severity Levels"
            value="4"
          />

          <StatusRow
            label="Detection Rules"
            value={DETECTION_RULES.length}
          />
        </SettingsPanel>
      </section>

      {/* =====================================================
          DETECTION RULES
          ===================================================== */}

      <section className="mt-4 hg-raised overflow-hidden">
        <div className="hg-panel-header flex items-center gap-3 px-4 py-4 sm:px-5">
          <div className="hg-inset flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--hg-gold-bright)]">
            <Gauge size={14} />
          </div>

          <div>
            <h3 className="text-[12px] font-semibold text-[#e5e5e5] sm:text-[13px]">
              Detection Rules
            </h3>

            <p className="mt-1 text-[10px] text-[#666]">
              Factors contributing to the session
              threat score.
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#202020]">
          {DETECTION_RULES.map(
            (rule, index) => (
              <div
                key={rule.name}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5"
              >
                <div className="hg-inset flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
                  <span className="hg-mono text-[8px] text-[#666]">
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-medium text-[#c5c5c5]">
                    {rule.name}
                  </div>

                  <div className="mt-1 text-[9px] leading-4 text-[#555]">
                    {rule.description}
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="rounded border border-[#3d3320] bg-[#15120c] px-2 py-1 hg-mono text-[9px] font-medium text-[var(--hg-gold-bright)]">
                    {rule.score}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* =====================================================
          DEMO MODE + SYSTEM STATUS
          ===================================================== */}

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        {/* DEMO MODE */}

        <SettingsPanel
          icon={<Zap size={15} />}
          title="Demo Mode"
          subtitle="Controls for live HoneyGuard demonstrations"
        >
          <div className="rounded-lg border border-[#2c2c2c] bg-[#101010] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold text-[#ddd]">
                  Start New Demo Session
                </div>

                <p className="mt-1 max-w-lg text-[9px] leading-5 text-[#555]">
                  Complete the current attack session
                  and reset scoring so the next attack
                  starts from a clean state.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleNewDemoSession
                }
                disabled={startingSession}
                className="flex min-h-[40px] shrink-0 items-center justify-center gap-2 rounded-md border border-[#514321] bg-[#17130b] px-3 py-2 text-[9px] font-medium text-[var(--hg-gold-bright)] transition-colors hover:bg-[#211b0e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw
                  size={12}
                  className={
                    startingSession
                      ? "animate-spin"
                      : ""
                  }
                />

                {startingSession
                  ? "Starting..."
                  : "Start New Session"}
              </button>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-[#252525] bg-[#0e0e0e] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--hg-success)]" />

              <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#777]">
                Automated Demo Attack
              </span>
            </div>

            <p className="mt-2 text-[9px] leading-5 text-[#555]">
              Run{" "}
              <span className="hg-mono text-[#888]">
                python demo_attack.py
              </span>{" "}
              from the backend environment to
              generate the automated attack sequence.
            </p>
          </div>
        </SettingsPanel>

        {/* SYSTEM STATUS */}

        <SettingsPanel
          icon={<Server size={15} />}
          title="System Status"
          subtitle="Current HoneyGuard service state"
        >
          <SystemStatusRow
            icon={<Server size={13} />}
            label="Backend API"
            value={
              backendStatus ===
              "connected"
                ? "CONNECTED"
                : backendStatus ===
                  "checking"
                ? "CHECKING"
                : "UNAVAILABLE"
            }
            status={
              backendStatus ===
              "connected"
                ? "success"
                : backendStatus ===
                  "checking"
                ? "warning"
                : "critical"
            }
          />

          <SystemStatusRow
            icon={<Database size={13} />}
            label="Database"
            value="CONNECTED"
            status="success"
          />

          <SystemStatusRow
            icon={<Wifi size={13} />}
            label="WebSocket"
            value="AVAILABLE"
            status="success"
          />

          <SystemStatusRow
            icon={<ShieldCheck size={13} />}
            label="Detection Engine"
            value="ACTIVE"
            status="success"
          />

          <SystemStatusRow
            icon={<Activity size={13} />}
            label="Telemetry Collector"
            value="ACTIVE"
            status="success"
          />
        </SettingsPanel>
      </section>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <section className="mt-4 hg-inset rounded-lg px-4 py-4 text-center">
        <p className="text-[9px] leading-5 text-[#555]">
          HoneyGuard configuration is currently
          optimized for the demonstration environment.
          Detection rules are managed by the backend
          rule engine.
        </p>
      </section>
    </motion.div>
  );
}

/* =========================================================
   SETTINGS PANEL
   ========================================================= */

function SettingsPanel({
  icon,
  title,
  subtitle,
  children,
}) {
  return (
    <section className="hg-raised overflow-hidden">
      <div className="hg-panel-header flex items-center gap-3 px-4 py-4 sm:px-5">
        <div className="hg-inset flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--hg-gold-bright)]">
          {icon}
        </div>

        <div>
          <h3 className="text-[12px] font-semibold text-[#e5e5e5] sm:text-[13px]">
            {title}
          </h3>

          <p className="mt-1 text-[10px] text-[#666]">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="divide-y divide-[#202020] px-4 sm:px-5">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   STATUS ROW
   ========================================================= */

function StatusRow({
  label,
  value,
  status = "",
}) {
  const statusClass = {
    success:
      "text-[var(--hg-success)]",
    warning:
      "text-[var(--hg-gold-bright)]",
    critical:
      "text-[var(--hg-critical)]",
  }[status] || "text-[#888]";

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-[9px] text-[#666]">
        {label}
      </span>

      <span
        className={[
          "hg-mono text-[9px] font-medium",
          statusClass,
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   SYSTEM STATUS ROW
   ========================================================= */

function SystemStatusRow({
  icon,
  label,
  value,
  status,
}) {
  const statusConfig = {
    success: {
      text: "text-[var(--hg-success)]",
      dot: "bg-[var(--hg-success)]",
    },
    warning: {
      text: "text-[var(--hg-gold-bright)]",
      dot: "bg-[var(--hg-gold-bright)]",
    },
    critical: {
      text: "text-[var(--hg-critical)]",
      dot: "bg-[var(--hg-critical)]",
    },
  };

  const config =
    statusConfig[status] ||
    statusConfig.warning;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="hg-inset flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#666]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <span className="text-[10px] text-[#aaa]">
          {label}
        </span>
      </div>

      <div
        className={[
          "flex items-center gap-1.5 hg-mono text-[8px] font-medium",
          config.text,
        ].join(" ")}
      >
        <span
          className={[
            "h-1.5 w-1.5 rounded-full",
            config.dot,
          ].join(" ")}
        />

        {value}
      </div>
    </div>
  );
}