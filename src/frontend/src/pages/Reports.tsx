import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Printer } from "lucide-react";
import { useState } from "react";
import { Department } from "../backend.d";
import { useAllDistributions } from "../hooks/useQueries";
import { formatTimestamp } from "../lib/helpers";

const DEPTS = [
  { label: "All Departments", value: "all" },
  { label: "OT", value: Department.OT },
  { label: "Ward", value: Department.Ward },
  { label: "ICU", value: Department.ICU },
  { label: "Emergency", value: Department.Emergency },
  { label: "OPD", value: Department.OPD },
];

const DEPT_COLORS: Record<string, string> = {
  OT: "bg-purple-100 text-purple-700",
  Ward: "bg-blue-100 text-blue-700",
  ICU: "bg-red-100 text-red-700",
  Emergency: "bg-orange-100 text-orange-700",
  OPD: "bg-green-100 text-green-700",
};

export function Reports() {
  const { data: allDist, isLoading } = useAllDistributions();
  const [filter, setFilter] = useState("all");

  const printDate = new Date().toLocaleDateString();
  const filterLabel =
    DEPTS.find((d) => d.value === filter)?.label ?? "All Departments";

  const filtered =
    filter === "all"
      ? (allDist ?? [])
      : (allDist ?? []).filter((d) => d.department === filter);

  const deptSummary = [
    Department.OT,
    Department.Ward,
    Department.ICU,
    Department.Emergency,
    Department.OPD,
  ].map((d) => {
    const dists = (allDist ?? []).filter((x) => x.department === d);
    return {
      dept: d,
      count: dists.length,
      totalUnits: dists.reduce((s, x) => s + Number(x.quantity), 0),
    };
  });

  return (
    <div className="space-y-6" data-ocid="reports.page">
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reports</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Distribution analytics across all departments
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.print()}
          data-ocid="reports.print.button"
          className="border-primary/30 text-primary hover:bg-primary/10"
        >
          <Printer size={16} className="mr-2" /> Print Report
        </Button>
      </div>

      {/* Print-only header */}
      <div className="print-only">
        <h1 className="text-xl font-bold">Jahan Health Care Nursing Home</h1>
        <h2 className="text-base font-semibold mt-1">
          Distribution Report — {filterLabel}
        </h2>
        <p className="text-sm mt-0.5">Printed on: {printDate}</p>
        <hr className="mt-2 mb-4" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 no-print">
        {deptSummary.map((ds) => (
          <Card key={ds.dept} className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${DEPT_COLORS[ds.dept]}`}
                >
                  {ds.dept}
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">
                    {ds.totalUnits}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ds.count} distributions
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 size={16} className="text-primary no-print" />
              Distribution Log
            </CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger
                className="w-48 h-8 text-xs no-print"
                data-ocid="reports.dept_filter.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPTS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table data-ocid="reports.distributions.table">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide w-10">
                    S/N
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Department
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Medicine
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-right">
                    Qty
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Issued By
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Note
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    <TableRow key="sk1">
                      <TableCell colSpan={7}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk2">
                      <TableCell colSpan={7}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk3">
                      <TableCell colSpan={7}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk4">
                      <TableCell colSpan={7}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk5">
                      <TableCell colSpan={7}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  </>
                ) : filtered.length > 0 ? (
                  filtered.map((d, idx) => (
                    <TableRow
                      key={d.id.toString()}
                      className="hover:bg-muted/30"
                      data-ocid={`reports.item.${idx + 1}`}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatTimestamp(d.issuedDate)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${DEPT_COLORS[d.department]}`}
                        >
                          {d.department}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-semibold">
                        {d.medicineName}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-primary">
                        {Number(d.quantity)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {d.issuedBy}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                        {d.note || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground text-sm"
                      data-ocid="reports.distributions.empty_state"
                    >
                      No distribution records found.
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
