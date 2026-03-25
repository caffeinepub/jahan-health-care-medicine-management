import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Edit2, Loader2, Plus, Printer, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Medicine } from "../backend.d";
import { StatusBadge } from "../components/StatusBadge";
import {
  useAddMedicine,
  useAllMedicines,
  useAllSuppliers,
} from "../hooks/useQueries";
import { formatDate, formatPKR, getMedicineStatus } from "../lib/helpers";

const EMPTY_FORM = {
  name: "",
  batchNo: "",
  expiryDate: "",
  manufacturer: "",
  supplierID: "",
  unitRate: "",
  quantity: "",
  lowStockThreshold: "10",
};

export function MedicineStock() {
  const { data: medicines, isLoading } = useAllMedicines();
  const { data: suppliers } = useAllSuppliers();
  const addMedicine = useAddMedicine();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const printDate = new Date().toLocaleDateString();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Medicine name is required";
    if (!form.batchNo.trim()) e.batchNo = "Batch number is required";
    if (!form.expiryDate) e.expiryDate = "Expiry date is required";
    if (!form.manufacturer.trim()) e.manufacturer = "Manufacturer is required";
    if (!form.supplierID) e.supplierID = "Please select a supplier";
    if (
      !form.unitRate ||
      Number.isNaN(Number(form.unitRate)) ||
      Number(form.unitRate) <= 0
    )
      e.unitRate = "Valid unit rate required";
    if (
      !form.quantity ||
      Number.isNaN(Number(form.quantity)) ||
      Number(form.quantity) < 0
    )
      e.quantity = "Valid quantity required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const med: Medicine = {
      id: 0n,
      name: form.name.trim(),
      batchNo: form.batchNo.trim(),
      expiryDate: form.expiryDate,
      manufacturer: form.manufacturer.trim(),
      supplierID: BigInt(form.supplierID),
      unitRate: Number(form.unitRate),
      quantity: BigInt(form.quantity),
      lowStockThreshold: BigInt(form.lowStockThreshold || "10"),
    };
    try {
      await addMedicine.mutateAsync(med);
      toast.success("Medicine added successfully");
      setOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch {
      toast.error("Failed to add medicine");
    }
  };

  const filtered =
    medicines?.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const f = (field: string, val: string) =>
    setForm((p) => ({ ...p, [field]: val }));

  return (
    <div className="space-y-5" data-ocid="stock.page">
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Medicine Stock</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage inventory, batch numbers, and expiry dates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
            data-ocid="stock.print.button"
            className="border-primary/30 text-primary hover:bg-primary/10"
          >
            <Printer size={16} className="mr-2" /> Print Report
          </Button>
          <Button
            onClick={() => {
              setForm(EMPTY_FORM);
              setErrors({});
              setOpen(true);
            }}
            data-ocid="stock.add_medicine.button"
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus size={16} className="mr-2" /> Add Medicine
          </Button>
        </div>
      </div>

      {/* Print-only header */}
      <div className="print-only">
        <h1 className="text-xl font-bold">Jahan Health Care Nursing Home</h1>
        <h2 className="text-base font-semibold mt-1">Medicine Stock Report</h2>
        <p className="text-sm mt-0.5">Printed on: {printDate}</p>
        <hr className="mt-2 mb-4" />
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3 no-print">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                data-ocid="stock.search_input"
                placeholder="Search medicines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <CardTitle className="text-sm text-muted-foreground font-medium ml-auto">
              {filtered.length} items
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table data-ocid="stock.table">
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
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Supplier
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
                  <TableHead className="text-xs font-semibold uppercase tracking-wide w-16 no-print">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    <TableRow key="sk1">
                      <TableCell colSpan={11}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk2">
                      <TableCell colSpan={11}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk3">
                      <TableCell colSpan={11}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk4">
                      <TableCell colSpan={11}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk5">
                      <TableCell colSpan={11}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk6">
                      <TableCell colSpan={11}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  </>
                ) : filtered.length > 0 ? (
                  filtered.map((med, idx) => {
                    const status = getMedicineStatus(med);
                    const supplier = suppliers?.find(
                      (s) => s.id === med.supplierID,
                    );
                    return (
                      <TableRow
                        key={med.id.toString()}
                        className="hover:bg-muted/30"
                        data-ocid={`stock.item.${idx + 1}`}
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-foreground">
                          {med.name}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {med.batchNo}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(med.expiryDate)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {med.manufacturer}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {supplier?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium">
                          {Number(med.quantity)}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {formatPKR(med.unitRate)}
                        </TableCell>
                        <TableCell className="text-xs text-right font-semibold">
                          {formatPKR(Number(med.quantity) * med.unitRate)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={status} />
                        </TableCell>
                        <TableCell className="no-print">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              data-ocid={`stock.edit_button.${idx + 1}`}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-danger-bg text-muted-foreground hover:text-danger transition-colors"
                              data-ocid={`stock.delete_button.${idx + 1}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center py-12 text-muted-foreground text-sm"
                      data-ocid="stock.empty_state"
                    >
                      {search
                        ? "No medicines found matching your search."
                        : "No medicines added yet. Click 'Add Medicine' to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Medicine Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="stock.add_medicine.dialog"
        >
          <DialogHeader>
            <DialogTitle>Add New Medicine</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-semibold">Medicine Name *</Label>
              <Input
                data-ocid="stock.name.input"
                value={form.name}
                onChange={(e) => f("name", e.target.value)}
                placeholder="e.g. Paracetamol 500mg"
              />
              {errors.name && (
                <p
                  className="text-xs text-danger"
                  data-ocid="stock.name.error_state"
                >
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Batch No. *</Label>
              <Input
                data-ocid="stock.batchNo.input"
                value={form.batchNo}
                onChange={(e) => f("batchNo", e.target.value)}
                placeholder="e.g. BT-2024-001"
              />
              {errors.batchNo && (
                <p
                  className="text-xs text-danger"
                  data-ocid="stock.batchNo.error_state"
                >
                  {errors.batchNo}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Expiry Date *</Label>
              <Input
                data-ocid="stock.expiryDate.input"
                type="date"
                value={form.expiryDate}
                onChange={(e) => f("expiryDate", e.target.value)}
              />
              {errors.expiryDate && (
                <p
                  className="text-xs text-danger"
                  data-ocid="stock.expiryDate.error_state"
                >
                  {errors.expiryDate}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Manufacturer *</Label>
              <Input
                data-ocid="stock.manufacturer.input"
                value={form.manufacturer}
                onChange={(e) => f("manufacturer", e.target.value)}
                placeholder="e.g. GSK"
              />
              {errors.manufacturer && (
                <p className="text-xs text-danger">{errors.manufacturer}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Supplier *</Label>
              <Select
                value={form.supplierID}
                onValueChange={(v) => f("supplierID", v)}
              >
                <SelectTrigger data-ocid="stock.supplier.select">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((s) => (
                    <SelectItem key={s.id.toString()} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplierID && (
                <p className="text-xs text-danger">{errors.supplierID}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Unit Rate (PKR) *</Label>
              <Input
                data-ocid="stock.unitRate.input"
                type="number"
                min="0"
                value={form.unitRate}
                onChange={(e) => f("unitRate", e.target.value)}
                placeholder="0"
              />
              {errors.unitRate && (
                <p className="text-xs text-danger">{errors.unitRate}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Quantity *</Label>
              <Input
                data-ocid="stock.quantity.input"
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => f("quantity", e.target.value)}
                placeholder="0"
              />
              {errors.quantity && (
                <p className="text-xs text-danger">{errors.quantity}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                Low Stock Threshold
              </Label>
              <Input
                data-ocid="stock.threshold.input"
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={(e) => f("lowStockThreshold", e.target.value)}
                placeholder="10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="stock.add_medicine.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={addMedicine.isPending}
              data-ocid="stock.add_medicine.submit_button"
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {addMedicine.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              {addMedicine.isPending ? "Adding..." : "Add Medicine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
