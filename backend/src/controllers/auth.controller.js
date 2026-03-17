const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/jsonDb');

const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password, and role are required' });
  }

  const users = db.read('users');
  const user = users.find(
    (u) => u.email === String(email).toLowerCase() && u.role === role
  );

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT secret is not configured' });
  }

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  return res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
};

const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required' });
  }

  const users = db.read('users');
  const existing = users.find(
    (u) => u.email === String(email).toLowerCase() && u.role === role
  );
  if (existing) {
    return res.status(409).json({ message: 'User already exists for this role' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = db.create('users', {
    name,
    email: String(email).toLowerCase(),
    passwordHash,
    role
  });

  return res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
};

module.exports = { login, register };
