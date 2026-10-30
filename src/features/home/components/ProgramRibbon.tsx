import programs from "./program-logos.json";
import "./ProgramRibbon.css";

/** Program marks are identification only; they do not imply endorsement. */
export function ProgramRibbon() {
  return (
    <section id="programs" className="program-ribbon" aria-label="Global programs and schemes">
      <div className="program-ribbon-inner">
        <h2>Programs &amp; schemes</h2>
        <div
          className="program-ribbon-window"
          tabIndex={0}
          aria-label="Program logos. Focus to pause animation."
        >
          <div className="program-ribbon-track">
            {[0, 1].map((copy) => (
              <div
                className="program-ribbon-group"
                key={copy}
                aria-hidden={copy === 1 || undefined}
              >
                {programs.map((program) => (
                  <span className="program-ribbon-logo" key={program.src} title={program.name}>
                    <img
                      src={program.src}
                      alt={copy === 0 ? program.name : ""}
                      loading="lazy"
                      draggable={false}
                      width={150}
                      height={64}
                    />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
