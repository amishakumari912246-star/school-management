const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = header.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ message: 'JWT secret is not configured' });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return next();
};

module.exports = { authenticateToken, authorizeRoles };
