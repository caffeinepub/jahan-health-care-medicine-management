import type { Medicine } from "../backend.d";

export type MedicineStatus = "In Stock" | "Low Stock" | "Expiring Soon";

export function getMedicineStatus(medicine: Medicine): MedicineStatus {
  if (medicine.quantity <= medicine.lowStockThreshold) return "Low Stock";
  const expiry = new Date(medicine.expiryDate);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  if (expiry <= thirtyDaysFromNow) return "Expiring Soon";
  return "In Stock";
}

export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTimestamp(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function nowNs(): bigint {
  return BigInt(Date.now()) * 1_000_000n;
}

export type PageKey =
  | "dashboard"
  | "stock"
  | "suppliers"
  | "bills"
  | "dist-OT"
  | "dist-Ward"
  | "dist-ICU"
  | "dist-Emergency"
  | "dist-OPD"
  | "reports";
