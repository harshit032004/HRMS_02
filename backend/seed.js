const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Leave = require('./models/Leave');
const Attendance = require('./models/Attendance');

const userData = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    department: 'Management',
    jobTitle: 'System Administrator',
  },
  {
    name: 'HR Manager',
    email: 'hr@radianmarketing.com',
    password: 'hr123456',
    role: 'hr',
    department: 'HR',
    jobTitle: 'HR Manager',
  },
  {
    name: 'Shivam Shah',
    email: 'shivam@radianmarketing.com',
    password: 'password123',
    role: 'employee',
    department: 'Marketing',
    jobTitle: 'SEO Analyst',
  },
  {
    name: 'Vaibhav Raj',
    email: 'vaibhav@radianmarketing.com',
    password: 'password123',
    role: 'employee',
    department: 'Marketing',
    jobTitle: 'Content Strategist',
  },
  {
    name: 'Amit Kumar',
    email: 'amit@radianmarketing.com',
    password: 'password123',
    role: 'employee',
    department: 'Marketing',
    jobTitle: 'Marketing Specialist',
  },
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Upsert all users (update if exists, create if not)
    // This preserves IDs for existing users
    const userDocs = {};
    for (const u of userData) {
      let existing = await User.findOne({ email: u.email });
      if (existing) {
        existing.name = u.name;
        existing.role = u.role;
        existing.department = u.department;
        existing.jobTitle = u.jobTitle;
        existing.isActive = true;
        existing.password = u.password;
        await existing.save();
        userDocs[u.email] = existing;
        console.log(`🔄 Updated: ${u.email} (ID: ${existing._id})`);
      } else {
        const created = await User.create(u);
        userDocs[u.email] = created;
        console.log(`✅ Created: ${u.email} (ID: ${created._id})`);
      }
    }

    // Step 2: Get all current valid user IDs
    const allUsers = await User.find({}).select('_id');
    const validIds = new Set(allUsers.map(u => u._id.toString()));

    // Step 3: Delete orphaned leave records (employee ID not in valid users)
    const allLeaves = await Leave.find({});
    let deletedLeaves = 0;
    for (const leave of allLeaves) {
      const empId = leave.employee?.toString();
      if (!empId || !validIds.has(empId)) {
        await leave.deleteOne();
        deletedLeaves++;
      }
    }
    console.log(`🗑️  Removed ${deletedLeaves} orphaned leave records`);

    // Step 4: Delete orphaned attendance records
    const allAttendance = await Attendance.find({});
    let deletedAtt = 0;
    for (const att of allAttendance) {
      const empId = att.employee?.toString();
      if (!empId || !validIds.has(empId)) {
        await att.deleteOne();
        deletedAtt++;
      }
    }
    console.log(`🗑️  Removed ${deletedAtt} orphaned attendance records`);

    // Step 5: Create fresh sample leave data with correct user IDs
    const shivam = userDocs['shivam@radianmarketing.com'];
    const vaibhav = userDocs['vaibhav@radianmarketing.com'];
    const amit = userDocs['amit@radianmarketing.com'];
    const hr = userDocs['hr@radianmarketing.com'];

    // Only seed sample leaves if there are no leaves left in DB
    const remainingLeaves = await Leave.countDocuments();
    if (remainingLeaves === 0) {
      console.log('📋 Seeding sample leave data...');
      await Leave.create([
        {
          employee: shivam._id,
          leaveType: 'sick',
          startDate: '2026-03-20',
          endDate: '2026-03-31',
          reason: 'Sick leave',
          status: 'approved',
          reviewedBy: hr._id,
          reviewedAt: new Date(),
          reviewNote: 'Get well soon',
          totalDays: 12,
        },
        {
          employee: vaibhav._id,
          leaveType: 'casual',
          startDate: '2026-03-03',
          endDate: '2026-03-30',
          reason: 'Vacation',
          status: 'approved',
          reviewedBy: hr._id,
          reviewedAt: new Date(),
          reviewNote: '',
          totalDays: 28,
        },
        {
          employee: amit._id,
          leaveType: 'casual',
          startDate: '2026-03-03',
          endDate: '2026-04-03',
          reason: 'Vacation',
          status: 'rejected',
          reviewedBy: hr._id,
          reviewedAt: new Date(),
          reviewNote: 'Too long',
          totalDays: 32,
        },
        {
          employee: shivam._id,
          leaveType: 'sick',
          startDate: '2026-03-24',
          endDate: '2026-03-31',
          reason: 'Dengue',
          status: 'approved',
          reviewedBy: hr._id,
          reviewedAt: new Date(),
          reviewNote: 'Take care',
          totalDays: 8,
        },
        {
          employee: vaibhav._id,
          leaveType: 'casual',
          startDate: '2026-03-24',
          endDate: '2026-03-26',
          reason: 'Break',
          status: 'pending',
          totalDays: 3,
        },
      ]);
      console.log('✅ Sample leave data seeded');
    } else {
      console.log(`✅ ${remainingLeaves} valid leave records kept`);
    }

    console.log('\n🎉 Seed complete! Login credentials:');
    console.log('────────────────────────────────────────────');
    console.log('Admin:    admin@example.com           / admin123');
    console.log('HR:       hr@radianmarketing.com      / hr123456');
    console.log('Employee: shivam@radianmarketing.com  / password123');
    console.log('Employee: vaibhav@radianmarketing.com / password123');
    console.log('Employee: amit@radianmarketing.com    / password123');
    console.log('────────────────────────────────────────────');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seedData();
