import { ArrowRight, History, Sparkles } from "lucide-react";
import { usePremium } from "@/features/premium/hooks/usePremium";

type Product = "workspace" | "credit" | "optimizer";

const products = {
  workspace: {
    label: "CI Workspace",
    title: "Model a fuel pathway.",
  },
  credit: {
    label: "Credit & RIN",
    title: "Explore a fuel's potential value.",
  },
  optimizer: {
    label: "Optimizer",
    title: "Find a better pathway.",
  },
} as const;

export function CalculatorHeader({
  product,
  historyOpen,
  onHistory,
}: {
  product: Product;
  historyOpen: boolean;
  onHistory: () => void;
}) {
  const access = usePremium();
  const current = products[product];
  return (
    <header className={`calculator-header calculator-header--${product}`}>
      <div className="calculator-heading-row">
        <div className="calculator-heading-copy">
          <h1>{current.title}</h1>
        </div>
        <div className="calculator-heading-actions">
          {!access.loading && !access.premium && (
            <a
              className="calculator-upgrade-link"
              href={access.signedIn ? "/pricing" : "/auth?next=%2Fpricing"}
            >
              <Sparkles size={17} aria-hidden="true" /> Go for Pro{" "}
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          )}
          <button
            className="calculator-history-toggle"
            type="button"
            aria-expanded={historyOpen}
            onClick={onHistory}
          >
            <History size={17} aria-hidden="true" /> History
          </button>
        </div>
      </div>
    </header>
  );
}
