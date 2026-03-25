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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Types
  type Medicine = {
    id : Nat;
    name : Text;
    batchNo : Text;
    expiryDate : Text; // ISO string e.g. "2024-06-12"
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
    billDate : Int; // Timestamp
    items : [BillItem];
    totalAmount : Float;
    paidAmount : Float;
    status : BillStatus;
  };

  type Payment = {
    id : Nat;
    billID : Nat;
    amount : Float;
    paymentDate : Int; // Timestamp
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
    issuedDate : Int; // Timestamp
    issuedBy : Text;
    note : Text;
  };

  type DashboardStats = {
    totalMedicineCount : Nat;
    lowStockCount : Nat;
    expiringSoonCount : Nat;
    totalStockValue : Float;
  };

  // Comparison function for Bill by billDate
  module Bill {
    public func compareByBillDate(bill1 : Bill, bill2 : Bill) : Order.Order {
      Int.compare(bill1.billDate, bill2.billDate);
    };
  };

  // PriceAmount type for sorting medicines by price
  type PriceAmount = {
    medicine : Medicine;
    totalPrice : Float;
  };

  module PriceAmount {
    public func compareByPrice(a : PriceAmount, b : PriceAmount) : Order.Order {
      Float.compare(b.totalPrice, a.totalPrice);
    };
  };

  // Caching for medicine list
  var cachedMedicineList : [(Nat, Medicine)] = [];
  var isMedicineListDirty = true;

  // Data stores
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
  public shared ({ caller }) func addMedicine(medicineInput : Medicine) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add medicine");
    };
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

  public query ({ caller }) func getMedicine(id : Nat) : async Medicine {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view medicine details");
    };
    switch (medicines.get(id)) {
      case (?medicine) { medicine };
      case (null) { Runtime.trap("Medicine not found") };
    };
  };

  public query ({ caller }) func getAllMedicines() : async [Medicine] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view medicines");
    };
    if (isMedicineListDirty) {
      cachedMedicineList := medicines.toArray();
      isMedicineListDirty := false;
    };
    cachedMedicineList.map(func((_, medicine)) { medicine });
  };

  public query ({ caller }) func getLowStockMedicines() : async [Medicine] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view low stock medicines");
    };
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
  public shared ({ caller }) func addSupplier(supplierInput : Supplier) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add suppliers");
    };
    let id = nextSupplierID;
    nextSupplierID += 1;
    let newSupplier : Supplier = {
      supplierInput with
      id;
    };
    suppliers.add(id, newSupplier);
    id;
  };

  public query ({ caller }) func getSupplier(id : Nat) : async Supplier {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view supplier details");
    };
    switch (suppliers.get(id)) {
      case (?supplier) { supplier };
      case (null) { Runtime.trap("Supplier not found") };
    };
  };

  public query ({ caller }) func getAllSuppliers() : async [Supplier] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view suppliers");
    };
    suppliers.values().toArray();
  };

  // Bill management
  public shared ({ caller }) func addBill(billInput : Bill) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add bills");
    };
    let id = nextBillID;
    nextBillID += 1;
    let newBill : Bill = {
      billInput with
      id;
    };
    bills.add(id, newBill);
    id;
  };

  public query ({ caller }) func getBill(id : Nat) : async Bill {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bills");
    };
    switch (bills.get(id)) {
      case (?bill) { bill };
      case (null) { Runtime.trap("Bill not found") };
    };
  };

  public query ({ caller }) func getBillsBySupplier(supplierID : Nat) : async [Bill] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bills");
    };
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
  public shared ({ caller }) func addPayment(paymentInput : Payment) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add payments");
    };
    let id = nextPaymentID;
    nextPaymentID += 1;
    let newPayment : Payment = {
      paymentInput with
      id;
    };
    payments.add(id, newPayment);
    id;
  };

  public query ({ caller }) func getPayment(id : Nat) : async Payment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payments");
    };
    switch (payments.get(id)) {
      case (?payment) { payment };
      case (null) { Runtime.trap("Payment not found") };
    };
  };

  // Distribution management
  public shared ({ caller }) func addDistribution(distributionInput : Distribution) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add distributions");
    };
    let id = nextDistributionID;
    nextDistributionID += 1;
    let newDistribution : Distribution = {
      distributionInput with
      id;
    };
    distributions.add(id, newDistribution);
    id;
  };

  public query ({ caller }) func getDistribution(id : Nat) : async Distribution {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view distributions");
    };
    switch (distributions.get(id)) {
      case (?distribution) { distribution };
      case (null) { Runtime.trap("Distribution not found") };
    };
  };

  public query ({ caller }) func getDistributionsByDepartment(department : Department) : async [Distribution] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view distributions by department");
    };
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
  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard stats");
    };
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

  // Helper functions for optional values
  func optionCompare<T>(a : ?T, b : ?T, cmp : (T, T) -> Order.Order) : Order.Order {
    switch (a, b) {
      case (null, null) { #equal };
      case (null, _) { #less };
      case (_, null) { #greater };
      case (?a, ?b) { cmp(a, b) };
    };
  };
};
