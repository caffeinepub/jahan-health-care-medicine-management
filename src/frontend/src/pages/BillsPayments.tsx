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
import { CreditCard, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Bill, BillItem, Payment } from "../backend.d";
import { BillStatus } from "../backend.d";
import { BillStatusBadge } from "../components/StatusBadge";
import {
  useAddBill,
  useAddPayment,
  useAllBills,
  useAllMedicines,
  useAllSuppliers,
} from "../hooks/useQueries";
import { formatPKR, formatTimestamp, nowNs } from "../lib/helpers";

interface LineItem {
  id: string;
  medicineID: string;
  quantity: string;
  unitRate: string;
}
const mkLine = (): LineItem => ({
  id: crypto.randomUUID(),
  medicineID: "",
  quantity: "",
  unitRate: "",
});

const SUMMARY_KEYS = [
  { key: "total", label: "Total Bills", color: "text-primary" },
  { key: "due", label: "Total Due", color: "text-danger" },
  { key: "paid", label: "Total Paid", color: "text-success" },
];

export function BillsPayments() {
  const { data: bills, isLoading } = useAllBills();
  const { data: suppliers } = useAllSuppliers();
  const { data: medicines } = useAllMedicines();
  const addBill = useAddBill();
  const addPayment = useAddPayment();

  const [billOpen, setBillOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const [billForm, setBillForm] = useState({
    supplierID: "",
    billDate: new Date().toISOString().split("T")[0],
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([mkLine()]);
  const [payForm, setPayForm] = useState({
    amount: "",
    note: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });
  const [billErrors, setBillErrors] = useState<Record<string, string>>({});

  const totalAmount = lineItems.reduce((sum, li) => {
    const q = Number(li.quantity) || 0;
    const r = Number(li.unitRate) || 0;
    return sum + q * r;
  }, 0);

  const handleAddLineItem = () => setLineItems((p) => [...p, mkLine()]);
  const handleRemoveLineItem = (idx: number) =>
    setLineItems((p) => p.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: keyof LineItem, val: string) => {
    setLineItems((p) =>
      p.map((li, i) => (i === idx ? { ...li, [field]: val } : li)),
    );
  };

  const summaryValues: Record<string, string> = {
    total: bills ? bills.length.toString() : "0",
    due: formatPKR(
      bills ? bills.reduce((s, b) => s + (b.totalAmount - b.paidAmount), 0) : 0,
    ),
    paid: formatPKR(bills ? bills.reduce((s, b) => s + b.paidAmount, 0) : 0),
  };

  const handleAddBill = async () => {
    const e: Record<string, string> = {};
    if (!billForm.supplierID) e.supplierID = "Select a supplier";
    if (
      lineItems.some((li) => !li.medicineID || !li.quantity || !li.unitRate)
    ) {
      e.items = "All line items must be complete";
    }
    setBillErrors(e);
    if (Object.keys(e).length > 0) return;

    const items: BillItem[] = lineItems.map((li) => ({
      medicineID: BigInt(li.medicineID),
      quantity: BigInt(li.quantity),
      unitRate: Number(li.unitRate),
    }));
    const bill: Bill = {
      id: 0n,
      supplierID: BigInt(billForm.supplierID),
      billDate: nowNs(),
      items,
      totalAmount,
      paidAmount: 0,
      status: BillStatus.Unpaid,
    };
    try {
      await addBill.mutateAsync(bill);
      toast.success("Bill added successfully");
      setBillOpen(false);
      setBillForm({
        supplierID: "",
        billDate: new Date().toISOString().split("T")[0],
      });
      setLineItems([mkLine()]);
      setBillErrors({});
    } catch {
      toast.error("Failed to add bill");
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedBill || !payForm.amount) return;
    const payment: Payment = {
      id: 0n,
      billID: selectedBill.id,
      amount: Number(payForm.amount),
      paymentDate: nowNs(),
      note: payForm.note,
    };
    try {
      await addPayment.mutateAsync(payment);
      toast.success("Payment recorded");
      setPayOpen(false);
      setPayForm({
        amount: "",
        note: "",
        paymentDate: new Date().toISOString().split("T")[0],
      });
    } catch {
      toast.error("Failed to record payment");
    }
  };

  const getSupplierName = (id: bigint) =>
    suppliers?.find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="space-y-5" data-ocid="bills.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Bills & Payments
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track supplier invoices, payments, and outstanding dues
          </p>
        </div>
        <Button
          onClick={() => {
            setBillErrors({});
            setLineItems([mkLine()]);
            setBillOpen(true);
          }}
          data-ocid="bills.add_bill.button"
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus size={16} className="mr-2" /> Add Bill
        </Button>
      </div>

      {/* Summary Cards */}
      {bills && bills.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {SUMMARY_KEYS.map((sk) => (
            <Card key={sk.key} className="shadow-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  {sk.label}
                </p>
                <p className={`text-xl font-bold mt-1 ${sk.color}`}>
                  {summaryValues[sk.key]}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <p className="text-sm text-muted-foreground">
            {bills?.length ?? 0} bills total
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table data-ocid="bills.table">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Bill ID
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Supplier
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-right">
                    Total
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-right">
                    Paid
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-right">
                    Due
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide w-16">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    <TableRow key="sk1">
                      <TableCell colSpan={8}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk2">
                      <TableCell colSpan={8}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk3">
                      <TableCell colSpan={8}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                    <TableRow key="sk4">
                      <TableCell colSpan={8}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  </>
                ) : bills && bills.length > 0 ? (
                  bills.map((bill, idx) => (
                    <TableRow
                      key={bill.id.toString()}
                      className="hover:bg-muted/30"
                      data-ocid={`bills.item.${idx + 1}`}
                    >
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        #{bill.id.toString()}
                      </TableCell>
                      <TableCell className="text-sm font-semibold">
                        {getSupplierName(bill.supplierID)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatTimestamp(bill.billDate)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold">
                        {formatPKR(bill.totalAmount)}
                      </TableCell>
                      <TableCell className="text-xs text-right text-success font-medium">
                        {formatPKR(bill.paidAmount)}
                      </TableCell>
                      <TableCell className="text-xs text-right text-danger font-medium">
                        {formatPKR(bill.totalAmount - bill.paidAmount)}
                      </TableCell>
                      <TableCell>
                        <BillStatusBadge status={bill.status} />
                      </TableCell>
                      <TableCell>
                        {bill.status !== BillStatus.Paid && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-primary text-primary hover:bg-primary hover:text-white"
                            data-ocid={`bills.pay_button.${idx + 1}`}
                            onClick={() => {
                              setSelectedBill(bill);
                              setPayForm({
                                amount: "",
                                note: "",
                                paymentDate: new Date()
                                  .toISOString()
                                  .split("T")[0],
                              });
                              setPayOpen(true);
                            }}
                          >
                            <CreditCard size={11} className="mr-1" /> Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-12 text-muted-foreground text-sm"
                      data-ocid="bills.empty_state"
                    >
                      No bills recorded yet. Click 'Add Bill' to create your
                      first bill.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Bill Dialog */}
      <Dialog open={billOpen} onOpenChange={setBillOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="bills.add_bill.dialog"
        >
          <DialogHeader>
            <DialogTitle>Create New Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Supplier *</Label>
                <Select
                  value={billForm.supplierID}
                  onValueChange={(v) =>
                    setBillForm((p) => ({ ...p, supplierID: v }))
                  }
                >
                  <SelectTrigger data-ocid="bills.supplier.select">
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
                {billErrors.supplierID && (
                  <p className="text-xs text-danger">{billErrors.supplierID}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Bill Date</Label>
                <Input
                  data-ocid="bills.date.input"
                  type="date"
                  value={billForm.billDate}
                  onChange={(e) =>
                    setBillForm((p) => ({ ...p, billDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Line Items *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddLineItem}
                  className="h-7 text-xs"
                  data-ocid="bills.add_line_item.button"
                >
                  <Plus size={12} className="mr-1" /> Add Item
                </Button>
              </div>
              {billErrors.items && (
                <p className="text-xs text-danger">{billErrors.items}</p>
              )}
              <div className="space-y-2">
                {lineItems.map((li, idx) => (
                  <div
                    key={li.id}
                    className="grid grid-cols-[1fr_100px_100px_auto] gap-2 items-start"
                  >
                    <Select
                      value={li.medicineID}
                      onValueChange={(v) => updateLine(idx, "medicineID", v)}
                    >
                      <SelectTrigger
                        className="h-8 text-xs"
                        data-ocid={`bills.line_medicine.select.${idx + 1}`}
                      >
                        <SelectValue placeholder="Select medicine" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines?.map((m) => (
                          <SelectItem
                            key={m.id.toString()}
                            value={m.id.toString()}
                          >
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="h-8 text-xs"
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={li.quantity}
                      onChange={(e) =>
                        updateLine(idx, "quantity", e.target.value)
                      }
                    />
                    <Input
                      className="h-8 text-xs"
                      type="number"
                      min="0"
                      placeholder="Rate"
                      value={li.unitRate}
                      onChange={(e) =>
                        updateLine(idx, "unitRate", e.target.value)
                      }
                    />
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        className="p-1 text-danger hover:bg-danger-bg rounded"
                        data-ocid={`bills.remove_line.button.${idx + 1}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <p className="text-sm font-bold text-foreground">
                  Total: {formatPKR(totalAmount)}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBillOpen(false)}
              data-ocid="bills.add_bill.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddBill}
              disabled={addBill.isPending}
              data-ocid="bills.add_bill.submit_button"
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {addBill.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              {addBill.isPending ? "Creating..." : "Create Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-sm" data-ocid="bills.pay.dialog">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-1 py-1 bg-muted/50 rounded-lg px-3">
              <p className="text-xs text-muted-foreground">
                Bill #{selectedBill.id.toString()}
              </p>
              <p className="text-sm font-semibold">
                Due:{" "}
                {formatPKR(selectedBill.totalAmount - selectedBill.paidAmount)}
              </p>
            </div>
          )}
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Amount (PKR) *</Label>
              <Input
                data-ocid="bills.pay.amount.input"
                type="number"
                min="0"
                value={payForm.amount}
                onChange={(e) =>
                  setPayForm((p) => ({ ...p, amount: e.target.value }))
                }
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Note</Label>
              <Input
                data-ocid="bills.pay.note.input"
                value={payForm.note}
                onChange={(e) =>
                  setPayForm((p) => ({ ...p, note: e.target.value }))
                }
                placeholder="Payment note (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayOpen(false)}
              data-ocid="bills.pay.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={addPayment.isPending}
              data-ocid="bills.pay.submit_button"
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {addPayment.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
