export const currency = (value: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value);

export const compactCurrency = (value: number) =>
  "R" +
  new Intl.NumberFormat("en-ZA", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export const number = (value: number) => new Intl.NumberFormat("en-ZA").format(value);

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
