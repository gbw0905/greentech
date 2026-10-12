import { Building2, FileCheck2, Milestone } from "lucide-react";

export function CountryTrackingStrip({
  mandates,
  targets,
  sources,
}: {
  mandates: number;
  targets: number;
  sources: number;
}) {
  return (
    <section className="stats" aria-label="Country tracking summary">
      {[
        {
          label: "Tracked mandates",
          value: mandates,
          detail: mandates === 1 ? "Active obligation" : "Active obligations",
          icon: FileCheck2,
        },
        { label: "Policy targets", value: targets, detail: "Published markers", icon: Milestone },
        {
          label: "Official sources",
          value: sources,
          detail: "Government records",
          icon: Building2,
        },
      ].map(({ label, value, detail, icon: Icon }) => (
        <div className="stat" key={label}>
          <div>
            <span className="l">{label}</span>
            <p className="n">{value}</p>
            <span className="d">{detail}</span>
          </div>
          <span className="ic">
            <Icon />
          </span>
        </div>
      ))}
    </section>
  );
}
