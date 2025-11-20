const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    amount: { 
      type: Number, 
      required: true 
    },
    currency: { 
      type: String, 
      default: "INR" 
    },
    status: { 
      type: String, 
      enum: ["success", "failed", "pending"], 
      default: "pending" 
    },
    transactionId: { 
      type: String, 
      required: true, 
      unique: true 
    },
    planId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "PricingPlan",
      required: true 
    },
    planName: {
      type: String,
      required: true
    },
    billingCycle: { 
      type: String, 
      enum: ["monthly", "annual"], 
      required: true 
    },
    expiryDate: { 
      type: Date, 
      required: true 
    },
    cashfreeOrderId: {
      type: String
    },
    paymentMethod: {
      type: String
    },
    // Auto-renewal fields
    autoRenewal: {
      type: Boolean,
      default: true
    },
    renewalAttempts: {
      type: Number,
      default: 0
    },
    maxRenewalAttempts: {
      type: Number,
      default: 3
    },
    nextRenewalDate: {
      type: Date
    },
    renewalStatus: {
      type: String,
      enum: ["pending", "scheduled", "processing", "failed", "cancelled"],
      default: "scheduled"
    }
  },
  { timestamps: true }
);

// Index for better query performance
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ createdAt: 1 });
paymentSchema.index({ expiryDate: 1 });
paymentSchema.index({ autoRenewal: 1, renewalStatus: 1 });
paymentSchema.index({ nextRenewalDate: 1 });

module.exports = mongoose.model("Payment", paymentSchema);