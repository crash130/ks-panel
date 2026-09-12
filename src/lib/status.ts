export const JOB_STATUS_LABEL: Record<string, string> = {
  PRZYJETE: "Przyjęte",
  DIAGNOSTYKA: "Diagnostyka",
  W_NAPRAWIE: "W naprawie",
  OCZEKUJE_NA_CZESCI: "Oczekuje na części",
  GOTOWE_DO_ODBIORU: "Gotowe do odbioru",
  WYDANE: "Wydane",
  ANULOWANE: "Anulowane",
  PO_TERMINIE: "Po terminie",
};

export const JOB_STATUS_TONE: Record<string, string> = {
  PRZYJETE: "bg-slate-100 text-slate-700",
  DIAGNOSTYKA: "bg-sky-100 text-sky-800",
  W_NAPRAWIE: "bg-blue-100 text-blue-800",
  OCZEKUJE_NA_CZESCI: "bg-amber-100 text-amber-800",
  GOTOWE_DO_ODBIORU: "bg-emerald-100 text-emerald-800",
  WYDANE: "bg-slate-100 text-slate-500",
  ANULOWANE: "bg-slate-100 text-slate-400",
  PO_TERMINIE: "bg-rose-100 text-rose-700",
};

export const ROLE_LABEL: Record<string, string> = {
  OWNER: "Właściciel",
  RECEPTION: "Recepcja",
  TECHNICIAN: "Technik",
};

export const OFFER_TYPE_LABEL: Record<string, string> = {
  MULTI: "Wielopozycyjna",
  PRODUCT_CARD: "1 produkt",
};

export function isJobOverdue(job: {
  status: string;
  promisedPickupAt: Date | null;
}): boolean {
  if (!job.promisedPickupAt) return false;
  if (job.status === "WYDANE" || job.status === "ANULOWANE" || job.status === "GOTOWE_DO_ODBIORU") {
    return false;
  }
  const end = new Date(job.promisedPickupAt);
  end.setHours(23, 59, 59, 999);
  return end.getTime() < Date.now();
}

export function displayJobStatus(job: {
  status: string;
  promisedPickupAt: Date | null;
}): string {
  if (isJobOverdue(job) && job.status !== "GOTOWE_DO_ODBIORU") return "PO_TERMINIE";
  return job.status;
}
