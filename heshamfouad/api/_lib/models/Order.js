/**
 * Order Model — Hesham Fouad King of Crepe
 */
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  selectedAddons: [{
    id: String,
    name: String,
    price: Number
  }],
  selectedSauces: [{
    id: String,
    name: String,
    price: Number
  }],
  notes: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  customerName: {
    type: String,
    required: [true, 'اسم العميل مطلوب'],
    trim: true
  },
  customerPhone: {
    type: String,
    required: [true, 'رقم التليفون مطلوب للطلب'],
    trim: true
  },
  deliveryAddress: {
    type: String,
    required: [true, 'عنوان التوصيل بالتفصيل مطلوب'],
    trim: true
  },
  mapLocation: {
    type: String,
    default: ''
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function (v) {
        return v && v.length > 0 && v.length <= 30;
      },
      message: 'الطلب لازم يحتوي على صنف واحد على الأقل'
    }
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryFee: {
    type: Number,
    default: 15
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
  },
  cashierName: {
    type: String,
    default: 'الكاشير'
  }
}, {
  timestamps: true
});

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
