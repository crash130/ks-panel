import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
