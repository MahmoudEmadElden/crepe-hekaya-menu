/**
 * JWT Authentication Middleware — Hesham Fouad
 * Verifies JWT token from Authorization header.
 * CORS is restricted to the configured allowed origins instead of wildcard '*'.
 */
const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    const err = new Error('JWT_SECRET environment variable is not set');
    err.statusCode = 500;
    throw err;
  }
  return secret;
}

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Authentication required');
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
    const decoded = jwt.verify(token, getJwtSecret());
    return decoded;
  } catch (jwtError) {
    const err = new Error('انتهت صلاحية الجلسة. سجل دخول مرة تانية.');
    err.statusCode = 401;
    throw err;
  }
}

function requireRole(user, requiredRole) {
  if (user.role !== requiredRole && user.role !== 'admin') {
    const err = new Error('غير مصرح لك بالوصول');
    err.statusCode = 403;
    throw err;
  }
}

function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw || raw.trim() === '') {
    return [];
  }
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function isOriginAllowed(origin) {
  if (!origin) return true;
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) return true;
  return allowed.includes(origin);
}

function setCorsHeaders(res, reqOrigin) {
  const allowedOrigins = getAllowedOrigins();
  
  if (reqOrigin && isOriginAllowed(reqOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', reqOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!reqOrigin) {
    // Same-origin or no-origin request (e.g., server-to-server, curl)
    // Don't set Access-Control-Allow-Origin to avoid wildcard with credentials
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // Origin not allowed - don't set CORS headers (will block the request)
    // But still allow the request to proceed for non-browser clients
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function handleCors(req, res) {
  const reqOrigin = req.headers.origin || '';
  setCorsHeaders(res, reqOrigin);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

module.exports = { verifyToken, requireRole, setCorsHeaders, handleCors };