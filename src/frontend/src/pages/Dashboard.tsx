import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  TrendingDown,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useAllMedicines, useDashboardStats } from "../hooks/useQueries";
import { formatDate, formatPKR, getMedicineStatus } from "../lib/helpers";

const KPI_DEFS = [
  {
    key: "total",
    title: "Total Medicines",
    color: "bg-primary/10",
    badge: null as null | "red" | "amber",
  },
  {
    key: "low",
    title: "Low Stock Items",
    color: "bg-danger-bg",
    badge: "red" as const,
  },
  {
    key: "expiring",
    title: "Expiring Soon",
    color: "bg-warning-bg",
    badge: "amber" as const,
  },
  {
    key: "value",
    title: "Total Stock Value",
    color: "bg-success-bg",
    badge: null,
  },
];

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: medicines, isLoading: medsLoading } = useAllMedicines();

  const kpiValues: Record<string, string> = {
    total: stats ? Number(stats.totalMedicineCount).toString() : "—",
    low: stats ? Number(stats.lowStockCount).toString() : "—",
    expiring: stats ? Number(stats.expiringSoonCount).toString() : "—",
    value: stats ? formatPKR(stats.totalStockValue) : "—",
  };

  const kpiIcons: Record<string, React.ReactNode> = {
    total: <Package size={20} className="text-primary" />,
    low: <TrendingDown size={20} className="text-danger" />,
    expiring: <Clock size={20} className="text-warning" />,
    value: <DollarSign size={20} className="text-success" />,
  };

  const showBadge = (key: string) => {
    if (key === "low") return stats && Number(stats.lowStockCount) > 0;
    if (key === "expiring") return stats && Number(stats.expiringSoonCount) > 0;
    return false;
  };

  return (
    <div className="space-y-6" data-ocid="dashboard.page">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of medicine inventory and stock status
        </p>
      </div>

      {/* KPI Cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        data-ocid="dashboard.kpi.section"
      >
        {KPI_DEFS.map((kpi) => (
          <Card key={kpi.key} className="shadow-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {kpi.title}
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {kpiValues[kpi.key]}
                    </p>
                  )}
                </div>
                <div
                  className={`w-10 h-10 rounded-lg ${kpi.color} flex items-center justify-center flex-shrink-0 relative`}
                >
                  {kpiIcons[kpi.key]}
                  {showBadge(kpi.key) && kpi.badge === "red" && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                      !
                    </span>
                  )}
                  {showBadge(kpi.key) && kpi.badge === "amber" && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                      !
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert banners */}
      {stats && Number(stats.lowStockCount) > 0 && (
        <div className="flex items-center gap-3 bg-danger-bg border border-danger/20 rounded-lg px-4 py-3">
          <AlertTriangle size={16} className="text-danger flex-shrink-0" />
          <p className="text-sm text-danger font-medium">
            {Number(stats.lowStockCount)} medicine(s) are below the low stock
            threshold. Please reorder soon.
          </p>
        </div>
      )}
      {stats && Number(stats.expiringSoonCount) > 0 && (
        <div className="flex items-center gap-3 bg-warning-bg border border-warning/20 rounded-lg px-4 py-3">
          <Clock size={16} className="text-warning flex-shrink-0" />
          <p className="text-sm text-warning font-medium">
            {Number(stats.expiringSoonCount)} medicine(s) are expiring within 30
            days.
          </p>
        </div>
      )}

      {/* Medicine Inventory Table */}
      <Card className="shadow-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Medicine Stock Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table data-ocid="dashboard.medicines.table">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide w-10">
                    S/N
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Medicine Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Batch No.
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Expiry Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Manufacturer
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-right">
                    Qty
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-right">
                    Unit Rate
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-right">
                    Total Value
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medsLoading ? (
                  <>
                    <TableRow key="sk1">
                      <TableCell colSpan={9}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk2">
                      <TableCell colSpan={9}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk3">
                      <TableCell colSpan={9}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk4">
                      <TableCell colSpan={9}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk5">
                      <TableCell colSpan={9}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  </>
                ) : medicines && medicines.length > 0 ? (
                  medicines.map((med, idx) => {
                    const status = getMedicineStatus(med);
                    const totalVal = Number(med.quantity) * med.unitRate;
                    return (
                      <TableRow
                        key={med.id.toString()}
                        className="hover:bg-muted/30"
                        data-ocid={`dashboard.medicines.item.${idx + 1}`}
                      >
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-foreground">
                          {med.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {med.batchNo}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(med.expiryDate)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {med.manufacturer}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium">
                          {Number(med.quantity)}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {formatPKR(med.unitRate)}
                        </TableCell>
                        <TableCell className="text-xs text-right font-semibold">
                          {formatPKR(totalVal)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={status} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-10 text-muted-foreground text-sm"
                      data-ocid="dashboard.medicines.empty_state"
                    >
                      No medicines in stock. Add medicines from the Stock
                      Management page.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
