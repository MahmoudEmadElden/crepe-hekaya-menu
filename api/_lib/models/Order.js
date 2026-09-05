/**
 * Order Model — Crepe Hekaya
 */
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  variant: { type: String, default: '' },
  variantLabel: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    default: ''
  },
  customerPhone: {
    type: String,
    required: [true, 'رقم التليفون مطلوب للطلب'],
    trim: true,
    default: ''
  },
  deliveryAddress: {
    type: String,
    required: [true, 'عنوان التوصيل بالتفصيل مطلوب للطلب'],
    trim: true,
    default: ''
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function (v) {
        return v && v.length > 0 && v.length <= 20;
      },
      message: 'الطلب لازم يحتوي على صنف واحد على الأقل و 20 على الأكثر'
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'الملاحظات لازم تكون أقل من 500 حرف'],
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
