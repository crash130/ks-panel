"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateOfferButtons({
  type,
  label,
  preset,
  ghost,
}: {
  type: "MULTI" | "PRODUCT_CARD";
  label: string;
  preset?: string;
  ghost?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function create() {
    setPending(true);
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, preset }),
    });
    const data = await res.json();
    setPending(false);
    if (res.ok) router.push(`/ofertomat/${data.id}`);
  }

  return (
    <button
      type="button"
      onClick={create}
      disabled={pending}
      className={`mt-4 ${ghost ? "text-sm font-bold text-primary" : "ks-btn ks-btn-primary"}`}
    >
      {pending ? "Tworzenie…" : `${label} →`}
    </button>
  );
}
