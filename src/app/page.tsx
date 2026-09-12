import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const count = await prisma.user.count();
  if (count === 0) redirect("/setup");
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect("/pulpit");
}
