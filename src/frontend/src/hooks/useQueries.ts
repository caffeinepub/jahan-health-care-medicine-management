import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Bill,
  DashboardStats,
  Distribution,
  Medicine,
  Payment,
  Supplier,
} from "../backend.d";
import { BillStatus, Department } from "../backend.d";
import { useActor } from "./useActor";

export function useDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor)
        return {
          totalMedicineCount: 0n,
          lowStockCount: 0n,
          expiringSoonCount: 0n,
          totalStockValue: 0,
        };
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllMedicines() {
  const { actor, isFetching } = useActor();
  return useQuery<Medicine[]>({
    queryKey: ["medicines"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMedicines();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllSuppliers() {
  const { actor, isFetching } = useActor();
  return useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSuppliers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllBills() {
  const { actor, isFetching } = useActor();
  return useQuery<Bill[]>({
    queryKey: ["bills"],
    queryFn: async () => {
      if (!actor) return [];
      const suppliers = await actor.getAllSuppliers();
      if (!suppliers.length) return [];
      const billArrays = await Promise.all(
        suppliers.map((s) => actor.getBillsBySupplier(s.id)),
      );
      return billArrays.flat();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDistributionsByDept(dept: Department) {
  const { actor, isFetching } = useActor();
  return useQuery<Distribution[]>({
    queryKey: ["distributions", dept],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDistributionsByDepartment(dept);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllDistributions() {
  const { actor, isFetching } = useActor();
  return useQuery<Distribution[]>({
    queryKey: ["distributions", "all"],
    queryFn: async () => {
      if (!actor) return [];
      const depts = [
        Department.OT,
        Department.Ward,
        Department.ICU,
        Department.Emergency,
        Department.OPD,
      ];
      const arrays = await Promise.all(
        depts.map((d) => actor.getDistributionsByDepartment(d)),
      );
      return arrays.flat();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMedicine() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (med: Medicine) => actor!.addMedicine(med),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });
}

export function useAddSupplier() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sup: Supplier) => actor!.addSupplier(sup),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useAddBill() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bill: Bill) => actor!.addBill(bill),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });
}

export function useAddPayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payment: Payment) => actor!.addPayment(payment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });
}

export function useAddDistribution() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dist: Distribution) => actor!.addDistribution(dist),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributions"] });
      qc.invalidateQueries({ queryKey: ["medicines"] });
    },
  });
}

export { Department, BillStatus };
