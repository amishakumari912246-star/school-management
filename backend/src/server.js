const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { authenticateToken, authorizeRoles } = require('./middleware/auth.middleware');
const db = require('./utils/jsonDb');

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const studentRoutes = require('./routes/student.routes');
const teacherRoutes = require('./routes/teacher.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const feeRoutes = require('./routes/fee.routes');
const examRoutes = require('./routes/exam.routes');
const resultRoutes = require('./routes/result.routes');
const admitCardRoutes = require('./routes/admitcard.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'School backend is running (JSON storage)' });
});

app.use('/api/auth', authRoutes);

app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/students', authenticateToken, authorizeRoles('Admin', 'Teacher'), studentRoutes);
app.use('/api/teachers', authenticateToken, authorizeRoles('Admin'), teacherRoutes);
app.use('/api/attendance', authenticateToken, authorizeRoles('Admin', 'Teacher'), attendanceRoutes);
app.use('/api/fees', authenticateToken, authorizeRoles('Admin', 'Accountant'), feeRoutes);
app.use('/api/exams', authenticateToken, authorizeRoles('Admin', 'Teacher'), examRoutes);
app.use('/api/results', authenticateToken, authorizeRoles('Admin', 'Teacher'), resultRoutes);
app.use('/api/admitcards', authenticateToken, authorizeRoles('Admin', 'Teacher'), admitCardRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const seedDefaultAdmin = async () => {
  const users = db.read('users');
  const adminExists = users.find((u) => u.email === 'admin@school.com' && u.role === 'Admin');
  if (!adminExists) {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    db.create('users', {
      name: 'System Admin',
      email: 'admin@school.com',
      passwordHash,
      role: 'Admin'
    });
    console.log('Default admin seeded: admin@school.com / Admin@123');
  }
};

app.listen(PORT, async () => {
  await seedDefaultAdmin();
  console.log(`Backend running on port ${PORT} (JSON file storage)`);
});
