/**
 * ╔═══════════════════════════════════════════════════╗
 * ║     RADIAN HRMS — FULL DEMO SEED SCRIPT          ║
 * ║   node seed.js   (run from /backend folder)       ║
 * ╚═══════════════════════════════════════════════════╝
 */
const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const User      = require('./models/User');
const Leave     = require('./models/Leave');
const Attendance= require('./models/Attendance');
const Job       = require('./models/Job');
const Candidate = require('./models/Candidate');
const Goal      = require('./models/Goal');
const Feedback  = require('./models/Feedback');
const Chat      = require('./models/Chat');
const LeaveBalance = require('./models/LeaveBalance');
const Payroll      = require('./models/Payroll');

// ── date helpers ─────────────────────────────────────
const daysAgo  = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const dateStr  = (n) => daysAgo(n).toISOString().split('T')[0];
const future   = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
const ci = (n, h, m = 0) => { const d = daysAgo(n); d.setHours(h, m, 0, 0); return d; };
const co = (n, h, m = 0) => { const d = daysAgo(n); d.setHours(h, m, 0, 0); return d; };
const TODAY = dateStr(0);

const USERS = [
  { name: 'Admin User',   email: 'admin@example.com',           password: 'admin123',    role: 'admin',    department: 'Management',      jobTitle: 'System Administrator', salary: 30000 },
  { name: 'Priya Mehta',  email: 'hr@radianmarketing.com',       password: 'hr123456',    role: 'hr',       department: 'Human Resources', jobTitle: 'HR Manager',            salary: 30000 },
  { name: 'Rahul Sharma', email: 'rahul@radianmarketing.com',    password: 'password123', role: 'manager',  department: 'Engineering',     jobTitle: 'Engineering Manager',   salary: 30000 },
  { name: 'Shivam Shah',  email: 'shivam@radianmarketing.com',   password: 'password123', role: 'employee', department: 'Marketing',       jobTitle: 'SEO Analyst',           salary: 30000 },
  { name: 'Vaibhav Raj',  email: 'vaibhav@radianmarketing.com',  password: 'password123', role: 'employee', department: 'Marketing',       jobTitle: 'Content Strategist',    salary: 30000 },
  { name: 'Amit Kumar',   email: 'amit@radianmarketing.com',     password: 'password123', role: 'employee', department: 'Engineering',     jobTitle: 'Backend Developer',     salary: 30000 },
  { name: 'Sneha Patel',  email: 'sneha@radianmarketing.com',    password: 'password123', role: 'employee', department: 'Design',          jobTitle: 'UI/UX Designer',        salary: 30000 },
  { name: 'Rohan Verma',  email: 'rohan@radianmarketing.com',    password: 'password123', role: 'employee', department: 'Sales',           jobTitle: 'Sales Executive',       salary: 30000 },
  { name: 'Kavya Nair',   email: 'kavya@radianmarketing.com',    password: 'password123', role: 'employee', department: 'Engineering',     jobTitle: 'Frontend Developer',    salary: 30000 },
  { name: 'Deepak Singh', email: 'deepak@radianmarketing.com',   password: 'password123', role: 'employee', department: 'Sales',           jobTitle: 'Sales Manager',         salary: 30000 },
];

async function seedAll() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('\n✅ MongoDB connected\n');

  // 1. Clear all collections
  console.log('🧹 Clearing previous data...');
  await Promise.all([
    User.deleteMany({}), Leave.deleteMany({}), Attendance.deleteMany({}),
    Job.deleteMany({}),  Candidate.deleteMany({}), Goal.deleteMany({}),
    Feedback.deleteMany({}), Chat.deleteMany({}), LeaveBalance.deleteMany({}),
    Payroll.deleteMany({}),
  ]);
  console.log('✅ All collections cleared\n');

  // 2. Create users
  console.log('👥 Creating 10 users...');
  const U = {};
  for (const u of USERS) {
    const doc = await User.create(u);
    U[u.email] = doc;
    console.log(`   ✅ ${u.role.padEnd(8)} ${u.name}`);
  }
  const [admin, hr, manager, shivam, vaibhav, amit, sneha, rohan, kavya, deepak]
    = Object.values(U);
  const employees = [shivam, vaibhav, amit, sneha, rohan, kavya, deepak];
  console.log('\n');

  // 3. Attendance — every weekday so far this month (so Payroll has real data to work with)
  const daysIntoMonth = new Date().getDate(); // e.g. 21 on 21 June → seeds June 1 through today
  console.log(`📅 Seeding attendance for the current month (${daysIntoMonth} days, weekdays only)...`);
  const attRecs = [];
  const allStaff = [...employees, manager, hr];
  for (let d = 0; d < daysIntoMonth; d++) {
    const dow = daysAgo(d).getDay(); // 0 = Sun, 6 = Sat
    if (dow === 0 || dow === 6) continue; // skip weekends — nobody clocks in on Sat/Sun
    for (const emp of allStaff) {
      const isAbsent = d !== 0 && Math.random() < 0.08; // ~8% absence rate, never "today"
      if (isAbsent) {
        attRecs.push({ employee: emp._id, date: dateStr(d), status: 'absent' });
        continue;
      }
      const inMin = Math.floor(Math.random() * 25);
      attRecs.push({
        employee: emp._id, date: dateStr(d), status: 'present',
        checkIn:  ci(d, 9, inMin),
        checkOut: d === 0 ? null : co(d, 18, Math.floor(Math.random() * 35)), // still "clocked in" today
      });
    }
  }
  // Rohan is on leave today
  const rohanIdx = attRecs.findIndex(a => a.employee.toString()===rohan._id.toString() && a.date===TODAY);
  if (rohanIdx !== -1) attRecs[rohanIdx].status = 'on-leave';
  await Attendance.insertMany(attRecs);
  console.log(`✅ ${attRecs.length} attendance records\n`);

  // 4. Leaves
  console.log('🏖️  Seeding leaves...');
  await Leave.create([
    { employee: rohan._id,   leaveType: 'casual', startDate: TODAY,         endDate: future(2),    reason: "Sister's wedding ceremony",                    status: 'approved', reviewedBy: hr._id,      reviewedAt: daysAgo(1), reviewNote: 'Approved! Enjoy the occasion.',          totalDays: 3, createdAt: daysAgo(3)  },
    { employee: shivam._id,  leaveType: 'sick',   startDate: dateStr(10),   endDate: dateStr(8),   reason: 'Viral fever and body pain',                    status: 'approved', reviewedBy: hr._id,      reviewedAt: daysAgo(11),reviewNote: 'Get well soon!',                         totalDays: 3, createdAt: daysAgo(12) },
    { employee: vaibhav._id, leaveType: 'earned', startDate: dateStr(20),   endDate: dateStr(16),  reason: 'Annual vacation — trip to Manali',             status: 'approved', reviewedBy: hr._id,      reviewedAt: daysAgo(22),reviewNote: 'Approved. Have a great trip!',           totalDays: 5, createdAt: daysAgo(23) },
    { employee: sneha._id,   leaveType: 'casual', startDate: dateStr(5),    endDate: dateStr(4),   reason: 'Personal work and home shifting',              status: 'approved', reviewedBy: manager._id, reviewedAt: daysAgo(6), reviewNote: 'Approved.',                             totalDays: 2, createdAt: daysAgo(7)  },
    { employee: kavya._id,   leaveType: 'sick',   startDate: dateStr(15),   endDate: dateStr(14),  reason: 'Migraine and severe headache',                 status: 'approved', reviewedBy: hr._id,      reviewedAt: daysAgo(16),reviewNote: 'Please rest and recover.',               totalDays: 2, createdAt: daysAgo(16) },
    { employee: amit._id,    leaveType: 'casual', startDate: future(3),     endDate: future(5),    reason: 'Attending DevSummit 2026 conference in Bangalore', status: 'pending', totalDays: 3, createdAt: daysAgo(1) },
    { employee: deepak._id,  leaveType: 'earned', startDate: future(7),     endDate: future(10),   reason: 'Family vacation to Goa — planned months ahead',    status: 'pending', totalDays: 4, createdAt: daysAgo(2) },
    { employee: vaibhav._id, leaveType: 'sick',   startDate: future(1),     endDate: future(2),    reason: 'Dental surgery — appointment confirmed',            status: 'pending', totalDays: 2, createdAt: daysAgo(0) },
    { employee: amit._id,    leaveType: 'casual', startDate: dateStr(30),   endDate: dateStr(1),   reason: 'Long vacation',                               status: 'rejected', reviewedBy: hr._id,      reviewedAt: daysAgo(32),reviewNote: '30 days is too long. Team bandwidth is low.', totalDays: 30, createdAt: daysAgo(33) },
    { employee: deepak._id,  leaveType: 'casual', startDate: dateStr(8),    endDate: dateStr(6),   reason: 'Personal errands',                            status: 'rejected', reviewedBy: manager._id, reviewedAt: daysAgo(9), reviewNote: 'Critical client delivery this week.',   totalDays: 3, createdAt: daysAgo(10) },
  ]);
  console.log('✅ 10 leaves (5 approved, 3 pending, 2 rejected)\n');

  // 5. Jobs
  console.log('💼 Seeding job postings...');
  const [j1, j2, j3, j4, j5] = await Job.create([
    { title: 'Senior React Developer',       department: 'Engineering',     description: 'We need a Senior React Developer with 3+ years experience building scalable SPAs. Will work with product team on core features.', requiredSkills: ['React','TypeScript','Node.js','REST APIs','Git'],                 location: 'Mumbai (Hybrid)',      status: 'open',   createdBy: hr._id, createdAt: daysAgo(15) },
    { title: 'Digital Marketing Manager',    department: 'Marketing',       description: 'Lead SEO, paid campaigns and content strategy. Strong analytics background required.',                                           requiredSkills: ['SEO','Google Ads','Meta Ads','Analytics','Content Strategy'],  location: 'Ahmedabad (On-site)',  status: 'open',   createdBy: hr._id, createdAt: daysAgo(10) },
    { title: 'UI/UX Designer',               department: 'Design',          description: 'Own the full design process from wireframing to final handoff for our SaaS products.',                                           requiredSkills: ['Figma','Adobe XD','User Research','Prototyping'],               location: 'Remote',               status: 'open',   createdBy: manager._id, createdAt: daysAgo(8)  },
    { title: 'Business Development Executive',department: 'Sales',          description: 'Drive B2B revenue growth — identify opportunities, build pipeline, close deals.',                                                requiredSkills: ['B2B Sales','CRM','Negotiation','Lead Generation'],              location: 'Delhi (On-site)',      status: 'open',   createdBy: hr._id, createdAt: daysAgo(5)  },
    { title: 'DevOps Engineer',              department: 'Engineering',     description: 'Manage CI/CD pipelines, AWS infrastructure and container deployments.',                                                           requiredSkills: ['AWS','Docker','Kubernetes','CI/CD','Linux','Terraform'],         location: 'Mumbai (Hybrid)',      status: 'open',   createdBy: manager._id, createdAt: daysAgo(3)  },
    { title: 'Junior PHP Developer',         department: 'Engineering',     description: 'Filled last month.',                                                                                                              requiredSkills: ['PHP','MySQL','Laravel'],                                         location: 'Ahmedabad',            status: 'closed', createdBy: hr._id, createdAt: daysAgo(45) },
  ]);
  console.log('✅ 6 jobs (5 open, 1 closed)\n');

  // 6. Candidates
  console.log('🧑‍💼 Seeding 14 candidates...');
  await Candidate.create([
    { name: 'Arjun Mehta',    email: 'arjun.mehta@gmail.com',    phone: '9876543210', appliedJob: j1._id, status: 'Applied',   notes: 'Strong portfolio, 4 years exp',          addedBy: hr._id, createdAt: daysAgo(12) },
    { name: 'Pooja Iyer',     email: 'pooja.iyer@gmail.com',     phone: '9876543211', appliedJob: j1._id, status: 'Screening', notes: 'Phone screen done, good communication',  addedBy: hr._id, createdAt: daysAgo(10) },
    { name: 'Vikram Sinha',   email: 'vikram.sinha@gmail.com',   phone: '9876543212', appliedJob: j1._id, status: 'Interview', notes: 'Technical round scheduled next week',     addedBy: hr._id, createdAt: daysAgo(8)  },
    { name: 'Anjali Gupta',   email: 'anjali.gupta@gmail.com',   phone: '9876543213', appliedJob: j1._id, status: 'Selected',  notes: 'Excellent candidate — offer letter sent', addedBy: hr._id, createdAt: daysAgo(6)  },
    { name: 'Manish Tiwari',  email: 'manish.tiwari@gmail.com',  phone: '9876543214', appliedJob: j1._id, status: 'Rejected',  notes: "Experience doesn't match",               addedBy: hr._id, createdAt: daysAgo(14) },
    { name: 'Riya Desai',     email: 'riya.desai@gmail.com',     phone: '9876543215', appliedJob: j2._id, status: 'Applied',   notes: '3 years in digital marketing',           addedBy: hr._id, createdAt: daysAgo(9)  },
    { name: 'Karan Malhotra', email: 'karan.malhotra@gmail.com', phone: '9876543216', appliedJob: j2._id, status: 'Screening', notes: 'Good LinkedIn, awaiting resume',          addedBy: hr._id, createdAt: daysAgo(7)  },
    { name: 'Divya Kapoor',   email: 'divya.kapoor@gmail.com',   phone: '9876543217', appliedJob: j2._id, status: 'Interview', notes: 'Final round with CMO tomorrow',           addedBy: hr._id, createdAt: daysAgo(5)  },
    { name: 'Rahul Mishra',   email: 'rahul.mishra@gmail.com',   phone: '9876543218', appliedJob: j3._id, status: 'Applied',   notes: 'Dribbble portfolio shared',               addedBy: hr._id, createdAt: daysAgo(6)  },
    { name: 'Sonia Bhatia',   email: 'sonia.bhatia@gmail.com',   phone: '9876543219', appliedJob: j3._id, status: 'Screening', notes: 'Design task assigned',                    addedBy: hr._id, createdAt: daysAgo(4)  },
    { name: 'Nitin Rao',      email: 'nitin.rao@gmail.com',      phone: '9876543220', appliedJob: j4._id, status: 'Applied',   notes: 'Referral from Deepak',                    addedBy: hr._id, createdAt: daysAgo(4)  },
    { name: 'Preeti Joshi',   email: 'preeti.joshi@gmail.com',   phone: '9876543221', appliedJob: j4._id, status: 'Interview', notes: 'Very confident communicator',             addedBy: hr._id, createdAt: daysAgo(2)  },
    { name: 'Suresh Kumar',   email: 'suresh.kumar@gmail.com',   phone: '9876543222', appliedJob: j5._id, status: 'Applied',   notes: 'AWS certified, 2 years exp',              addedBy: hr._id, createdAt: daysAgo(2)  },
    { name: 'Aisha Khan',     email: 'aisha.khan@gmail.com',     phone: '9876543223', appliedJob: j5._id, status: 'Rejected',  notes: 'No Kubernetes experience',                addedBy: hr._id, createdAt: daysAgo(3)  },
  ]);
  console.log('✅ 14 candidates (all 5 stages populated)\n');

  // 7. Goals
  console.log('🎯 Seeding goals...');
  const goals = await Goal.create([
    { title: 'Redesign Company Website Landing Page',     description: 'Full redesign with new brand guidelines',                   assignedTo: sneha._id,  assignedBy: manager._id, deadline: daysAgo(5),   priority: 'high',   status: 'completed',   progress: 100, createdAt: daysAgo(30) },
    { title: 'Improve Page Speed to 90+ Lighthouse Score',description: 'Optimize images, CSS, JS bundles',                          assignedTo: kavya._id,  assignedBy: manager._id, deadline: daysAgo(3),   priority: 'high',   status: 'completed',   progress: 100, createdAt: daysAgo(25) },
    { title: 'Complete Q1 SEO Audit Report',              description: 'Full technical and content SEO audit — 50 pages',           assignedTo: shivam._id, assignedBy: hr._id,      deadline: daysAgo(10),  priority: 'medium', status: 'completed',   progress: 100, createdAt: daysAgo(35) },
    { title: 'Migrate Analytics to Google Analytics 4',   description: 'Migrate from UA to GA4, configure all conversions',         assignedTo: vaibhav._id,assignedBy: hr._id,      deadline: daysAgo(15),  priority: 'medium', status: 'completed',   progress: 100, createdAt: daysAgo(40) },
    { title: 'Close 10 New B2B Accounts This Quarter',    description: 'Identify, pitch and close 10 enterprise accounts',          assignedTo: deepak._id, assignedBy: manager._id, deadline: daysAgo(2),   priority: 'high',   status: 'completed',   progress: 100, createdAt: daysAgo(60) },
    { title: 'Build REST API for Inventory Module',        description: 'Full CRUD API with auth middleware for inventory',          assignedTo: amit._id,   assignedBy: manager._id, deadline: future(10),   priority: 'high',   status: 'in_progress', progress: 65,  createdAt: daysAgo(20) },
    { title: 'Publish 20 Long-Form Blog Articles',         description: 'SEO-optimised 2000+ word articles for company blog',        assignedTo: vaibhav._id,assignedBy: hr._id,      deadline: future(15),   priority: 'medium', status: 'in_progress', progress: 50,  createdAt: daysAgo(18) },
    { title: 'Implement Dark Mode Across All App Pages',   description: 'Dark mode toggle with localStorage persistence',            assignedTo: kavya._id,  assignedBy: manager._id, deadline: future(7),    priority: 'medium', status: 'in_progress', progress: 80,  createdAt: daysAgo(14) },
    { title: 'Develop Client Onboarding Presentation',    description: 'Comprehensive deck for new client onboarding sessions',     assignedTo: rohan._id,  assignedBy: manager._id, deadline: future(5),    priority: 'low',    status: 'in_progress', progress: 40,  createdAt: daysAgo(10) },
    { title: 'Redesign Mobile App UI — Figma Prototype',  description: 'High-fidelity prototype for new mobile app',               assignedTo: sneha._id,  assignedBy: manager._id, deadline: future(20),   priority: 'high',   status: 'in_progress', progress: 35,  createdAt: daysAgo(8)  },
    { title: 'Schedule Q2 Performance Reviews for Team',  description: 'Organise and conduct reviews for all 7 employees',         assignedTo: shivam._id, assignedBy: hr._id,      deadline: future(30),   priority: 'medium', status: 'pending',     progress: 0,   createdAt: daysAgo(2)  },
    { title: 'Set Up CI/CD Pipeline with GitHub Actions', description: 'Automate build, test, deploy workflow',                    assignedTo: amit._id,   assignedBy: manager._id, deadline: future(25),   priority: 'high',   status: 'pending',     progress: 0,   createdAt: daysAgo(1)  },
    { title: 'Launch Instagram 30-Day Growth Campaign',   description: 'Plan and run a 30-day Instagram content growth campaign',   assignedTo: vaibhav._id,assignedBy: hr._id,      deadline: future(35),   priority: 'low',    status: 'pending',     progress: 0,   createdAt: daysAgo(0)  },
  ]);
  console.log(`✅ ${goals.length} goals (5 completed, 5 in-progress, 3 pending)\n`);

  // 8. Feedback
  console.log('⭐ Seeding feedback...');
  await Feedback.create([
    { employee: sneha._id,  givenBy: manager._id, feedbackText: 'Outstanding work on the landing page redesign. Delivered ahead of schedule with excellent attention to detail.', rating: 5, createdAt: daysAgo(4) },
    { employee: kavya._id,  givenBy: manager._id, feedbackText: 'Page speed optimization showed strong problem-solving skills. Lighthouse score went from 62 to 94. Excellent!',  rating: 5, createdAt: daysAgo(2) },
    { employee: shivam._id, givenBy: hr._id,      feedbackText: 'SEO audit was thorough and well-documented. Recommendations are actionable. Good job overall.',                 rating: 4, createdAt: daysAgo(9) },
    { employee: vaibhav._id,givenBy: hr._id,      feedbackText: 'GA4 migration was smooth. Would appreciate faster communication during projects. Otherwise solid.',              rating: 4, createdAt: daysAgo(14) },
    { employee: deepak._id, givenBy: manager._id, feedbackText: 'Exceptional performance this quarter! Exceeded the 10-account sales target by 20%. Very impressive work.',      rating: 5, createdAt: daysAgo(1) },
    { employee: amit._id,   givenBy: manager._id, feedbackText: 'Good API code quality. Need improvement on estimated delivery timelines — communicate blockers earlier.',       rating: 3, createdAt: daysAgo(5) },
    { employee: rohan._id,  givenBy: manager._id, feedbackText: 'Onboarding deck is looking professional. Ensure CMO reviews before sharing with clients.',                      rating: 4, createdAt: daysAgo(3) },
  ]);
  console.log('✅ 7 feedback records (avg ~4.3 stars)\n');

  // 9. Chat messages
  console.log('💬 Seeding chat conversations...');
  const tk = (a, b) => [a._id.toString(), b._id.toString()].sort().join('_');

  await Chat.create([
    // Amit ↔ HR — leave query
    { sender: amit._id,    receiver: hr._id,      message: 'Hi Priya, I wanted to check if my casual leave for DevSummit conference has been reviewed?',              thread: tk(amit, hr),       createdAt: daysAgo(1) },
    { sender: hr._id,      receiver: amit._id,    message: "Hi Amit! It's under review. Rahul needs to approve it first since it involves sprint timelines. Expect a decision by EOD.", thread: tk(amit, hr), createdAt: daysAgo(1) },
    { sender: amit._id,    receiver: hr._id,      message: 'Understood, thank you Priya!',                                                                            thread: tk(amit, hr),       createdAt: daysAgo(1) },
    // Shivam ↔ HR — leave policy
    { sender: shivam._id,  receiver: hr._id,      message: 'Hello, how many casual leaves are we entitled to per quarter?',                                           thread: tk(shivam, hr),     createdAt: daysAgo(3) },
    { sender: hr._id,      receiver: shivam._id,  message: 'Hi Shivam! 6 casual leaves per quarter. You currently have 4 remaining for Q2.',                         thread: tk(shivam, hr),     createdAt: daysAgo(3) },
    { sender: shivam._id,  receiver: hr._id,      message: 'Thanks! Can unused leaves carry forward to Q3?',                                                          thread: tk(shivam, hr),     createdAt: daysAgo(2) },
    { sender: hr._id,      receiver: shivam._id,  message: 'Yes! Up to 3 casual leaves can carry forward. Sick leaves do not carry forward as per company policy.',   thread: tk(shivam, hr),     createdAt: daysAgo(2) },
    // Sneha ↔ Manager — goal update
    { sender: sneha._id,   receiver: manager._id, message: 'Hi Rahul, mobile app prototype is going well — first 10 screens ready by Thursday.',                     thread: tk(sneha, manager), createdAt: daysAgo(1) },
    { sender: manager._id, receiver: sneha._id,   message: 'Great! Align with Kavya on the color system before finalizing. Looking forward to Thursday review.',      thread: tk(sneha, manager), createdAt: daysAgo(1) },
    // Vaibhav ↔ HR — leave status
    { sender: vaibhav._id, receiver: hr._id,      message: 'Hi, applied for 2 days sick leave for dental surgery tomorrow — is it approved?',                         thread: tk(vaibhav, hr),    createdAt: daysAgo(0) },
    { sender: hr._id,      receiver: vaibhav._id, message: "Hi Vaibhav! I can see the request. I'll process it within the hour. Hope the surgery goes well!",         thread: tk(vaibhav, hr),    createdAt: daysAgo(0) },
  ]);
  console.log('✅ 11 chat messages across 4 conversations\n');

  // ── Seed LeaveBalance for 2026 ────────────────────────────
  console.log('💰 Seeding leave balances for 2026...');
  const balanceUsers = Object.values(U).filter(u => ['employee', 'manager', 'hr'].includes(u.role));
  for (const emp of balanceUsers) {
    await LeaveBalance.create({ employee: emp._id, year: 2026, casual: 12, sick: 10, earned: 15, other: 5 });
    console.log(`   ✅ Balance for ${emp.name}`);
  }
  console.log('');

  // ── Final summary ──────────────────────────────────────────
  console.log('══════════════════════════════════════════════════════');
  console.log('🎉  DEMO SEED COMPLETE — Your HRMS is ready!');
  console.log('══════════════════════════════════════════════════════\n');
  console.log('📊  DATA SEEDED:');
  console.log(`     👥  Users       : 10  (admin, hr, manager, 7 employees)`);
  console.log(`     📅  Attendance  : ${attRecs.length}  records across ${daysIntoMonth} days (this month, weekdays)`);
  console.log(`     🏖️   Leaves      : 10  (5 approved · 3 pending · 2 rejected)`);
  console.log(`     💼  Jobs        :  6  (5 open · 1 closed)`);
  console.log(`     🧑   Candidates : 14  (all 5 pipeline stages)`);
  console.log(`     🎯  Goals       : 13  (5 completed · 5 in-progress · 3 pending)`);
  console.log(`     ⭐  Feedback    :  7  (avg rating 4.3 / 5)`);
  console.log(`     💬  Chat msgs   : 11  (4 conversations)\n`);
  console.log('🔑  LOGIN CREDENTIALS:');
  console.log('──────────────────────────────────────────────────────');
  console.log('  Admin    admin@example.com              admin123');
  console.log('  HR       hr@radianmarketing.com         hr123456');
  console.log('  Manager  rahul@radianmarketing.com      password123');
  console.log('  Emp 1    shivam@radianmarketing.com     password123');
  console.log('  Emp 2    vaibhav@radianmarketing.com    password123');
  console.log('  Emp 3    amit@radianmarketing.com       password123');
  console.log('  Emp 4    sneha@radianmarketing.com      password123');
  console.log('  Emp 5    rohan@radianmarketing.com      password123');
  console.log('──────────────────────────────────────────────────────\n');
  console.log('▶   Start backend : npm run dev  (in /backend)');
  console.log('▶   Start frontend: npm run dev  (in /frontend)');
  console.log('▶   Open browser  : http://localhost:5173\n');
  process.exit(0);
}

seedAll().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
