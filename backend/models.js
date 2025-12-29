import mongoose from "mongoose";

const { Schema } = mongoose;

/* ================== StockRequest Schema ================== */
const StockRequestSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    item_id: { type: String, maxlength: 100 },
    invoice_no: { type: String, maxlength: 50 },
    quantity: Number,
    unit_price: Number,
    total_price: Number,
    supplier_id: { type: String, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    image_url: { type: String },
    status: { type: String, default: "pending" },
    admin_note: { type: String, maxlength: 500 },
    reviewed_by_id: { type: Schema.Types.ObjectId, ref: "Admin" },
    reviewed_at: Date,
    approved_at: Date,
    requested_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/* ================== DeadStockRequest Schema ================== */
const DeadStockRequestSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    item_id: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true },
    image_url: { type: String },
    status: { type: String, default: "pending" },
    reported_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/* ================== Department Schema ================== */
const departmentSchema = new Schema(
  {
    name: String,
    code: String,
    description: String,
    faculty: String,
  },
  { timestamps: true }
);

/* ================== Office Schema ================== */
const officeSchema = new Schema(
  {
    name: String,
    description: String,
    section: String,
  },
  { timestamps: true }
);

/* ================== Supplier Schema ================== */
const supplierSchema = new Schema(
  {
    name: String,
    contactPerson: String,
    phone: String,
    email: String,
    address: String,
  },
  { timestamps: true }
);

/* ================== Category Schema ================== */
const categorySchema = new Schema(
  {
    name: String,
    description: String,
  },
  { timestamps: true }
);

/* ================== Item Schema ================== */
const itemSchema = new Schema(
  {
    name: String,
    description: String,
    category_id: { type: String, ref: "Category", required: true },
    unit: String,
  },
  { timestamps: true }
);

/* ================== StockIn Schema ================== */
const stockInSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    department_id: { type: String, ref: "Department" },
    office_id: { type: String, ref: "Office" },
    item_id: { type: String, ref: "Item" },
    supplier_id: { type: String, ref: "Supplier" },
    quantity: Number,
    unit_price: Number,
    total_price: Number,
    purchase_date: Date,
    invoice_no: { type: String, required: true, unique: true, index: true },
    remarks: String,
  },
  { timestamps: true }
);

/* ================== CurrentStockIn Schema ================== */
const currentStockInSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    department_id: { type: String, ref: "Department" },
    office_id: { type: String, ref: "Office" },
    item_id: { type: String, ref: "Item" },
    supplier_id: { type: String, ref: "Supplier" },
    quantity: Number,
    unit_price: Number,
    total_price: Number,
    purchase_date: Date,
    invoice_no: String,
    remarks: String,
  },
  { timestamps: true }
);

/* ================== StockOut Schema ================== */
const stockOutSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    department_id: { type: String, ref: "Department" },
    office_id: { type: String, ref: "Office" },
    item_id: { type: Schema.Types.ObjectId, ref: "Item" },
    issue_type: String,
    issue_by: String,
    issue_date: Date,
    quantity: Number,
    remarks: String,
  },
  { timestamps: true }
);

/* ================== CurrentStockOut Schema ================== */
const currentStockOutSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    department_id: { type: String, ref: "Department" },
    office_id: { type: String, ref: "Office" },
    item_id: { type: Schema.Types.ObjectId, ref: "Item" },
    issue_type: String,
    issue_by: String,
    issue_date: Date,
    quantity: Number,
    remarks: String,
  },
  { timestamps: true }
);

/* ================== DeadStock Schema ================== */
const deadStockSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    item_id: { type: Schema.Types.ObjectId, ref: "Item" },
    department_id: { type: String, ref: "Department" },
    office_id: { type: String, ref: "Office" },
    quantity: Number,
    reason: String,
    reported_at: Date,
  },
  { timestamps: true }
);

/* ================== User Schema ================== */
const userSchema = new Schema(
  {
    name: String,
    email: String,
    password: String,
    role: String,
    phone_number: String,
    department_id: { type: Schema.Types.ObjectId, ref: "Department" },
    office_id: { type: Schema.Types.ObjectId, ref: "Office" },
  },
  { timestamps: true }
);

/* ================== StockHistory Schema ================== */
const stockHistorySchema = new Schema(
  {
    item_id: { type: Schema.Types.ObjectId, ref: "Item" },
    action: String,
    reference_id: { type: Schema.Types.ObjectId },
    quantity: Number,
    performed_by: { type: Schema.Types.ObjectId, ref: "User" },
    date: Date,
  },
  { timestamps: true }
);

/* ================== Report Schema ================== */
const reportSchema = new Schema(
  {
    report_type: String,
    generated_by: { type: Schema.Types.ObjectId, ref: "User" },
    generated_at: Date,
  },
  { timestamps: true }
);

/* ================== Blockchain (Block) Schema ================== */
const blockSchema = new Schema({
  index: Number,
  timestamp: String,
  transaction_type: String,
  data: Object,
  previous_hash: String,
  hash: String,
});

/* ================== Model Exports ================== */
export const Department = mongoose.model("Department", departmentSchema);
export const Office = mongoose.model("Office", officeSchema);
export const Supplier = mongoose.model("Supplier", supplierSchema);
export const Category = mongoose.model("Category", categorySchema);
export const Item = mongoose.model("Item", itemSchema);
export const User = mongoose.model("User", userSchema);
export const StockIn = mongoose.model("StockIn", stockInSchema);
export const CurrentStockIn = mongoose.model("CurrentStockIn", currentStockInSchema);
export const StockOut = mongoose.model("StockOut", stockOutSchema);
export const CurrentStockOut = mongoose.model("CurrentStockOut", currentStockOutSchema);
export const DeadStock = mongoose.model("DeadStock", deadStockSchema);
export const DeadStockRequest = mongoose.model("DeadStockRequest", DeadStockRequestSchema);
export const StockRequest = mongoose.model("StockRequest", StockRequestSchema);
export const StockHistory = mongoose.model("StockHistory", stockHistorySchema);
export const Report = mongoose.model("Report", reportSchema);
export const Block = mongoose.model("Block", blockSchema);
