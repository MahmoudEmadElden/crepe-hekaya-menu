/**
 * Counter Model — Auto-increment sequences (e.g., order numbers)
 */
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequenceValue: { type: Number, default: 1000 }
});

/**
 * Get the next value in a sequence (atomic increment).
 * @param {string} sequenceName - e.g., "orderNumber"
 * @returns {Promise<number>} - The next sequence value
 */
counterSchema.statics.getNextSequence = async function (sequenceName) {
  const counter = await this.findByIdAndUpdate(
    sequenceName,
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequenceValue;
};

module.exports = mongoose.models.Counter || mongoose.model('Counter', counterSchema);
