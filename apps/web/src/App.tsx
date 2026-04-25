import { useState, useTransition } from "react";
import {
  ArrowRight,
  Boxes,
  Clock3,
  Crosshair,
  DatabaseZap,
  MapPinned,
  PlaneTakeoff,
  ShieldCheck,
} from "lucide-react";

import { AppShell } from "./components/AppShell";
import { DataPanel } from "./components/DataPanel";
import { QuotePanel } from "./components/QuotePanel";
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

function App() {
  const [input, setInput] = useState<QuoteInput>(initialInput);
  const [quote, setQuote] = useState<QuoteResult>(() => calculateQuote(initialInput, initialRoute));
  const [message, setMessage] = useState("Local estimate ready. Sync public ESI when the API is running.");
  const [isPending, startTransition] = useTransition();

  const updateInput = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => {
    const nextInput = { ...input, [key]: value };
    setInput(nextInput);
    setQuote(calculateQuote(nextInput, fallbackRoute(nextInput)));
    setMessage("Demo pricing refreshed locally. Use Estimate to request a public ESI route.");
  };

  const calculateRun = () => {
    startTransition(async () => {
      try {
        const route = await fetchEsiRoute(input.origin, input.destination, input.routeMode);
        setQuote(calculateQuote(input, route));
        setMessage("Public ESI route synced. Pricing is still a demo model for beta shaping.");
      } catch {
        const route = fallbackRoute(input);
        setQuote(calculateQuote(input, route));
        setMessage("Public ESI is unavailable or could not resolve the systems. Demo route is active.");
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
        </DataPanel>

        <DataPanel className="route-panel" eyebrow="Freight Calculator" title="Route Overview">
          <div className="route-visual" id="route">
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
            <div className="system-node active">
              <Crosshair size={18} />
              <strong>{input.origin}</strong>
              <span>0.9 Origin</span>
            </div>
            <div className="jump-line">
              {["Perimeter", "Soba", "Niarja", "Ashab", "Madirmilire"].map((name, index) => (
                <span className={index > 2 ? "low" : ""} key={name}>
                  <i />
                  <b>{name}</b>
                </span>
              ))}
            </div>
            <div className="system-node">
              <MapPinned size={18} />
              <strong>{input.destination}</strong>
              <span>0.5 Destination</span>
            </div>
          </div>

          <div className="telemetry-grid">
            <div>
              <DatabaseZap size={18} />
              <span>Route Source</span>
              <strong>{quote.route.source === "esi" ? "Public ESI" : "Local Demo"}</strong>
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
        </DataPanel>

        <QuotePanel
          input={input}
          loading={isPending}
          message={message}
          onCalculate={calculateRun}
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
