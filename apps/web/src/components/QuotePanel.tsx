import { CircleDollarSign, Loader2, PackageCheck, Route, ScanLine } from "lucide-react";

import type { QuoteInput, QuoteResult } from "../types";
import { formatIsk, formatM3 } from "../lib/format";
import { Button } from "./ui/Button";
import { StatusBadge } from "./ui/StatusBadge";

type QuotePanelProps = {
  input: QuoteInput;
  result: QuoteResult;
  loading: boolean;
  message: string;
  onCalculate: () => void;
};

export function QuotePanel({ input, result, loading, message, onCalculate }: QuotePanelProps) {
  return (
    <aside className="quote-panel" id="pricing">
      <div className="quote-head">
        <strong>Quote Summary</strong>
        <StatusBadge tone={result.route.source === "esi" ? "green" : "amber"}>
          {result.route.source === "esi" ? "ESI synced" : "Demo route"}
        </StatusBadge>
      </div>

      <div className="estimate-block">
        <span>Total Price</span>
        <strong>{formatIsk(result.estimate)}</strong>
        <p>{message}</p>
      </div>

      <div className="quote-lines">
        <div>
          <span>
            <Route size={16} />
            Route
          </span>
          <strong>{result.route.jumps} jumps</strong>
        </div>
        <div>
          <span>
            <PackageCheck size={16} />
            Volume
          </span>
          <strong>{formatM3(input.volume)}</strong>
        </div>
        <div>
          <span>
            <CircleDollarSign size={16} />
            Collateral
          </span>
          <strong>{formatIsk(input.collateral)}</strong>
        </div>
      </div>

      <div className="fee-grid">
        <span>Base run</span>
        <strong>{formatIsk(result.base)}</strong>
        <span>Volume fee</span>
        <strong>{formatIsk(result.volumeFee)}</strong>
        <span>Collateral band</span>
        <strong>{formatIsk(result.collateralFee)}</strong>
        <span>Route modifier</span>
        <strong>{formatIsk(result.riskFee)}</strong>
      </div>

      <Button
        className="estimate-button"
        disabled={loading}
        icon={loading ? <Loader2 className="spin" size={18} /> : <ScanLine size={18} />}
        onClick={onCalculate}
      >
        {loading ? "Calculating" : "Calculate Run"}
      </Button>
    </aside>
  );
}
