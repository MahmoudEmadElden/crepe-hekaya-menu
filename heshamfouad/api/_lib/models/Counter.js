/**
 * Counter Model — Hesham Fouad Auto-increment sequences
 */
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequenceValue: { type: Number, default: 100 },
  shiftStart: { type: Date },
  resetBy: { type: String },
  resetAt: { type: Date }
}, { strict: false });

counterSchema.statics.getNextSequence = async function (sequenceName) {
  const counter = await this.findByIdAndUpdate(
    sequenceName,
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequenceValue;
};

module.exports = mongoose.models.Counter || mongoose.model('Counter', counterSchema);
