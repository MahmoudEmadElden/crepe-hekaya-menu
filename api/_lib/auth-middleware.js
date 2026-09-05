/**
 * JWT Authentication Middleware — Crepe Hekaya
 * Verifies JWT token from Authorization header and attaches user info to request.
 */
const jwt = require('jsonwebtoken');

/**
 * Verify JWT token and return decoded user data.
 * @param {string} authHeader - The Authorization header value (e.g., "Bearer <token>")
 * @returns {{ userId: string, username: string, role: string }} Decoded user data
 * @throws {Error} If token is missing, invalid, or expired
 */
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('يجب تسجيل الدخول أولاً');
    err.statusCode = 401;
    throw err;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    const err = new Error('يجب تسجيل الدخول أولاً');
    err.statusCode = 401;
    throw err;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (jwtError) {
    const err = new Error('انتهت صلاحية الجلسة. سجل دخول مرة تانية.');
    err.statusCode = 401;
    throw err;
  }
}

/**
 * Require a specific role.
 * @param {object} user - Decoded JWT user data
 * @param {string} requiredRole - The required role (e.g., 'admin')
 * @throws {Error} If user doesn't have the required role
 */
function requireRole(user, requiredRole) {
  if (user.role !== requiredRole) {
    const err = new Error('غير مصرح لك بالوصول');
    err.statusCode = 403;
    throw err;
  }
}

/**
 * Standard CORS headers for API responses.
 */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Handle OPTIONS preflight requests.
 * @returns {boolean} true if this was an OPTIONS request (already handled)
 */
function handleCors(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

module.exports = { verifyToken, requireRole, setCorsHeaders, handleCors };
