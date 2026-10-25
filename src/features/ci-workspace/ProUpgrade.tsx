import { ArrowRight, LockKeyhole } from "lucide-react";
import { usePremium } from "@/features/premium/hooks/usePremium";

export function ProUpgrade({ title, detail }: { title: string; detail: string }) {
  const { signedIn } = usePremium();
  return (
    <div className="calculator-pro-upgrade">
      <span className="calculator-pro-icon">
        <LockKeyhole size={21} aria-hidden="true" />
      </span>
      <div>
        <span className="calculator-pro-label">CIVanta Pro</span>
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
      <a href={signedIn ? "/pricing" : "/auth?next=%2Fpricing"}>
        Go for Pro <ArrowRight size={17} aria-hidden="true" />
      </a>
    </div>
  );
}
