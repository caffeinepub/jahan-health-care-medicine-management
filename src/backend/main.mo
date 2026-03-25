import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Option "mo:core/Option";
import List "mo:core/List";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Auth state (use non-persistent isolated state)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // Types
  type Medicine = {
    id : Nat;
    name : Text;
    batchNo : Text;
    expiryDate : Text;
    manufacturer : Text;
    supplierID : Nat;
    unitRate : Float;
    quantity : Nat;
    lowStockThreshold : Nat;
  };

  type Supplier = {
    id : Nat;
    name : Text;
    contactPerson : Text;
    phone : Text;
    address : Text;
    email : Text;
  };

  type BillItem = {
    medicineID : Nat;
    quantity : Nat;
    unitRate : Float;
  };

  type BillStatus = {
    #Paid;
    #Partial;
    #Unpaid;
  };

  type Bill = {
    id : Nat;
    supplierID : Nat;
    billDate : Int;
    items : [BillItem];
    totalAmount : Float;
    paidAmount : Float;
    status : BillStatus;
  };

  type Payment = {
    id : Nat;
    billID : Nat;
    amount : Float;
    paymentDate : Int;
    note : Text;
  };

  type Department = {
    #OT;
    #Ward;
    #ICU;
    #Emergency;
    #OPD;
  };

  type Distribution = {
    id : Nat;
    medicineID : Nat;
    medicineName : Text;
    quantity : Nat;
    department : Department;
    issuedDate : Int;
    issuedBy : Text;
    note : Text;
  };

  type DashboardStats = {
    totalMedicineCount : Nat;
    lowStockCount : Nat;
    expiringSoonCount : Nat;
    totalStockValue : Float;
  };

  module Bill {
    public func compareByBillDate(bill1 : Bill, bill2 : Bill) : Order.Order {
      Int.compare(bill1.billDate, bill2.billDate);
    };
  };

  type PriceAmount = {
    medicine : Medicine;
    totalPrice : Float;
  };

  module PriceAmount {
    public func compareByPrice(a : PriceAmount, b : PriceAmount) : Order.Order {
      Float.compare(b.totalPrice, a.totalPrice);
    };
  };

  var cachedMedicineList : [(Nat, Medicine)] = [];
  var isMedicineListDirty = true;

  let medicines = Map.empty<Nat, Medicine>();
  let suppliers = Map.empty<Nat, Supplier>();
  let bills = Map.empty<Nat, Bill>();
  let payments = Map.empty<Nat, Payment>();
  let distributions = Map.empty<Nat, Distribution>();

  var nextMedicineID = 1;
  var nextSupplierID = 1;
  var nextBillID = 1;
  var nextPaymentID = 1;
  var nextDistributionID = 1;

  // Medicine management
  public shared func addMedicine(medicineInput : Medicine) : async Nat {
    let id = nextMedicineID;
    nextMedicineID += 1;
    let newMedicine : Medicine = {
      medicineInput with
      id;
    };
    medicines.add(id, newMedicine);
    isMedicineListDirty := true;
    id;
  };

  public query func getMedicine(id : Nat) : async Medicine {
    switch (medicines.get(id)) {
      case (?medicine) { medicine };
      case (null) { Runtime.trap("Medicine not found") };
    };
  };

  public query func getAllMedicines() : async [Medicine] {
    if (isMedicineListDirty) {
      cachedMedicineList := medicines.toArray();
      isMedicineListDirty := false;
    };
    cachedMedicineList.map(func((_, medicine)) { medicine });
  };

  public query func getLowStockMedicines() : async [Medicine] {
    let lowStock = List.empty<Medicine>();
    let iter = medicines.values();
    iter.forEach(
      func(medicine) {
        if (medicine.quantity <= medicine.lowStockThreshold) {
          lowStock.add(medicine);
        };
      }
    );
    lowStock.toArray();
  };

  // Supplier management
  public shared func addSupplier(supplierInput : Supplier) : async Nat {
    let id = nextSupplierID;
    nextSupplierID += 1;
    let newSupplier : Supplier = {
      supplierInput with
      id;
    };
    suppliers.add(id, newSupplier);
    id;
  };

  public query func getSupplier(id : Nat) : async Supplier {
    switch (suppliers.get(id)) {
      case (?supplier) { supplier };
      case (null) { Runtime.trap("Supplier not found") };
    };
  };

  public query func getAllSuppliers() : async [Supplier] {
    suppliers.values().toArray();
  };

  // Bill management
  public shared func addBill(billInput : Bill) : async Nat {
    let id = nextBillID;
    nextBillID += 1;
    let newBill : Bill = {
      billInput with
      id;
    };
    bills.add(id, newBill);
    id;
  };

  public query func getBill(id : Nat) : async Bill {
    switch (bills.get(id)) {
      case (?bill) { bill };
      case (null) { Runtime.trap("Bill not found") };
    };
  };

  public query func getBillsBySupplier(supplierID : Nat) : async [Bill] {
    let supplierBills = List.empty<Bill>();
    let iter = bills.values();
    iter.forEach(
      func(bill) {
        if (bill.supplierID == supplierID) {
          supplierBills.add(bill);
        };
      }
    );
    supplierBills.toArray().sort(Bill.compareByBillDate);
  };

  // Payment management
  public shared func addPayment(paymentInput : Payment) : async Nat {
    let id = nextPaymentID;
    nextPaymentID += 1;
    let newPayment : Payment = {
      paymentInput with
      id;
    };
    payments.add(id, newPayment);
    id;
  };

  public query func getPayment(id : Nat) : async Payment {
    switch (payments.get(id)) {
      case (?payment) { payment };
      case (null) { Runtime.trap("Payment not found") };
    };
  };

  // Distribution management
  public shared func addDistribution(distributionInput : Distribution) : async Nat {
    let id = nextDistributionID;
    nextDistributionID += 1;
    let newDistribution : Distribution = {
      distributionInput with
      id;
    };
    distributions.add(id, newDistribution);
    id;
  };

  public query func getDistribution(id : Nat) : async Distribution {
    switch (distributions.get(id)) {
      case (?distribution) { distribution };
      case (null) { Runtime.trap("Distribution not found") };
    };
  };

  public query func getDistributionsByDepartment(department : Department) : async [Distribution] {
    let departmentDistributions = List.empty<Distribution>();
    let iter = distributions.values();
    iter.forEach(
      func(distribution) {
        if (distribution.department == department) {
          departmentDistributions.add(distribution);
        };
      }
    );
    departmentDistributions.toArray();
  };

  // Dashboard stats
  public query func getDashboardStats() : async DashboardStats {
    let totalMedicineCount = medicines.size();
    let lowStockCount = medicines.values().foldLeft(
      0,
      func(count, medicine) {
        if (medicine.quantity <= medicine.lowStockThreshold) { count + 1 } else { count };
      },
    );
    let expiringSoonCount = 0;
    let totalStockValue = medicines.values().foldLeft(
      0.0,
      func(acc, medicine) { acc + (medicine.quantity.toFloat() * medicine.unitRate) },
    );
    {
      totalMedicineCount;
      lowStockCount;
      expiringSoonCount;
      totalStockValue;
    };
  };

  func optionCompare<T>(a : ?T, b : ?T, cmp : (T, T) -> Order.Order) : Order.Order {
    switch (a, b) {
      case (null, null) { #equal };
      case (null, _) { #less };
      case (_, null) { #greater };
      case (?a, ?b) { cmp(a, b) };
    };
  };
};
