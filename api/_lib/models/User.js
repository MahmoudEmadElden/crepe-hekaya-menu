/**
 * User Model — Crepe Hekaya
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'اسم المستخدم مطلوب'],
    unique: true,
    trim: true,
    minlength: [3, 'اسم المستخدم لازم يكون 3 حروف على الأقل'],
    maxlength: [30, 'اسم المستخدم لازم يكون أقل من 30 حرف']
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة']
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: [50, 'الاسم لازم يكون أقل من 50 حرف'],
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  }
}, {
  timestamps: true
});

// Prevent duplicate model compilation in serverless
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
