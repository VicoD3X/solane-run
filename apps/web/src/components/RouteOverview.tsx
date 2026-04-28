import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { BadgeCheck, Clock3, Radar, Shield, ShieldAlert, Waypoints } from "lucide-react";

import type {
  QuoteInput,
  RouteResult,
  RouteRiskSummary,
  RouteSystem,
  RouteTrafficSummary,
  ServiceWindowSummary,
  SolarSystem,
} from "../types";

type RouteOverviewProps = {
  closing?: boolean;
  input: QuoteInput;
  route: RouteResult;
  serviceWindow: ServiceWindowSummary;
};

const fallbackColor = "#8393a3";

export function RouteOverview({ closing = false, input, route, serviceWindow }: RouteOverviewProps) {
  const systems = route.routeSystems.length > 0 ? route.routeSystems : fallbackSystems(input);
  const routeTraffic = route.routeTraffic ?? routeTrafficFromSystems(systems);
  const routeRisk = route.routeRisk ?? fallbackRouteRisk();
  const eutzTime = useParisClock();
  const routeLabel = input.pickup && input.destination
    ? `${input.pickup.name} - ${input.destination.name}`
    : "Awaiting endpoints";

  return (
    <section
      className={`road-overview ${closing ? "road-overview-closing" : ""}`}
      id="route"
      aria-labelledby="road-overview-title"
    >
      <div className="road-overview-scan" aria-hidden="true" />
      <header className="road-overview-header">
        <div className="road-title-block">
          <span>Road Overview</span>
          <h2 id="road-overview-title">{routeLabel}</h2>
        </div>
        <div className="road-jump-metric" role="group" aria-label={`${route.jumps} total jumps`}>
          <Waypoints size={17} />
          <span>Total jumps</span>
          <strong>{route.jumps}</strong>
        </div>
      </header>

      <div className="road-intel-grid" aria-label="Route intelligence">
        <RouteTrafficMetric
          detail={trafficDetail(routeTraffic)}
          icon={<Radar size={15} />}
          tone={`road-traffic-${routeTraffic.level}`}
          label="Traffic"
          value={routeTraffic.label}
        />
        <ServiceWindowMetric
          detail={serviceWindow.detail}
          eutzTime={eutzTime}
          icon={<Clock3 size={15} />}
          tone={`road-window-${serviceWindow.level}`}
          label="Contract Acceptance"
          value={serviceWindow.label}
        />
        {routeRisk.routeStandard === "golden" && !routeRisk.isBlocking ? (
          <GoldenStandardReport icon={<BadgeCheck size={15} />} risk={routeRisk} />
        ) : (
          <RouteRiskReport
            icon={<ShieldAlert size={15} />}
            risk={routeRisk}
          />
        )}
      </div>

      <div className="road-overview-strip" aria-label="Route security timeline">
        {systems.map((system, index) => (
          <RouteCell
            key={`${system.id}-${index}`}
            index={index}
            total={systems.length}
            system={system}
          />
        ))}
      </div>

      <footer className="road-overview-footer">
        <span>
          <Shield size={14} />
          Security
        </span>
        <ul aria-label="Route service color legend">
          {legendItems(systems).map((item) => (
            <li key={item.label}>
              <i style={{ background: item.color }} />
              {item.label}
            </li>
          ))}
        </ul>
      </footer>
    </section>
  );
}

function RouteTrafficMetric({
  detail,
  icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: ReactNode;
  label: string;
  tone?: string;
  value: string;
}) {
  return (
    <div className={`road-intel-card road-traffic-card ${tone ?? ""}`}>
      <div className="road-intel-icon" aria-hidden="true">{icon}</div>
      <div className="road-intel-copy">
        <span>
          <b>{label}</b>
        </span>
        <small>{detail}</small>
      </div>
      <div className="road-intel-value">
        <i aria-hidden="true" />
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ServiceWindowMetric({
  detail,
  eutzTime,
  icon,
  label,
  tone,
  value,
}: {
  detail: string;
  eutzTime: string;
  icon: ReactNode;
  label: string;
  tone?: string;
  value: string;
}) {
  return (
    <div className={`road-intel-card road-window-card ${tone ?? ""}`}>
      <div className="road-intel-icon" aria-hidden="true">{icon}</div>
      <div className="road-intel-copy">
        <span>
          <b>{label}</b>
        </span>
        <small>{detail}</small>
      </div>
      <div className="road-intel-value">
        <i aria-hidden="true" />
        <strong>{value}</strong>
      </div>
      <div className="road-eutz-time" aria-label={`EUTZ time ${eutzTime} Paris`}>
        <span>EUTZ Time</span>
        <strong>{eutzTime}</strong>
        <small>Paris</small>
      </div>
    </div>
  );
}

function RouteRiskReport({ icon, risk }: { icon: ReactNode; risk: RouteRiskSummary }) {
  const affected = risk.affectedSystems.slice(0, 5);
  const hiddenCount = Math.max(risk.affectedSystems.length - affected.length, 0);
  const showFlaggedSystems = isStaticRestrictedRisk(risk) && affected.length > 0;

  return (
    <div className={`road-intel-card road-route-state road-risk-report road-risk-${risk.level}`}>
      <div className="road-state-emblem" aria-hidden="true">{icon}</div>
      <div className="road-state-copy">
        <span>Route Risk</span>
        <p>{routeRiskReason(risk)}</p>
      </div>
      <strong>{risk.label}</strong>
      <div className="road-risk-meta" aria-label="Route risk details">
        {showFlaggedSystems ? (
          <span>
            Systems
            <b>{affected.map((system) => system.name).join(", ")}{hiddenCount > 0 ? ` +${hiddenCount}` : ""}</b>
          </span>
        ) : null}
        {risk.lowSecShipKillsLastHour !== null ? (
          <span>
            Ship destroyed
            <b>{risk.lowSecShipKillsLastHour.toLocaleString("en-US")} last hour</b>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function isStaticRestrictedRisk(risk: RouteRiskSummary) {
  return risk.level === "restricted" && (risk.reason ?? "").toLowerCase().includes("static");
}

function routeRiskReason(risk: RouteRiskSummary) {
  if (risk.level === "restricted") {
    return "Restricted Solane system.";
  }
  if (risk.level === "nominal") {
    return "No elevated risk detected.";
  }
  if (risk.level === "unavailable") {
    return "Risk telemetry unavailable.";
  }
  return risk.reason ?? "Risk telemetry active.";
}

function GoldenStandardReport({ icon, risk }: { icon: ReactNode; risk: RouteRiskSummary }) {
  return (
    <div className="road-intel-card road-route-state road-standard-report" aria-label="Golden Standard route">
      <div className="road-state-emblem" aria-hidden="true">{icon}</div>
      <div className="road-state-copy">
        <span>Golden Standard</span>
        <p>Official Solane route.</p>
      </div>
      <strong>Verified</strong>
      <div className="road-risk-meta road-standard-meta" aria-label="Golden Standard details">
        <span>
          Risk
          <b>{risk.label}</b>
        </span>
        <span>
          Signal
          <b>{risk.confidence}</b>
        </span>
      </div>
    </div>
  );
}

function useParisClock() {
  const [time, setTime] = useState(() => formatParisTime());

  useEffect(() => {
    const update = () => setTime(formatParisTime());
    update();
    const interval = window.setInterval(update, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return time;
}

function formatParisTime(now = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      minute: "2-digit",
      timeZone: "Europe/Paris",
    }).format(now);
  } catch {
    return "--:--";
  }
}

function RouteCell({ index, system, total }: { index: number; system: RouteSystem; total: number }) {
  const color = system.color ?? fallbackColor;
  const service = system.serviceType ?? "Unknown";
  const security = system.securityDisplay ?? "unknown";
  const traffic = trafficLabel(system.shipJumpsLastHour);
  const edgeClass = tooltipEdgeClass(index, total);

  return (
    <button
      aria-label={`${system.name}, ${service}, security ${security}, ${traffic}`}
      className={`road-system-cell ${edgeClass}`}
      style={{
        "--cell-color": color,
        "--cell-delay": `${280 + Math.min(index, 42) * 16}ms`,
        "--cell-close-delay": `${Math.min(index, 42) * 6}ms`,
      } as CSSProperties}
      type="button"
    >
      <span className="road-system-tooltip" role="tooltip">
        <strong>{system.name}</strong>
        <span>Security {security}</span>
        <span>{traffic}</span>
      </span>
    </button>
  );
}

function tooltipEdgeClass(index: number, total: number) {
  if (index < 6) {
    return "road-system-cell-start";
  }
  if (index >= total - 6) {
    return "road-system-cell-end";
  }
  return "";
}

function fallbackSystems(input: QuoteInput): RouteSystem[] {
  return [input.pickup, input.destination]
    .filter((system): system is SolarSystem => Boolean(system))
    .map((system) => ({
      id: system.id,
      name: system.name,
      securityDisplay: system.securityDisplay,
      serviceType: system.serviceType,
      color: system.color,
      shipJumpsLastHour: null,
    }));
}

function trafficLabel(shipJumpsLastHour: number | null | undefined) {
  if (shipJumpsLastHour === null || shipJumpsLastHour === undefined) {
    return "Traffic unavailable";
  }
  return `${shipJumpsLastHour.toLocaleString("en-US")} jumps last hour`;
}

function trafficDetail(traffic: RouteTrafficSummary) {
  if (traffic.totalShipJumpsLastHour === null) {
    return "Unavailable";
  }

  const partial = traffic.coverage > 0 && traffic.coverage < 1 ? " - partial" : "";
  return `${traffic.totalShipJumpsLastHour.toLocaleString("en-US")} last hour${partial}`;
}

function routeTrafficFromSystems(systems: RouteSystem[]): RouteTrafficSummary {
  const knownCounts = systems
    .map((system) => system.shipJumpsLastHour)
    .filter((value): value is number => value !== null && value !== undefined);
  const totalSystems = systems.length;
  const knownSystems = knownCounts.length;

  if (totalSystems === 0 || knownSystems === 0) {
    return {
      totalShipJumpsLastHour: null,
      knownSystems,
      totalSystems,
      coverage: 0,
      level: "unavailable",
      label: "Unavailable",
    };
  }

  const totalShipJumpsLastHour = knownCounts.reduce((total, value) => total + value, 0);
  const { label, level } = trafficLevel(totalShipJumpsLastHour);
  return {
    totalShipJumpsLastHour,
    knownSystems,
    totalSystems,
    coverage: Math.round((knownSystems / totalSystems) * 1000) / 1000,
    level,
    label,
  };
}

function trafficLevel(totalShipJumpsLastHour: number): Pick<RouteTrafficSummary, "label" | "level"> {
  if (totalShipJumpsLastHour < 1_000) {
    return { label: "Clear", level: "clear" };
  }
  if (totalShipJumpsLastHour < 7_000) {
    return { label: "Active", level: "active" };
  }
  if (totalShipJumpsLastHour < 12_000) {
    return { label: "Moderate", level: "moderate" };
  }
  if (totalShipJumpsLastHour < 20_100) {
    return { label: "Busy", level: "busy" };
  }
  return { label: "Heavy", level: "heavy" };
}

function fallbackRouteRisk(): RouteRiskSummary {
  return {
    affectedSystems: [],
    confidence: "unavailable",
    isBlocking: false,
    label: "Unavailable",
    lastSyncedAt: null,
    level: "unavailable",
    reason: "Risk telemetry unavailable.",
    routeStandard: "standard",
    routeStandardLabel: "Standard Route",
    lowSecShipKillsLastHour: null,
    trend: "unavailable",
  };
}

function legendItems(systems: RouteSystem[]) {
  const items = systems.reduce<{ label: string; color: string }[]>((accumulator, system) => {
    const label = system.serviceType ?? "Unknown";
    const color = system.color ?? fallbackColor;
    if (!accumulator.some((item) => item.label === label)) {
      accumulator.push({ label, color });
    }
    return accumulator;
  }, []);

  return items.length > 0 ? items : [{ label: "Unknown", color: fallbackColor }];
}
