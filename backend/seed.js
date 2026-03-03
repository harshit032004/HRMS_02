const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Create admin/HR account
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      department: 'Management',
      jobTitle: 'System Administrator',
    });
    console.log(`✅ Admin created: ${admin.email} / admin123`);

    // Create HR user
    const hr = await User.create({
      name: 'HR Manager',
      email: 'hr@radianmarketing.com',
      password: 'hr123456',
      role: 'hr',
      department: 'HR',
      jobTitle: 'HR Manager',
    });
    console.log(`✅ HR created: ${hr.email} / hr123456`);

    // Create sample employees (matching screenshot)
    const employees = [
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

    for (const empData of employees) {
      const emp = await User.create(empData);
      console.log(`✅ Employee created: ${emp.email} / password123`);
    }

    console.log('\n🎉 Seed completed! Login credentials:');
    console.log('────────────────────────────────────');
    console.log('Admin:    admin@example.com      / admin123');
    console.log('HR:       hr@radianmarketing.com  / hr123456');
    console.log('Employee: shivam@radianmarketing.com / password123');
    console.log('────────────────────────────────────');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seedData();
