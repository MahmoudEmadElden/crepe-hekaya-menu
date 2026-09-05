/**
 * POST /api/auth/register — Register a new customer account
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectDB } = require('../_lib/db');
const User = require('../_lib/models/User');
const { handleCors } = require('../_lib/auth-middleware');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { username, password, displayName, address, phone } = req.body;

    // Validation
    if (!displayName || !displayName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'الاسم بالكامل مطلوب'
      });
    }

    if (!address || !address.trim() || address.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'العنوان بالتفصيل مطلوب (المنطقة، الشارع، رقم العمارة/الشقة)'
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'رقم التليفون مطلوب'
      });
    }

    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'رقم التليفون غير صحيح. يرجى إدخال رقم هاتف محمول مصري صحيح مكون من 11 رقماً (مثال: 01012345678)'
      });
    }

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم مطلوب'
      });
    }

    if (username.trim().length < 3 || username.trim().length > 30) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم لازم يكون من 3 لـ 30 حرف'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور لازم تكون 6 حروف أو أرقام على الأقل'
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'اسم المستخدم ده موجود بالفعل. اختار اسم تاني.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username: username.trim().toLowerCase(),
      password: hashedPassword,
      displayName: displayName.trim(),
      address: address.trim(),
      phone: cleanPhone,
      role: 'customer'
    });

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        address: user.address,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'حصل مشكلة في السيرفر. جرب تاني.'
    });
  }
};
