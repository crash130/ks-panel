import { BRAND } from "@/lib/brand";

export function KsMark({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 40" className={className} aria-hidden="true" role="img">
      <title>KS</title>
      <path
        fill="#0A1F44"
        d="M2 2h11v36H2zM16 2l18 18L16 38h13l18-18L29 2H16z"
      />
      <path
        fill="#0A1F44"
        d="M50 2c-9 0-16 4.2-16 12.2 0 6.4 5.2 9.4 12.4 11.2l5.2 1.4c3.6.9 5.6 2.2 5.6 4.8 0 3.1-3.1 5-8.2 5-4.8 0-8.6-1.6-11.2-4.2L30.4 39c4.2 4.2 11 6.2 18.4 6.2C60.4 45.2 70 39.8 70 30.4c0-6.6-5-10-13.2-12.2l-5.4-1.5c-3.4-.8-5-2.1-5-4.2 0-2.6 2.5-4.3 7-4.3 4.2 0 7.8 1.3 10.2 3.4L70 5.2C65.6 3 58.4 2 50 2z"
      />
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const mark = size === "lg" ? "h-12 w-auto" : size === "sm" ? "h-7 w-auto" : "h-9 w-auto";
  const text = size === "lg" ? "text-[18px]" : "text-[15px]";
  return (
    <div className="flex items-center gap-2.5">
      <KsMark className={mark} />
      <div className={`leading-[0.95] font-extrabold text-navy ${text}`}>
        <div>{BRAND.wordmarkTop}</div>
        <div>{BRAND.wordmarkBottom}</div>
      </div>
    </div>
  );
}
