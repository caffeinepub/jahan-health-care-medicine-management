import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BillItem {
    quantity: bigint;
    medicineID: bigint;
    unitRate: number;
}
export interface Bill {
    id: bigint;
    status: BillStatus;
    billDate: bigint;
    totalAmount: number;
    items: Array<BillItem>;
    paidAmount: number;
    supplierID: bigint;
}
export interface Medicine {
    id: bigint;
    manufacturer: string;
    lowStockThreshold: bigint;
    expiryDate: string;
    name: string;
    quantity: bigint;
    batchNo: string;
    supplierID: bigint;
    unitRate: number;
}
export interface Distribution {
    id: bigint;
    note: string;
    issuedDate: bigint;
    quantity: bigint;
    issuedBy: string;
    department: Department;
    medicineID: bigint;
    medicineName: string;
}
export interface Supplier {
    id: bigint;
    name: string;
    contactPerson: string;
    email: string;
    address: string;
    phone: string;
}
export interface Payment {
    id: bigint;
    note: string;
    paymentDate: bigint;
    amount: number;
    billID: bigint;
}
export interface DashboardStats {
    totalStockValue: number;
    totalMedicineCount: bigint;
    lowStockCount: bigint;
    expiringSoonCount: bigint;
}
export interface UserProfile {
    name: string;
}
export enum BillStatus {
    Paid = "Paid",
    Unpaid = "Unpaid",
    Partial_ = "Partial"
}
export enum Department {
    OT = "OT",
    ICU = "ICU",
    OPD = "OPD",
    Ward = "Ward",
    Emergency = "Emergency"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBill(billInput: Bill): Promise<bigint>;
    addDistribution(distributionInput: Distribution): Promise<bigint>;
    addMedicine(medicineInput: Medicine): Promise<bigint>;
    addPayment(paymentInput: Payment): Promise<bigint>;
    addSupplier(supplierInput: Supplier): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllMedicines(): Promise<Array<Medicine>>;
    getAllSuppliers(): Promise<Array<Supplier>>;
    getBill(id: bigint): Promise<Bill>;
    getBillsBySupplier(supplierID: bigint): Promise<Array<Bill>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getDistribution(id: bigint): Promise<Distribution>;
    getDistributionsByDepartment(department: Department): Promise<Array<Distribution>>;
    getLowStockMedicines(): Promise<Array<Medicine>>;
    getMedicine(id: bigint): Promise<Medicine>;
    getPayment(id: bigint): Promise<Payment>;
    getSupplier(id: bigint): Promise<Supplier>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
