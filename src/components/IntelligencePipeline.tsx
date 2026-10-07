import { useId, type CSSProperties } from "react";
import styles from "./IntelligencePipeline.module.css";

const OUTPUTS = [
  ["Policy intelligence", "#e5738a"],
  ["Fuel & feedstock markets", "#6aa6e8"],
  ["Development tracker", "#5fd3ae"],
  ["Company intelligence", "#9fb4c8"],
  ["AI-powered briefings", "#5fd3ae"],
  ["Bioenergy careers", "#d4b46a"],
] as const;
const SOURCES = ["Regulators", "Energy media", "Market data"];

export function IntelligencePipeline({ active, running }: { active: number; running: boolean }) {
  const id = useId();
  const clipId = `${id}-scan`;
  const outputPath = (index: number) =>
    `M290 235 C328 235,330 ${62 + index * 69},365 ${62 + index * 69}`;
  const sourcePath = (index: number) =>
    `M122 ${120 + index * 115} C158 ${120 + index * 115},158 235,190 235`;
  return (
    <div className={styles["pipeline"]} data-running={running}>
      <div className="intelligence-network-top">
        <span>Intelligence pipeline</span>
        <span>{String(active + 1).padStart(2, "0")} / 06</span>
      </div>
      <div className={styles["art"]}>
        <svg
          viewBox="0 0 560 470"
          role="img"
          aria-label={`Regulators, energy media and market data feed AI classification and summary. Active output: ${(OUTPUTS[active] ?? OUTPUTS[0])[0]}.`}
        >
          <text className={styles["heading"]} x={12} y={24}>
            SOURCES
          </text>
          <text className={styles["heading"]} x={240} y={24} textAnchor="middle">
            PROCESSING
          </text>
          <text className={styles["heading"]} x={365} y={24}>
            OUTPUTS
          </text>
          {SOURCES.map((name, i) => (
            <g key={name}>
              <path id={`${id}-source-${i}`} d={sourcePath(i)} className={styles["line"]} />
              <g className={styles["source"]}>
                <rect x={12} y={98 + i * 115} width={110} height={44} rx={3} />
                <text x={67} y={124 + i * 115} textAnchor="middle">
                  {name}
                </text>
              </g>
              {running &&
                [0, 1].map((packet) => (
                  <circle key={packet} r={3} className={styles["packet"]}>
                    <animateMotion
                      dur="2.2s"
                      begin={`${-2.2 + i * 0.4 + packet * 1.1}s`}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#${id}-source-${i}`} />
                    </animateMotion>
                  </circle>
                ))}
            </g>
          ))}
          <g className={styles["processor"]}>
            <rect x={190} y={170} width={100} height={130} rx={3} />
            <defs>
              <clipPath id={clipId}>
                <rect x={190} y={170} width={100} height={130} rx={3} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clipId})`}>
              <rect className={styles["scan"]} x={190} y={170} width={100} height={26} />
            </g>
            <g className={styles["globe"]} transform="translate(240 206)">
              <circle r={11} />
              <path d="M-11 0H11M0-11C5-5 5 5 0 11M0-11C-5-5-5 5 0 11" />
            </g>
            <text x={240} y={244} textAnchor="middle">
              AI classification
            </text>
            <text x={240} y={261} textAnchor="middle">
              and summary
            </text>
            <text className={styles["brand"]} x={240} y={284} textAnchor="middle">
              GBW
            </text>
          </g>
          {OUTPUTS.map(([name, color], i) => (
            <g
              key={name}
              className={styles["output"]}
              data-active={active === i}
              style={{ "--output-color": color } as CSSProperties}
            >
              <path id={`${id}-output-${i}`} d={outputPath(i)} className={styles["outputLine"]} />
              <rect
                className={styles["outputBox"]}
                x={365}
                y={42 + i * 69}
                width={183}
                height={40}
                rx={3}
              />
              <rect className={styles["bar"]} x={365} y={42 + i * 69} width={3} height={40} />
              <text className={styles["number"]} x={380} y={66 + i * 69}>
                {String(i + 1).padStart(2, "0")}
              </text>
              <text className={styles["label"]} x={406} y={66 + i * 69}>
                {name}
              </text>
              {running &&
                active === i &&
                [0, 1].map((packet) => (
                  <circle key={packet} r={3} className={styles["outputPacket"]}>
                    <animateMotion
                      dur="2.2s"
                      begin={`${-2.2 + packet * 1.1}s`}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#${id}-output-${i}`} />
                    </animateMotion>
                  </circle>
                ))}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
