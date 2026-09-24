require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User");
const Course = require("../src/models/Course");
const Job = require("../src/models/Job");
const Institute = require("../src/models/Institute");
const EmployerDemandSignal = require("../src/models/EmployerDemandSignal");

const sampleInstitutes = [
  {
    name: "Kerala Institute of Technology & Advanced Skills",
    state: "Kerala",
    district: "Ernakulam",
    address: "Kochi Infopark Road, Kakkanad, Ernakulam - 682030",
    languages: ["English", "Malayalam", "Hindi"],
    totalTrainers: 28,
    numberOfEmployees: 62,
    skillsCovered: ["Python", "Machine Learning", "FastAPI", "React", "Docker", "SQL", "Cybersecurity", "Data Analysis"],
    contactEmail: "contact@kitas.kerala.gov.in",
    contactPhone: "+91 484 2901122",
    loginEmail: "institute@kitas.kerala.gov.in",
    password: "Institute@123",
  },
  {
    name: "Karnataka Skill Development Center",
    state: "Karnataka",
    district: "Bengaluru Urban",
    address: "Outer Ring Road, Marathahalli, Bengaluru - 560037",
    languages: ["English", "Kannada", "Hindi"],
    totalTrainers: 45,
    numberOfEmployees: 90,
    skillsCovered: ["AWS", "Node.js", "Kubernetes", "DevOps", "Java", "Spring Boot", "React", "AI Prompt Engineering"],
    contactEmail: "admissions@ksdc.kar.gov.in",
    contactPhone: "+91 80 25549001",
    loginEmail: "institute@ksdc.kar.gov.in",
    password: "Institute@123",
  },
  {
    name: "Tamil Nadu Skill Development Corporation (TNSDC) Hub",
    state: "Tamil Nadu",
    district: "Chennai",
    address: "Guindy Industrial Estate, Chennai - 600032",
    languages: ["English", "Tamil", "Hindi"],
    totalTrainers: 36,
    numberOfEmployees: 74,
    skillsCovered: ["Data Science", "Python", "Power BI", "SQL", "Cloud Computing", "Flutter", "Embedded Systems"],
    contactEmail: "info@tnsdc.tn.gov.in",
    contactPhone: "+91 44 22501234",
    loginEmail: "institute@tnsdc.tn.gov.in",
    password: "Institute@123",
  },
  {
    name: "Maharashtra Vocational Training Academy",
    state: "Maharashtra",
    district: "Pune",
    address: "Shivaji Nagar, Pune - 411005",
    languages: ["English", "Marathi", "Hindi"],
    totalTrainers: 32,
    numberOfEmployees: 58,
    skillsCovered: ["Full Stack Development", "React", "MongoDB", "Java", "Automotive CAD", "Agile", "TypeScript"],
    contactEmail: "desk@mvta.mah.gov.in",
    contactPhone: "+91 20 25678900",
    loginEmail: "institute@mvta.mah.gov.in",
    password: "Institute@123",
  },
];

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI not found");
    process.exit(1);
  }

  console.log("🔗 Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected");

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Institute@123", salt);

  // 1. Seed or update institutes and user accounts
  for (const instData of sampleInstitutes) {
    let user = await User.findOne({ email: instData.loginEmail });
    if (!user) {
      user = await User.create({
        name: instData.name,
        email: instData.loginEmail,
        passwordHash,
        role: "institute",
        organization: instData.name,
        primaryState: instData.state,
      });
      console.log(`✅ Created user account: ${instData.loginEmail}`);
    } else {
      user.role = "institute";
      user.primaryState = instData.state;
      await user.save();
    }

    let institute = await Institute.findOne({ contactEmail: instData.contactEmail });
    if (!institute) {
      institute = await Institute.create({
        name: instData.name,
        state: instData.state,
        district: instData.district,
        address: instData.address,
        languages: instData.languages,
        totalTrainers: instData.totalTrainers,
        numberOfEmployees: instData.numberOfEmployees,
        skillsCovered: instData.skillsCovered,
        contactEmail: instData.contactEmail,
        contactPhone: instData.contactPhone,
        userId: user._id,
      });
      console.log(`✅ Created Institute: ${instData.name}`);
    } else {
      institute.userId = user._id;
      institute.state = instData.state;
      institute.district = instData.district;
      institute.skillsCovered = instData.skillsCovered;
      institute.languages = instData.languages;
      if (!institute.numberOfEmployees) {
        institute.numberOfEmployees = instData.numberOfEmployees;
      }
      await institute.save();
    }

    user.instituteId = institute._id;
    await user.save();
  }

  // 2. Update existing courses with states and delivery modes if missing
  const institutes = await Institute.find();
  const courses = await Course.find();
  const states = ["Kerala", "Karnataka", "Tamil Nadu", "Maharashtra"];
  const districts = {
    Kerala: ["Ernakulam", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
    Karnataka: ["Bengaluru Urban", "Mysuru", "Dakshina Kannada"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
    Maharashtra: ["Pune", "Mumbai City", "Nagpur"],
  };
  const deliveryModes = ["Online", "Offline", "Hybrid"];

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const targetState = course.state || states[i % states.length];
    const targetDistricts = districts[targetState] || ["Central"];
    const targetDistrict = course.district || targetDistricts[i % targetDistricts.length];
    const targetMode = course.deliveryMode || deliveryModes[i % deliveryModes.length];
    
    // Pick matching institute if possible
    const matchingInst = institutes.find((inst) => inst.state === targetState) || institutes[0];

    course.state = targetState;
    course.district = targetDistrict;
    course.deliveryMode = targetMode;
    if (matchingInst) {
      course.instituteId = matchingInst._id;
      if (!matchingInst.coursesOffered.includes(course._id)) {
        matchingInst.coursesOffered.push(course._id);
        await matchingInst.save();
      }
    }
    await course.save();
  }
  console.log(`✅ Updated ${courses.length} courses with states, districts, delivery modes, and institutes.`);

  // 3. Ensure Jobs have states
  const jobs = await Job.find();
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    if (!job.state) {
      job.state = states[i % states.length];
      const stateDistricts = districts[job.state] || ["Central"];
      job.district = job.district || stateDistricts[i % stateDistricts.length];
      await job.save();
    }
  }
  console.log(`✅ Updated ${jobs.length} jobs with states and districts.`);

  // 4. Demo employer + trainee accounts so every portal can be demoed after a fresh seed
  const demoAccounts = [
    {
      name: "TechCorp India Hiring Team",
      email: "employer@techcorp.in",
      password: "Employer@123",
      role: "employer",
      organization: "TechCorp India Pvt Ltd",
    },
    {
      name: "Demo Trainee",
      email: "trainee@domain.in",
      password: "Trainee@123",
      role: "trainee",
      primaryState: "Kerala",
      skills: ["HTML", "CSS", "JavaScript", "Python"],
      targetRole: "Full Stack Developer",
    },
  ];

  const accountsByRole = {};
  for (const { password, ...account } of demoAccounts) {
    let user = await User.findOne({ email: account.email });
    if (!user) {
      user = await User.create({ ...account, passwordHash: await bcrypt.hash(password, salt) });
      console.log(`✅ Created ${account.role} account: ${account.email} / ${password}`);
    }
    accountsByRole[account.role] = user;
  }

  // 5. Create sample demand signals if empty
  const demandSignalCount = await EmployerDemandSignal.countDocuments();
  if (demandSignalCount === 0) {
    const employerId = accountsByRole.employer._id;
    await EmployerDemandSignal.insertMany([
      {
        employerId,
        company: "Tata Consultancy Services",
        sector: "IT & Software",
        state: "Kerala",
        district: "Ernakulam",
        skills: ["React", "Node.js", "MongoDB", "Docker"],
        targetRoles: ["Full Stack Developer"],
        hiringCount: 120,
        notes: "Immediate hiring for cloud & full-stack development teams in Kochi Infopark (1-3 months).",
      },
      {
        employerId,
        company: "Infosys Ltd",
        sector: "IT & Services",
        state: "Karnataka",
        district: "Bengaluru Urban",
        skills: ["Python", "FastAPI", "Machine Learning", "AWS"],
        targetRoles: ["ML Engineer", "Data Scientist"],
        hiringCount: 250,
        notes: "High demand for Generative AI and ML engineers (immediate).",
      },
      {
        employerId,
        company: "L&T Technology Services",
        sector: "Engineering & Tech",
        state: "Tamil Nadu",
        district: "Chennai",
        skills: ["Embedded Systems", "C++", "IoT", "Python"],
        targetRoles: ["Embedded Engineer"],
        hiringCount: 80,
        notes: "Smart mobility & industrial IoT requirements (3-6 months).",
      },
      {
        employerId,
        company: "Tech Mahindra",
        sector: "Telecommunications & IT",
        state: "Maharashtra",
        district: "Pune",
        skills: ["Java", "Spring Boot", "Kubernetes", "DevOps"],
        targetRoles: ["DevOps Engineer", "Backend Developer"],
        hiringCount: 160,
        notes: "Telecom microservices modernization team (1-3 months).",
      },
    ]);
    console.log("✅ Created 4 sample Employer Demand Signals.");
  }

  console.log("🎉 Seeding and enrichment complete!");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error running script:", err);
  process.exit(1);
});
