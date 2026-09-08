/**
 * POST /api/auth/register — Register a new customer account for Hesham Fouad
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

    // Strict Validation
    if (!displayName || !displayName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'الاسم بالكامل مطلوب'
      });
    }

    if (displayName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال اسم صحيح مكون من 3 أحرف على الأقل'
      });
    }

    if (!address || !address.trim() || address.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'العنوان بالتفصيل في محافظة أسيوط مطلوب (الشارع، رقم العمارة/الشقة، علامة مميزة)'
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'رقم الموبايل مطلوب لإتمام الطلبات'
      });
    }

    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقماً يبدأ بـ 01 (مثال: 01012345678)'
      });
    }

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم مطلوب'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم يجب أن يكون من 3 إلى 30 حرفاً'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل'
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'اسم المستخدم هذا مسجل بالفعل. يرجى اختيار اسم مستخدم آخر.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with customer role
    const user = await User.create({
      username: cleanUsername,
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
      process.env.JWT_SECRET || 'hesham_fouad_super_secure_jwt_secret_2026_king',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
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
    console.error('Register error in Hesham Fouad:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم، يرجى المحاولة مرة أخرى لاحقاً'
    });
  }
};
