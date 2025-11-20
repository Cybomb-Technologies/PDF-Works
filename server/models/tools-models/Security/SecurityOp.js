const mongoose = require('mongoose');

const SecurityOpSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  operation: { type: String, enum: ['encrypt','decrypt','protect-2fa','share','access'], required: true },
  originalName: String,
  resultName: String,
  resultPath: String,
  metadata: { type: Object }, // e.g. fileId, secret (do NOT store sensitive plain passwords), accessList
  status: { type: String, enum: ['processing','done','failed'], default: 'processing' }
}, { timestamps: true });

module.exports = mongoose.model('SecurityOp', SecurityOpSchema);
