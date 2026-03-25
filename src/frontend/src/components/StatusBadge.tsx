import type { MedicineStatus } from "../lib/helpers";

export function StatusBadge({ status }: { status: MedicineStatus }) {
  if (status === "In Stock") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-bg text-success">
        In Stock
      </span>
    );
  }
  if (status === "Low Stock") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger-bg text-danger">
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning-bg text-warning">
      Expiring Soon
    </span>
  );
}

export function BillStatusBadge({ status }: { status: string }) {
  if (status === "Paid") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-bg text-success">
        Paid
      </span>
    );
  }
  if (status === "Unpaid") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger-bg text-danger">
        Unpaid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning-bg text-warning">
      Partial
    </span>
  );
}
