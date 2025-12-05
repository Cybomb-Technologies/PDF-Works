// // models/UserCredits.js
// const mongoose = require('mongoose');

// const userCreditsSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
//   // Available credits (never expire)
//   available: {
//     conversion: { type: Number, default: 0 },
//     editTools: { type: Number, default: 0 },
//     organizeTools: { type: Number, default: 0 },
//     securityTools: { type: Number, default: 0 },
//     optimizeTools: { type: Number, default: 0 },
//     advancedTools: { type: Number, default: 0 },
//     convertTools: { type: Number, default: 0 },
//     total: { type: Number, default: 0 } // For quick calculations
//   },
  
//   // Monthly subscription credits (reset each billing cycle)
//   subscription: {
//     conversion: { type: Number, default: 0 },
//     editTools: { type: Number, default: 0 },
//     organizeTools: { type: Number, default: 0 },
//     securityTools: { type: Number, default: 0 },
//     optimizeTools: { type: Number, default: 0 },
//     advancedTools: { type: Number, default: 0 },
//     convertTools: { type: Number, default: 0 },
//     total: { type: Number, default: 0 },
//     resetDate: { type: Date } // When credits reset
//   },
  
//   // Usage tracking
//   usage: {
//     conversion: { type: Number, default: 0 },
//     editTools: { type: Number, default: 0 },
//     organizeTools: { type: Number, default: 0 },
//     securityTools: { type: Number, default: 0 },
//     optimizeTools: { type: Number, default: 0 },
//     advancedTools: { type: Number, default: 0 },
//     convertTools: { type: Number, default: 0 },
//     total: { type: Number, default: 0 }
//   },
  
//   // History
//   purchaseHistory: [{
//     packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'TopupPackage' },
//     creditsAdded: {
//       conversion: { type: Number, default: 0 },
//       editTools: { type: Number, default: 0 },
//       organizeTools: { type: Number, default: 0 },
//       securityTools: { type: Number, default: 0 },
//       optimizeTools: { type: Number, default: 0 },
//       advancedTools: { type: Number, default: 0 },
//       convertTools: { type: Number, default: 0 },
//       total: { type: Number, default: 0 }
//     },
//     purchaseDate: { type: Date, default: Date.now },
//     transactionId: { type: String }
//   }],
  
//   // Priority settings
//   usagePriority: { 
//     type: String, 
//     enum: ['subscription-first', 'topup-first', 'mixed'],
//     default: 'subscription-first' // Use subscription credits first
//   }
// }, { timestamps: true });

// // Update totals before saving
// userCreditsSchema.pre('save', function(next) {
//   // Calculate available total
//   this.available.total = 
//     this.available.conversion +
//     this.available.editTools +
//     this.available.organizeTools +
//     this.available.securityTools +
//     this.available.optimizeTools +
//     this.available.advancedTools +
//     this.available.convertTools;
  
//   // Calculate subscription total
//   this.subscription.total = 
//     this.subscription.conversion +
//     this.subscription.editTools +
//     this.subscription.organizeTools +
//     this.subscription.securityTools +
//     this.subscription.optimizeTools +
//     this.subscription.advancedTools +
//     this.subscription.convertTools;
    
//   // Calculate usage total
//   this.usage.total = 
//     this.usage.conversion +
//     this.usage.editTools +
//     this.usage.organizeTools +
//     this.usage.securityTools +
//     this.usage.optimizeTools +
//     this.usage.advancedTools +
//     this.usage.convertTools;
    
//   next();
// });

// module.exports = mongoose.model('UserCredits', userCreditsSchema);