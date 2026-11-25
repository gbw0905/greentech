import { useEffect, useRef } from "react";

/**
 * TradingView's free embeddable widget. TradingView licenses the (delayed)
 * exchange data for these embeds, on condition that its attribution link stays
 * visible — do not hide or restyle `.tradingview-widget-copyright` away.
 * https://www.tradingview.com/widget-docs/
 */
export function TradingViewWidget({
  widget,
  config,
  height,
  title,
}: {
  /** Script name, e.g. "symbol-overview" → embed-widget-symbol-overview.js */
  widget: string;
  config: Record<string, unknown>;
  height: number;
  title: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const configJson = JSON.stringify(config);

  useEffect(() => {
    const node = host.current;
    // Re-running with the same config (React strict mode) must not detach a
    // script that is still loading, or the embed throws on a null parent.
    if (!node || node.dataset["config"] === configJson) return;
    node.dataset["config"] = configJson;
    node.innerHTML = "";
    // The embed script replaces itself with a 100%-height frame, so the host
    // element carries the fixed height.
    const script = document.createElement("script");
    script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widget}.js`;
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = configJson;
    node.appendChild(script);
  }, [widget, configJson]);

  return (
    <div className="tradingview-widget-container" aria-label={title}>
      <div ref={host} className="tradingview-widget-container__widget" style={{ height }} />
      <div className="tradingview-widget-copyright" style={{ fontSize: 12, marginTop: 6 }}>
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
      <p style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
        Share prices are delayed by the exchanges (typically 15 minutes or more).
      </p>
    </div>
  );
}
