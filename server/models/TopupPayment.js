const mongoose = require("mongoose");

const topupPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topupPackageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TopupPackage",
      required: true,
    },

    // Payment Details
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    cashfreeOrderId: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },

    // Credits Information
    creditsAllocated: {
      conversion: { type: Number, default: 0 },
      editTools: { type: Number, default: 0 },
      organizeTools: { type: Number, default: 0 },
      securityTools: { type: Number, default: 0 },
      optimizeTools: { type: Number, default: 0 },
      advancedTools: { type: Number, default: 0 },
      convertTools: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },

    // User Snapshot at time of purchase
    userSnapshot: {
      email: String,
      plan: String,
      creditsBefore: {
        conversion: { type: Number, default: 0 },
        editTools: { type: Number, default: 0 },
        organizeTools: { type: Number, default: 0 },
        securityTools: { type: Number, default: 0 },
        optimizeTools: { type: Number, default: 0 },
        advancedTools: { type: Number, default: 0 },
        convertTools: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
    },

    // Payment Dates
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes for better performance
topupPaymentSchema.index({ userId: 1, status: 1 });
topupPaymentSchema.index({ transactionId: 1 });
topupPaymentSchema.index({ createdAt: 1 });
topupPaymentSchema.index({ "userSnapshot.email": 1 });

module.exports = mongoose.model("TopupPayment", topupPaymentSchema);