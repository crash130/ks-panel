export const BRAND = {
  productName: "KS",
  wordmarkTop: "komputer",
  wordmarkBottom: "serwis",
  legalName: "Komputer Serwis",
  claim: "Profesjonalny Serwis IT",
  domain: "komputerserwis.pl",
  shopUrl: "https://komputerserwis.pl",
  addressLine1: "ul. Mickiewicza 6",
  addressLine2: "64-761 Krzyż Wielkopolski",
  phone: "505 825 047",
  phoneTel: "+48505825047",
  email: "sklep@komputerserwis.info",
  hours: "codziennie 11:00–17:00",
  reach: "+30 km",
  reachNote: "lokalnie +30 km",
} as const;

export const COLORS = {
  primary: "#0B6EFD",
  navy: "#0A1F44",
  accent: "#00C2FF",
  cloud: "#F2F6FB",
} as const;

export function formatPhoneDisplay(phone = BRAND.phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}
