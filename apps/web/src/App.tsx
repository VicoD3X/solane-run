import { useState, useTransition } from "react";
import {
  ArrowRight,
  Boxes,
  Clock3,
  DatabaseZap,
  ExternalLink,
  PlaneTakeoff,
  ShieldCheck,
} from "lucide-react";

import { AppShell } from "./components/AppShell";
import { DataPanel } from "./components/DataPanel";
import { QuotePanel } from "./components/QuotePanel";
import { Button } from "./components/ui/Button";
import { Input } from "./components/ui/Input";
import { SegmentedControl } from "./components/ui/SegmentedControl";
import { Select } from "./components/ui/Select";
import { calculateQuote, commonSystems, fallbackRoute } from "./data/demo";
import { fetchEsiRoute } from "./lib/api";
import type { QuoteInput, QuoteResult, RouteMode } from "./types";

const initialInput: QuoteInput = {
  origin: "Jita",
  destination: "Amarr",
  routeMode: "secure",
  volume: 320_000,
  collateral: 1_600_000_000,
};

const initialRoute = fallbackRoute(initialInput);

const routeStops = [
  { label: "", sec: "", x: 120, y: 190, tone: "high" },
  { label: "Perimeter", sec: "1.0", x: 160, y: 214, tone: "high" },
  { label: "Sobaseki", sec: "0.8", x: 246, y: 208, tone: "high" },
  { label: "", sec: "", x: 304, y: 234, tone: "high" },
  { label: "", sec: "", x: 360, y: 236, tone: "high" },
  { label: "Uedama", sec: "0.5", x: 414, y: 228, tone: "low" },
  { label: "", sec: "", x: 458, y: 260, tone: "low" },
  { label: "Hek", sec: "0.5", x: 528, y: 282, tone: "low" },
  { label: "Nakugard", sec: "0.4", x: 598, y: 318, tone: "low" },
  { label: "", sec: "", x: 678, y: 354, tone: "low" },
  { label: "Ashab", sec: "0.3", x: 708, y: 340, tone: "low" },
  { label: "", sec: "", x: 774, y: 328, tone: "low" },
] as const;

const starField = [
  [18, 96, 0.7], [47, 308, 1.1], [73, 58, 0.6], [96, 246, 0.8], [128, 151, 0.5],
  [152, 338, 0.7], [181, 84, 1.2], [213, 276, 0.5], [235, 37, 0.6], [267, 176, 0.8],
  [294, 354, 0.6], [322, 102, 1.0], [348, 254, 0.5], [371, 64, 0.7], [397, 316, 0.9],
  [421, 142, 0.5], [446, 228, 1.3], [475, 42, 0.6], [506, 292, 0.7], [531, 88, 0.5],
  [566, 372, 1.1], [589, 196, 0.6], [613, 121, 0.8], [642, 334, 0.5], [671, 52, 0.9],
  [704, 242, 0.6], [729, 392, 0.7], [758, 137, 1.0], [786, 286, 0.5], [815, 78, 0.8],
  [846, 366, 0.6], [874, 208, 1.2], [33, 372, 0.5], [112, 18, 0.7], [203, 408, 0.8],
  [287, 215, 0.6], [438, 386, 0.5], [493, 164, 0.7], [548, 28, 0.8], [697, 314, 0.5],
  [832, 32, 0.7], [858, 122, 0.5], [66, 188, 0.6], [169, 238, 0.5], [257, 123, 0.9],
  [333, 389, 0.5], [386, 181, 0.6], [462, 333, 0.7], [619, 266, 0.5], [738, 49, 0.6],
  [812, 251, 0.8], [884, 404, 0.5], [24, 24, 1.0], [142, 401, 0.6], [226, 311, 0.7],
  [319, 18, 0.5], [512, 414, 0.8], [575, 231, 0.5], [654, 174, 0.7], [766, 407, 0.6],
] as const;

function App() {
  const [input, setInput] = useState<QuoteInput>(initialInput);
  const [quote, setQuote] = useState<QuoteResult>(() => calculateQuote(initialInput, initialRoute));
  const [message, setMessage] = useState("Local estimate ready. Sync public ESI when the API is running.");
  const [isPending, startTransition] = useTransition();

  const updateInput = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => {
    const nextInput = { ...input, [key]: value };
    setInput(nextInput);
    setQuote(calculateQuote(nextInput, fallbackRoute(nextInput)));
    setMessage("Quote refreshed locally. Use Calculate Run to request the current ESI route.");
  };

  const calculateRun = () => {
    startTransition(async () => {
      try {
        const route = await fetchEsiRoute(input.origin, input.destination, input.routeMode);
        setQuote(calculateQuote(input, route));
        setMessage("Public ESI route synced. Pricing rules are still beta and may change.");
      } catch {
        const route = fallbackRoute(input);
        setQuote(calculateQuote(input, route));
        setMessage("Public ESI is unavailable or could not resolve the systems. Local route estimate is active.");
      }
    });
  };

  return (
    <AppShell>
      <section className="mission-console" id="calculator" aria-label="Solane Run freight calculator">
        <DataPanel className="form-panel" eyebrow="Quote Input" title="Freight parameters">
          <div className="system-row">
            <Select
              label="Origin"
              onChange={(event) => updateInput("origin", event.target.value)}
              options={commonSystems.map((system) => ({
                label: `${system.name} - ${system.region}`,
                value: system.name,
              }))}
              value={input.origin}
            />
            <ArrowRight aria-hidden="true" className="system-arrow" size={22} />
            <Select
              label="Destination"
              onChange={(event) => updateInput("destination", event.target.value)}
              options={commonSystems.map((system) => ({
                label: `${system.name} - ${system.region}`,
                value: system.name,
              }))}
              value={input.destination}
            />
          </div>

          <SegmentedControl<RouteMode>
            label="Route Mode"
            onChange={(value) => updateInput("routeMode", value)}
            options={[
              { label: "Shortest", value: "shortest" },
              { label: "Secure", value: "secure" },
              { label: "Insecure", value: "insecure" },
            ]}
            value={input.routeMode}
          />

          <div className="metric-grid">
            <Input
              hint="m3"
              label="Volume"
              min={1}
              onChange={(event) => updateInput("volume", Number(event.target.value))}
              type="number"
              value={input.volume}
            />
            <Input
              hint="ISK"
              label="Collateral"
              min={0}
              onChange={(event) => updateInput("collateral", Number(event.target.value))}
              type="number"
              value={input.collateral}
            />
          </div>

          <Button
            className="calculate-run-button"
            disabled={isPending}
            onClick={calculateRun}
          >
            {isPending ? "Calculating" : "Calculate Run"}
          </Button>

          <div className="quote-input-reserve" aria-hidden="true" />
        </DataPanel>

        <section className="route-panel route-map-panel" id="route" aria-labelledby="route-overview-title">
          <div className="route-map-header">
            <h2 id="route-overview-title">Route Overview</h2>
          </div>
          <div className="route-visual">
            <div className="route-legend" aria-label="Security legend">
              <span>
                <i className="legend-high" />
                High Sec
              </span>
              <span>
                <i className="legend-low" />
                Low Sec
              </span>
              <span>
                <i className="legend-null" />
                Null Sec
              </span>
            </div>
            <svg
              aria-label={`${input.origin} to ${input.destination} public route map`}
              className="route-map"
              role="img"
              viewBox="0 0 900 430"
            >
              <defs>
                <filter id="routeGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id="nodeFill" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#eff8ff" />
                  <stop offset="38%" stopColor="#60d7ff" />
                  <stop offset="100%" stopColor="#0d3150" />
                </radialGradient>
                <radialGradient id="lowNodeFill" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f4e8ff" />
                  <stop offset="42%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#2d124d" />
                </radialGradient>
              </defs>

              <g className="map-grid-lines">
                {Array.from({ length: 8 }).map((_, index) => (
                  <line key={`v-${index}`} x1={104 + index * 104} x2={104 + index * 104} y1="0" y2="430" />
                ))}
                {Array.from({ length: 5 }).map((_, index) => (
                  <line key={`h-${index}`} x1="0" x2="900" y1={74 + index * 74} y2={74 + index * 74} />
                ))}
              </g>

              <g className="map-stars">
                {starField.map(([x, y, r], index) => (
                  <circle cx={x} cy={y} key={index} r={r} />
                ))}
              </g>

              <path
                className="route-arc route-arc-shadow route-arc-high"
                d="M72 178 L120 190 L160 214 L246 208 L304 234 L360 236 L414 228"
              />
              <path
                className="route-arc route-arc-shadow route-arc-low"
                d="M414 228 L458 260 L528 282 L598 318 L678 354 L708 340 L774 328 L842 328"
              />
              <path
                className="route-arc route-arc-high"
                d="M72 178 L120 190 L160 214 L246 208 L304 234 L360 236 L414 228"
              />
              <path
                className="route-arc route-arc-low"
                d="M414 228 L458 260 L528 282 L598 318 L678 354 L708 340 L774 328 L842 328"
              />

              <g className="route-node route-node-major active" transform="translate(82 182)">
                <circle r="15" />
                <circle r="7" />
                <text className="route-label route-label-major" x="-32" y="-34">
                  {input.origin}
                </text>
                <text className="route-sec" x="34" y="-34">
                  0.9
                </text>
              </g>

              {routeStops.map((stop, index) => (
                <g className={`route-node route-node-${stop.tone}`} key={`${stop.label || "hop"}-${index}`} transform={`translate(${stop.x} ${stop.y})`}>
                  <circle r="9" />
                  <circle r="4" />
                  {stop.label ? (
                    <>
                      <text className="route-label" x={stop.tone === "low" ? -18 : -38} y={stop.tone === "low" ? -32 : 38}>
                        {stop.label}
                      </text>
                      <text className="route-sec" x={stop.tone === "low" ? -10 : -20} y={stop.tone === "low" ? -14 : 58}>
                        {stop.sec}
                      </text>
                    </>
                  ) : null}
                </g>
              ))}

              <g className="route-node route-node-major destination" transform="translate(842 328)">
                <circle r="15" />
                <circle r="7" />
                <text className="route-label route-label-major" x="-50" y="-34">
                  {input.destination}
                </text>
                <text className="route-sec" x="42" y="-34">
                  0.5
                </text>
              </g>
            </svg>
            <button className="view-map-button" type="button">
              View on Map
              <ExternalLink size={17} />
            </button>
          </div>

          <div className="telemetry-grid">
            <div>
              <DatabaseZap size={18} />
              <span>Route Source</span>
              <strong>{quote.route.source === "esi" ? "Public ESI" : "Local Estimate"}</strong>
            </div>
            <div>
              <PlaneTakeoff size={18} />
              <span>Jumps</span>
              <strong>{quote.route.jumps}</strong>
            </div>
            <div>
              <Boxes size={18} />
              <span>Cargo Class</span>
              <strong>{input.volume > 500_000 ? "Freighter" : "DST / BR"}</strong>
            </div>
          </div>
        </section>

        <QuotePanel
          input={input}
          message={message}
          result={quote}
        />
      </section>

      <section className="detail-band">
        <div>
          <PlaneTakeoff size={22} />
          <span>Jumps</span>
          <strong>{quote.route.jumps}</strong>
        </div>
        <div>
          <ShieldCheck size={22} />
          <span>Route Status</span>
          <strong>{input.routeMode === "insecure" ? "Requires review" : "Clear"}</strong>
        </div>
        <div>
          <Boxes size={22} />
          <span>Ship Class</span>
          <strong>{input.volume > 500_000 ? "Freighter" : "DST / BR"}</strong>
        </div>
        <div>
          <Clock3 size={22} />
          <span>Transit Estimate</span>
          <strong>{Math.max(2, Math.round(quote.route.jumps * 0.8))}h window</strong>
        </div>
      </section>
    </AppShell>
  );
}

export default App;
