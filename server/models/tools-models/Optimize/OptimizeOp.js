const mongoose = require('mongoose');

const OptimizeOpSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  originalName: String,
  outputName: String,
  inputSize: Number,
  outputSize: Number,
  reductionPercent: Number,
  params: { type: Object },
  status: { type: String, enum: ['processing','done','failed'], default: 'processing' }
}, { timestamps: true });

module.exports = mongoose.model('OptimizeOp', OptimizeOpSchema);
