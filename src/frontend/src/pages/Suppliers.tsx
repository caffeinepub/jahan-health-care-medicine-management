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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Edit2, Loader2, Plus, Printer, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Supplier } from "../backend.d";
import { useAddSupplier, useAllSuppliers } from "../hooks/useQueries";

const EMPTY = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
};

export function Suppliers() {
  const { data: suppliers, isLoading } = useAllSuppliers();
  const addSupplier = useAddSupplier();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const f = (field: string, val: string) =>
    setForm((p) => ({ ...p, [field]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Supplier name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.contactPerson.trim())
      e.contactPerson = "Contact person is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const sup: Supplier = {
      id: 0n,
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    };
    try {
      await addSupplier.mutateAsync(sup);
      toast.success("Supplier added successfully");
      setOpen(false);
      setForm(EMPTY);
      setErrors({});
    } catch {
      toast.error("Failed to add supplier");
    }
  };

  const printDate = new Date().toLocaleDateString();

  return (
    <div className="space-y-5" data-ocid="suppliers.page">
      {/* Print-only header */}
      <div className="print-only hidden">
        <h1 className="text-xl font-bold text-center">
          Jahan Health Care Nursing Home
        </h1>
        <p className="text-center text-sm">
          Suppliers Report — Printed: {printDate}
        </p>
        <hr className="my-2" />
      </div>

      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Suppliers</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage medicine suppliers and their contact details
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
            data-ocid="suppliers.print.button"
          >
            <Printer size={15} className="mr-2" /> Print Report
          </Button>
          <Button
            onClick={() => {
              setForm(EMPTY);
              setErrors({});
              setOpen(true);
            }}
            data-ocid="suppliers.add_supplier.button"
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus size={16} className="mr-2" /> Add Supplier
          </Button>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <p className="text-sm text-muted-foreground">
            {suppliers?.length ?? 0} suppliers registered
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table data-ocid="suppliers.table">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide w-10">
                    S/N
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Supplier Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Contact Person
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Phone
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Email
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Address
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
                  </>
                ) : suppliers && suppliers.length > 0 ? (
                  suppliers.map((sup, idx) => (
                    <TableRow
                      key={sup.id.toString()}
                      className="hover:bg-muted/30"
                      data-ocid={`suppliers.item.${idx + 1}`}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 no-print">
                            <Building2 size={12} className="text-primary" />
                          </div>
                          <span className="text-sm font-semibold">
                            {sup.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sup.contactPerson}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sup.phone}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sup.email || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {sup.address || "—"}
                      </TableCell>
                      <TableCell className="no-print">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            data-ocid={`suppliers.edit_button.${idx + 1}`}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-danger-bg text-muted-foreground hover:text-danger transition-colors"
                            data-ocid={`suppliers.delete_button.${idx + 1}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground text-sm"
                      data-ocid="suppliers.empty_state"
                    >
                      No suppliers added yet. Click 'Add Supplier' to get
                      started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-md"
          data-ocid="suppliers.add_supplier.dialog"
        >
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Supplier Name *</Label>
              <Input
                data-ocid="suppliers.name.input"
                value={form.name}
                onChange={(e) => f("name", e.target.value)}
                placeholder="e.g. MedLine Pharma"
              />
              {errors.name && (
                <p
                  className="text-xs text-danger"
                  data-ocid="suppliers.name.error_state"
                >
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Contact Person *</Label>
              <Input
                data-ocid="suppliers.contactPerson.input"
                value={form.contactPerson}
                onChange={(e) => f("contactPerson", e.target.value)}
                placeholder="e.g. Ahmed Khan"
              />
              {errors.contactPerson && (
                <p className="text-xs text-danger">{errors.contactPerson}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Phone *</Label>
              <Input
                data-ocid="suppliers.phone.input"
                value={form.phone}
                onChange={(e) => f("phone", e.target.value)}
                placeholder="+92-300-0000000"
              />
              {errors.phone && (
                <p className="text-xs text-danger">{errors.phone}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email</Label>
              <Input
                data-ocid="suppliers.email.input"
                type="email"
                value={form.email}
                onChange={(e) => f("email", e.target.value)}
                placeholder="supplier@example.com"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Address</Label>
              <Input
                data-ocid="suppliers.address.input"
                value={form.address}
                onChange={(e) => f("address", e.target.value)}
                placeholder="Full address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="suppliers.add_supplier.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={addSupplier.isPending}
              data-ocid="suppliers.add_supplier.submit_button"
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {addSupplier.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              {addSupplier.isPending ? "Adding..." : "Add Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
