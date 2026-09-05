/**
 * POST /api/auth/admin-setup — Create or update the admin user
 * Protected by SETUP_SECRET environment variable.
 * 
 * Usage: POST /api/auth/admin-setup
 * Body: { "setupSecret": "your_setup_secret_here" }
 * 
 * Reads ADMIN_USERNAME and ADMIN_PASSWORD from env vars.
 */
const bcrypt = require('bcryptjs');
const { connectDB } = require('../_lib/db');
const User = require('../_lib/models/User');
const { handleCors } = require('../_lib/auth-middleware');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { setupSecret } = req.body;

    // Verify setup secret
    if (!setupSecret || setupSecret !== process.env.SETUP_SECRET) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح بالوصول'
      });
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return res.status(500).json({
        success: false,
        message: 'ADMIN_USERNAME and ADMIN_PASSWORD must be set in environment variables'
      });
    }

    await connectDB();

    // Hash the admin password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Upsert admin user
    const admin = await User.findOneAndUpdate(
      { role: 'admin' },
      {
        username: adminUsername.trim().toLowerCase(),
        password: hashedPassword,
        displayName: 'مدير النظام',
        role: 'admin'
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'تم إعداد حساب الأدمن بنجاح',
      admin: {
        id: admin._id,
        username: admin.username,
        displayName: admin.displayName
      }
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    return res.status(500).json({
      success: false,
      message: 'حصل مشكلة في إعداد الأدمن'
    });
  }
};
