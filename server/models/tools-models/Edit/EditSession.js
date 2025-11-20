const mongoose = require('mongoose');

const EditSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  originalName: String,
  originalPath: String,
  structure: { type: Object },        // stored structure.json
  edits: { type: Object, default: {} },
  exportedFile: {
    filename: String,
    path: String,
    size: Number,
    mimetype: String,
  },
  status: { type: String, enum: ['uploaded','processing','ready','exported','failed'], default: 'uploaded' }
}, { timestamps: true });

module.exports = mongoose.model('EditSession', EditSessionSchema);
