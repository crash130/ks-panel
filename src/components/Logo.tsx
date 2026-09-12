export const LOGO_LOCKUP_SRC = "/brand/logo-mono-a.png";
export const LOGO_MARK_SRC = "/brand/logo-mono-b.png";

const SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "h-8",
  md: "h-10",
  lg: "h-12",
};

/** Real PNG lockup (KS emblem + stacked komputer / serwis). Do not redraw as SVG. */
export function Logo({
  size = "md",
  onDark = false,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
  className?: string;
}) {
  return (
    <img
      src={LOGO_LOCKUP_SRC}
      alt="KS komputer serwis"
      className={`${SIZE[size]} w-auto max-w-[240px] object-contain object-left ${onDark ? "brightness-0 invert" : ""} ${className}`.trim()}
    />
  );
}

/** Real PNG emblem only (favicon / small mark). */
export function KsMark({
  className = "h-9 w-auto",
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <img
      src={LOGO_MARK_SRC}
      alt=""
      className={`${className} object-contain ${onDark ? "brightness-0 invert" : ""}`.trim()}
    />
  );
}
