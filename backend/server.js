const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

// Ensure upload directories exist (multer throws 500 if they are missing)
['uploads/avatars', 'uploads/documents'].forEach(dir =>
  fs.mkdirSync(path.join(__dirname, dir), { recursive: true })
);

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Serve uploaded files statically (avatars + documents)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/employees',     require('./routes/employees'));
app.use('/api/attendance',    require('./routes/attendance'));
app.use('/api/leaves',        require('./routes/leaves'));
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/jobs',          require('./routes/jobs'));
app.use('/api/candidates',    require('./routes/candidates'));
app.use('/api/goals',         require('./routes/goals'));
app.use('/api/feedback',      require('./routes/feedback'));
app.use('/api/reviews',       require('./routes/reviews'));
app.use('/api/chat',          require('./routes/chat'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/payroll',      require('./routes/payroll'));
app.use('/api',              require('./routes/documents'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });

module.exports = app;
