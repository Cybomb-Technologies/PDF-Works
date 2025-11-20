const mongoose = require('mongoose');

const OrganizeOpSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  tool: { type: String, enum: ['merge','split','rotate','organize'], required: true },
  originalFiles: [{ filename: String, path: String }],
  output: {
    filename: String,
    path: String,
    size: Number,
    mimetype: { type: String, default: 'application/pdf' }
  },
  params: { type: Object }, // pages, rotation etc
  status: { type: String, enum: ['processing','done','failed'], default: 'processing' }
}, { timestamps: true });

module.exports = mongoose.model('OrganizeOp', OrganizeOpSchema);
