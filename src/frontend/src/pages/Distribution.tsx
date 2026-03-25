import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Distribution as DistType } from "../backend.d";
import { Department } from "../backend.d";
import {
  useAddDistribution,
  useAllMedicines,
  useDistributionsByDept,
} from "../hooks/useQueries";
import { formatTimestamp, nowNs } from "../lib/helpers";
import type { PageKey } from "../lib/helpers";

const DEPT_MAP: Record<string, Department> = {
  "dist-OT": Department.OT,
  "dist-Ward": Department.Ward,
  "dist-ICU": Department.ICU,
  "dist-Emergency": Department.Emergency,
  "dist-OPD": Department.OPD,
};

const DEPT_LABELS: Record<string, string> = {
  "dist-OT": "Operating Theatre (OT)",
  "dist-Ward": "Ward",
  "dist-ICU": "Intensive Care Unit (ICU)",
  "dist-Emergency": "Emergency",
  "dist-OPD": "Outpatient Department (OPD)",
};

const DEPT_COLORS: Record<string, string> = {
  "dist-OT": "bg-purple-100 text-purple-700",
  "dist-Ward": "bg-blue-100 text-blue-700",
  "dist-ICU": "bg-red-100 text-red-700",
  "dist-Emergency": "bg-orange-100 text-orange-700",
  "dist-OPD": "bg-green-100 text-green-700",
};

interface DistributionProps {
  pageKey: PageKey;
}

export function Distribution({ pageKey }: DistributionProps) {
  const dept = DEPT_MAP[pageKey];
  const { data: distributions, isLoading } = useDistributionsByDept(dept);
  const { data: medicines } = useAllMedicines();
  const addDistribution = useAddDistribution();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    medicineID: "",
    quantity: "",
    issuedBy: "",
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const f = (field: string, val: string) =>
    setForm((p) => ({ ...p, [field]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.medicineID) e.medicineID = "Select a medicine";
    if (
      !form.quantity ||
      Number.isNaN(Number(form.quantity)) ||
      Number(form.quantity) <= 0
    )
      e.quantity = "Valid quantity required";
    if (!form.issuedBy.trim()) e.issuedBy = "Issued by is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const med = medicines?.find((m) => m.id.toString() === form.medicineID);
    if (!med) return;
    const dist: DistType = {
      id: 0n,
      medicineID: med.id,
      medicineName: med.name,
      quantity: BigInt(form.quantity),
      department: dept,
      issuedDate: nowNs(),
      issuedBy: form.issuedBy.trim(),
      note: form.note.trim(),
    };
    try {
      await addDistribution.mutateAsync(dist);
      toast.success(`Medicine issued to ${DEPT_LABELS[pageKey]}`);
      setOpen(false);
      setForm({ medicineID: "", quantity: "", issuedBy: "", note: "" });
      setErrors({});
    } catch {
      toast.error("Failed to issue medicine");
    }
  };

  return (
    <div className="space-y-5" data-ocid="distribution.page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${DEPT_COLORS[pageKey]}`}
              >
                {dept}
              </span>
              <h2 className="text-2xl font-bold text-foreground">
                {DEPT_LABELS[pageKey]}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Medicine distribution records for this department
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setForm({ medicineID: "", quantity: "", issuedBy: "", note: "" });
            setErrors({});
            setOpen(true);
          }}
          data-ocid="distribution.issue_medicine.button"
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Send size={16} className="mr-2" /> Issue Medicine
        </Button>
      </div>

      {distributions && distributions.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                Total Distributions
              </p>
              <p className="text-2xl font-bold text-primary mt-1">
                {distributions.length}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                Total Units Issued
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {distributions.reduce((s, d) => s + Number(d.quantity), 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <p className="text-sm text-muted-foreground">
            {distributions?.length ?? 0} distribution records
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table data-ocid="distribution.table">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide w-10">
                    S/N
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Medicine Name
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
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk2">
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk3">
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk4">
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  </>
                ) : distributions && distributions.length > 0 ? (
                  distributions.map((d, idx) => (
                    <TableRow
                      key={d.id.toString()}
                      className="hover:bg-muted/30"
                      data-ocid={`distribution.item.${idx + 1}`}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatTimestamp(d.issuedDate)}
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
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {d.note || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground text-sm"
                      data-ocid="distribution.empty_state"
                    >
                      No distributions recorded for {DEPT_LABELS[pageKey]} yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Issue Medicine Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-md"
          data-ocid="distribution.issue_medicine.dialog"
        >
          <DialogHeader>
            <DialogTitle>Issue Medicine to {dept}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Medicine *</Label>
              <Select
                value={form.medicineID}
                onValueChange={(v) => f("medicineID", v)}
              >
                <SelectTrigger data-ocid="distribution.medicine.select">
                  <SelectValue placeholder="Select medicine" />
                </SelectTrigger>
                <SelectContent>
                  {medicines?.map((m) => (
                    <SelectItem key={m.id.toString()} value={m.id.toString()}>
                      {m.name} (Qty: {Number(m.quantity)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.medicineID && (
                <p
                  className="text-xs text-danger"
                  data-ocid="distribution.medicine.error_state"
                >
                  {errors.medicineID}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Quantity *</Label>
              <Input
                data-ocid="distribution.quantity.input"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => f("quantity", e.target.value)}
                placeholder="Enter quantity to issue"
              />
              {errors.quantity && (
                <p className="text-xs text-danger">{errors.quantity}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Issued By *</Label>
              <Input
                data-ocid="distribution.issuedBy.input"
                value={form.issuedBy}
                onChange={(e) => f("issuedBy", e.target.value)}
                placeholder="Staff name or ID"
              />
              {errors.issuedBy && (
                <p className="text-xs text-danger">{errors.issuedBy}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Note</Label>
              <Textarea
                data-ocid="distribution.note.textarea"
                value={form.note}
                onChange={(e) => f("note", e.target.value)}
                placeholder="Optional note..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="distribution.issue_medicine.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={addDistribution.isPending}
              data-ocid="distribution.issue_medicine.submit_button"
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {addDistribution.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              {addDistribution.isPending ? "Issuing..." : "Issue Medicine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
