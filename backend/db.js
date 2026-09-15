/**
 * Database Layer for Roommate Finder System
 * Built using Node.js built-in node:sqlite (SQLite3 engine)
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Ensure data folder exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'roommates.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for better concurrency and performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      seeking_gender TEXT,
      avatar TEXT,
      college TEXT NOT NULL,
      location TEXT NOT NULL,
      monthly_budget INTEGER NOT NULL,
      food_preference TEXT,
      sleep_schedule TEXT,
      study_preference TEXT,
      lifestyle TEXT,
      habits TEXT,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      about TEXT NOT NULL,
      move_in_date TEXT,
      room_type TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL,
      sender_name TEXT,
      sender_contact TEXT,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default profiles if empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM profiles').get();
  if (countRow.count === 0) {
    seedDefaultProfiles();
  }
}

// Initial Shirpur RCPIT profiles
const SEED_PROFILES = [
  {
    id: "rcp-101",
    name: "Pranav Borse",
    age: 21,
    gender: "Male",
    seekingGender: "Male",
    avatar: "👨‍💻",
    college: "R. C. Patel Institute of Technology, Shirpur",
    location: "Nimzari Naka, Shirpur",
    monthlyBudget: 3200,
    foodPreference: "Vegetarian",
    sleepSchedule: "Night Owl",
    studyPreference: "Group Study",
    lifestyle: "Social",
    habits: ["Coding", "Tech Geek", "Non-Smoker", "Night Coder"],
    phone: "+91 94030 55112",
    email: "pranav.borse@rcpit.ac.in",
    about: "Final year Computer Engineering student at R. C. Patel Institute of Technology. Seeking a male roommate for boys 2BHK flat near Nimzari Naka. I love coding hackathons, late-night tea breaks, and sharing rent.",
    moveInDate: "Immediate",
    roomType: "Boys Shared Flat (Male Only)"
  },
  {
    id: "rcp-102",
    name: "Sneha Patil",
    age: 19,
    gender: "Female",
    seekingGender: "Female",
    avatar: "👩‍🎓",
    college: "R. C. Patel Institute of Technology, Shirpur",
    location: "Near College, Shirpur",
    monthlyBudget: 2800,
    foodPreference: "Vegetarian",
    sleepSchedule: "Early Sleeper",
    studyPreference: "Quiet",
    lifestyle: "Quiet",
    habits: ["Early Bird", "Non-Smoker", "Studious", "Chai Lover"],
    phone: "+91 97645 88120",
    email: "sneha.patil@rcpit.ac.in",
    about: "Second-year IT student at R. C. Patel Institute of Technology. Seeking a female roommate for a quiet girls room located Near College within 2 minutes walk to RCPIT campus gate.",
    moveInDate: "Immediate",
    roomType: "Girls Sharing Room (Female Only)"
  },
  {
    id: "rcp-103",
    name: "Rohan Deshmukh",
    age: 20,
    gender: "Male",
    seekingGender: "Male",
    avatar: "🧑‍💻",
    college: "R. C. Patel Institute of Technology, Shirpur",
    location: "Nimzari Naka, Shirpur",
    monthlyBudget: 3500,
    foodPreference: "Both",
    sleepSchedule: "Night Owl",
    studyPreference: "Group Study",
    lifestyle: "Social",
    habits: ["Gamer", "Gym Freak", "Socializer", "Non-Smoker"],
    phone: "+91 91580 33412",
    email: "rohan.deshmukh@rcpit.ac.in",
    about: "Third-year AI & Data Science student at R. C. Patel Institute of Technology living near Nimzari Naka. Looking for male roommates for a boys 3BHK flat. Evening gym enthusiast, friendly and cooperative.",
    moveInDate: "Immediate",
    roomType: "Boys Furnished Flat (Male Only)"
  },
  {
    id: "rcp-104",
    name: "Pooja Chaudhari",
    age: 20,
    gender: "Female",
    seekingGender: "Female",
    avatar: "👩‍🔬",
    college: "R. C. Patel Institute of Technology, Shirpur",
    location: "Kazi Nagar, Shirpur",
    monthlyBudget: 3000,
    foodPreference: "Vegetarian",
    sleepSchedule: "Flexible",
    studyPreference: "Quiet",
    lifestyle: "Moderate",
    habits: ["Non-Smoker", "Music lover", "Bookworm"],
    phone: "+91 99200 67123",
    email: "pooja.c@rcpit.ac.in",
    about: "Computer Engineering student at R. C. Patel Institute of Technology living in Kazi Nagar. Looking for a girl roommate for girls 1BHK. Clean, tidy, and peaceful study atmosphere during exams.",
    moveInDate: "Next Month",
    roomType: "Girls Shared Flat (Female Only)"
  },
  {
    id: "rcp-105",
    name: "Karan Shinde",
    age: 21,
    gender: "Male",
    seekingGender: "Male",
    avatar: "👨‍🔧",
    college: "R. C. Patel Institute of Technology, Shirpur",
    location: "Kazi Nagar, Shirpur",
    monthlyBudget: 2500,
    foodPreference: "Vegetarian",
    sleepSchedule: "Early Sleeper",
    studyPreference: "Quiet",
    lifestyle: "Quiet",
    habits: ["Early Bird", "Non-Smoker", "Simple Living"],
    phone: "+91 94222 19876",
    email: "karan.shinde@rcpit.ac.in",
    about: "Mechanical Engineering student at R. C. Patel Institute of Technology. Looking for a budget-friendly boys shared room in Kazi Nagar. Simple, peaceful lifestyle, focused on campus placements.",
    moveInDate: "Immediate",
    roomType: "Boys Room Sharing (Male Only)"
  },
  {
    id: "rcp-106",
    name: "Tanvi Kulkarni",
    age: 19,
    gender: "Female",
    seekingGender: "Female",
    avatar: "👩‍💻",
    college: "R. C. Patel Institute of Technology, Shirpur",
    location: "Sandipani Colony, Shirpur",
    monthlyBudget: 3400,
    foodPreference: "Vegetarian",
    sleepSchedule: "Night Owl",
    studyPreference: "Flexible",
    lifestyle: "Moderate",
    habits: ["Clean Freak", "Coding", "Chai Lover", "Non-Smoker"],
    phone: "+91 93701 44890",
    email: "tanvi.k@rcpit.ac.in",
    about: "First-year Computer Engineering girl student at R. C. Patel Institute of Technology. Searching for a female roommate for a girls flat in Sandipani Colony. Safe neighborhood, cooperative and clean.",
    moveInDate: "Within 10 days",
    roomType: "Girls Shared Flat (Female Only)"
  },
  {
    id: "rcp-107",
    name: "Yash More",
    age: 22,
    gender: "Male",
    seekingGender: "Male",
    avatar: "👨‍💼",
    college: "R. C. Patel Institute of Technology, Shirpur",
    location: "Sandipani Colony, Shirpur",
    monthlyBudget: 2700,
    foodPreference: "Both",
    sleepSchedule: "Flexible",
    studyPreference: "Group Study",
    lifestyle: "Moderate",
    habits: ["Cricket Lover", "Tea Addict", "Helpful", "Non-Smoker"],
    phone: "+91 98901 77234",
    email: "yash.more@rcpit.ac.in",
    about: "Civil Engineering final-year at R. C. Patel Institute of Technology. Looking for male roommates in Sandipani Colony to share flat expenses. Peaceful atmosphere, happy to share grocery runs.",
    moveInDate: "Immediate",
    roomType: "Boys Double Sharing (Male Only)"
  },
  {
    id: "rcp-108",
    name: "Tejas Chaudhari",
    age: 20,
    gender: "Male",
    seekingGender: "Male",
    avatar: "👨‍🎓",
    college: "R. C. Patel Institute of Technology, Shirpur",
    location: "Nimzari Naka, Shirpur",
    monthlyBudget: 3600,
    foodPreference: "Vegetarian",
    sleepSchedule: "Early Sleeper",
    studyPreference: "Quiet",
    lifestyle: "Quiet",
    habits: ["Non-Smoker", "Studious", "Chai Lover"],
    phone: "+91 94239 88114",
    email: "tejas.c@rcpit.ac.in",
    about: "E&TC student at R. C. Patel Institute of Technology living right at Nimzari Naka. 2-minute walk to market. Seeking a neat male flatmate to share rent and electricity bills in boys flat.",
    moveInDate: "Immediate",
    roomType: "Boys 2BHK Flat (Male Only)"
  },
  {
    id: "rcp-109",
    name: "Ananya Rajput",
    age: 20,
    gender: "Female",
    seekingGender: "Female",
    avatar: "👩‍🎨",
    college: "R. C. Patel Institute of Technology, Shirpur",
    location: "Sandipani Colony 2, Shirpur",
    monthlyBudget: 3200,
    foodPreference: "Both",
    sleepSchedule: "Flexible",
    studyPreference: "Quiet",
    lifestyle: "Moderate",
    habits: ["Non-Smoker", "Neat & Tidy", "Friendly"],
    phone: "+91 98811 00234",
    email: "ananya.r@rcpit.ac.in",
    about: "Information Technology student at R. C. Patel Institute of Technology living in Sandipani Colony 2. Looking for a respectful girl roommate in a modern girls flat with reliable water & electricity.",
    moveInDate: "Next Month",
    roomType: "Girls Shared 2BHK (Female Only)"
  },
  {
    id: "rcp-110",
    name: "Siddharth Ahire",
    age: 21,
    gender: "Male",
    seekingGender: "Male",
    avatar: "🧑‍💻",
    college: "R. C. Patel Institute of Technology, Shirpur",
    location: "Near College, Shirpur",
    monthlyBudget: 4000,
    foodPreference: "Vegetarian",
    sleepSchedule: "Night Owl",
    studyPreference: "Quiet",
    lifestyle: "Quiet",
    habits: ["Non-Smoker", "Introvert", "Neat & Organized"],
    phone: "+91 98205 91823",
    email: "sid.ahire@rcpit.ac.in",
    about: "Third-year Computer student at R. C. Patel Institute of Technology. Looking for a male flatmate for quiet twin-sharing room right Near College campus gate. Very peaceful and dedicated to projects.",
    moveInDate: "Immediate",
    roomType: "Boys Twin Sharing (Male Only)"
  },
  {
    id: "rcp-111",
    name: "Neha Badgujar",
    age: 21,
    gender: "Female",
    seekingGender: "Female",
    avatar: "👩‍🎓",
    college: "R. C. Patel Institute of Technology, Shirpur",
    location: "Sandipani Colony 2, Shirpur",
    monthlyBudget: 2900,
    foodPreference: "Vegetarian",
    sleepSchedule: "Early Sleeper",
    studyPreference: "Quiet",
    lifestyle: "Quiet",
    habits: ["Studious", "Non-Smoker", "Calm Nature"],
    phone: "+91 97633 44001",
    email: "neha.b@rcpit.ac.in",
    about: "Electrical Engineering student at R. C. Patel Institute of Technology. Peaceful girls room sharing in Sandipani Colony 2. Safe residential area with peaceful study vibes.",
    moveInDate: "Immediate",
    roomType: "Girls Twin Sharing (Female Only)"
  },
  {
    id: "rcp-112",
    name: "Harshal Sonawane",
    age: 20,
    gender: "Male",
    seekingGender: "Male",
    avatar: "👨‍🏫",
    college: "R. C. Patel Institute of Technology, Shirpur",
    location: "Kazi Nagar, Shirpur",
    monthlyBudget: 2600,
    foodPreference: "Both",
    sleepSchedule: "Flexible",
    studyPreference: "Group Study",
    lifestyle: "Moderate",
    habits: ["Friendly", "Non-Smoker", "Sports Enthusiast"],
    phone: "+91 91566 22890",
    email: "harshal.s@rcpit.ac.in",
    about: "Data Science student at R. C. Patel Institute of Technology. Looking for male flatmates in Kazi Nagar boys flat. Cooperative, down-to-earth, and always ready to split household chores.",
    moveInDate: "Immediate",
    roomType: "Boys Flat Sharing (Male Only)"
  }
];

function seedDefaultProfiles() {
  const insertStmt = db.prepare(`
    INSERT INTO profiles (
      id, name, age, gender, seeking_gender, avatar, college, location,
      monthly_budget, food_preference, sleep_schedule, study_preference,
      lifestyle, habits, phone, email, about, move_in_date, room_type
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  for (const p of SEED_PROFILES) {
    insertStmt.run(
      p.id,
      p.name,
      p.age,
      p.gender,
      p.seekingGender || p.gender,
      p.avatar || "👨‍🎓",
      p.college,
      p.location,
      p.monthlyBudget,
      p.foodPreference,
      p.sleepSchedule,
      p.studyPreference,
      p.lifestyle,
      JSON.stringify(p.habits || []),
      p.phone,
      p.email,
      p.about,
      p.moveInDate || "Immediate",
      p.roomType || ""
    );
  }
}

// Convert DB row to API response format
function formatProfileRow(row) {
  if (!row) return null;
  let habits = [];
  try {
    habits = typeof row.habits === 'string' ? JSON.parse(row.habits) : (row.habits || []);
  } catch (e) {
    habits = [];
  }

  return {
    id: row.id,
    name: row.name,
    age: Number(row.age),
    gender: row.gender,
    seekingGender: row.seeking_gender,
    avatar: row.avatar,
    college: row.college,
    location: row.location,
    monthlyBudget: Number(row.monthly_budget),
    foodPreference: row.food_preference,
    sleepSchedule: row.sleep_schedule,
    studyPreference: row.study_preference,
    lifestyle: row.lifestyle,
    habits: habits,
    phone: row.phone,
    email: row.email,
    about: row.about,
    moveInDate: row.move_in_date,
    roomType: row.room_type,
    createdAt: row.created_at
  };
}

// Data Access Functions
function getAllProfiles(filters = {}) {
  let query = 'SELECT * FROM profiles WHERE 1=1';
  const params = [];

  if (filters.gender && filters.gender !== 'all') {
    query += ' AND gender = ?';
    params.push(filters.gender);
  }

  if (filters.location && filters.location !== 'all') {
    query += ' AND location LIKE ?';
    params.push(`%${filters.location}%`);
  }

  if (filters.food && filters.food !== 'all') {
    query += ' AND food_preference = ?';
    params.push(filters.food);
  }

  if (filters.sleep && filters.sleep !== 'all') {
    query += ' AND sleep_schedule = ?';
    params.push(filters.sleep);
  }

  if (filters.study && filters.study !== 'all') {
    query += ' AND study_preference = ?';
    params.push(filters.study);
  }

  if (filters.lifestyle && filters.lifestyle !== 'all') {
    query += ' AND lifestyle = ?';
    params.push(filters.lifestyle);
  }

  if (filters.maxBudget && !isNaN(Number(filters.maxBudget))) {
    query += ' AND monthly_budget <= ?';
    params.push(Number(filters.maxBudget));
  }

  if (filters.search && filters.search.trim()) {
    const s = `%${filters.search.trim()}%`;
    query += ' AND (name LIKE ? OR college LIKE ? OR location LIKE ? OR about LIKE ?)';
    params.push(s, s, s, s);
  }

  if (filters.sortBy === 'budgetAsc') {
    query += ' ORDER BY monthly_budget ASC';
  } else if (filters.sortBy === 'budgetDesc') {
    query += ' ORDER BY monthly_budget DESC';
  } else if (filters.sortBy === 'ageAsc') {
    query += ' ORDER BY age ASC';
  } else if (filters.sortBy === 'ageDesc') {
    query += ' ORDER BY age DESC';
  } else {
    query += ' ORDER BY created_at DESC';
  }

  const rows = db.prepare(query).all(...params);
  return rows.map(formatProfileRow);
}

function getProfileById(id) {
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
  return formatProfileRow(row);
}

function createProfile(data) {
  const id = data.id || `rcp-${Date.now()}`;
  const habitsJson = JSON.stringify(Array.isArray(data.habits) ? data.habits : []);
  const roomType = data.roomType || (data.gender === 'Female' ? 'Girls Shared Room (Female Only)' : 'Boys Shared Room (Male Only)');

  const stmt = db.prepare(`
    INSERT INTO profiles (
      id, name, age, gender, seeking_gender, avatar, college, location,
      monthly_budget, food_preference, sleep_schedule, study_preference,
      lifestyle, habits, phone, email, about, move_in_date, room_type
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  stmt.run(
    id,
    data.name,
    Number(data.age),
    data.gender,
    data.seekingGender || data.gender,
    data.avatar || '👨‍🎓',
    data.college,
    data.location,
    Number(data.monthlyBudget),
    data.foodPreference || 'Vegetarian',
    data.sleepSchedule || 'Flexible',
    data.studyPreference || 'Flexible',
    data.lifestyle || 'Moderate',
    habitsJson,
    data.phone,
    data.email,
    data.about,
    data.moveInDate || 'Immediate',
    roomType
  );

  return getProfileById(id);
}

function updateProfile(id, data) {
  const existing = getProfileById(id);
  if (!existing) return null;

  const merged = { ...existing, ...data };
  const habitsJson = JSON.stringify(Array.isArray(merged.habits) ? merged.habits : []);

  const stmt = db.prepare(`
    UPDATE profiles SET
      name = ?, age = ?, gender = ?, seeking_gender = ?, avatar = ?,
      college = ?, location = ?, monthly_budget = ?, food_preference = ?,
      sleep_schedule = ?, study_preference = ?, lifestyle = ?, habits = ?,
      phone = ?, email = ?, about = ?, move_in_date = ?, room_type = ?
    WHERE id = ?
  `);

  stmt.run(
    merged.name,
    Number(merged.age),
    merged.gender,
    merged.seekingGender || merged.gender,
    merged.avatar,
    merged.college,
    merged.location,
    Number(merged.monthlyBudget),
    merged.foodPreference,
    merged.sleepSchedule,
    merged.studyPreference,
    merged.lifestyle,
    habitsJson,
    merged.phone,
    merged.email,
    merged.about,
    merged.moveInDate,
    merged.roomType,
    id
  );

  return getProfileById(id);
}

function deleteProfile(id) {
  const existing = getProfileById(id);
  if (!existing) return false;

  db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
  db.prepare('DELETE FROM bookmarks WHERE profile_id = ?').run(id);
  db.prepare('DELETE FROM messages WHERE profile_id = ?').run(id);
  return true;
}

// Bookmarks
function getBookmarks() {
  const rows = db.prepare('SELECT profile_id FROM bookmarks').all();
  return rows.map(r => r.profile_id);
}

function toggleBookmark(profileId) {
  const exists = db.prepare('SELECT id FROM bookmarks WHERE profile_id = ?').get(profileId);
  if (exists) {
    db.prepare('DELETE FROM bookmarks WHERE profile_id = ?').run(profileId);
    return { bookmarked: false, profileId };
  } else {
    db.prepare('INSERT INTO bookmarks (profile_id) VALUES (?)').run(profileId);
    return { bookmarked: true, profileId };
  }
}

// Messages
function createMessage(data) {
  const stmt = db.prepare(`
    INSERT INTO messages (profile_id, sender_name, sender_contact, message)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.profileId,
    data.senderName || 'Anonymous Student',
    data.senderContact || '',
    data.message
  );
  return {
    id: Number(result.lastInsertRowid),
    profileId: data.profileId,
    message: data.message,
    senderName: data.senderName || 'Anonymous Student',
    createdAt: new Date().toISOString()
  };
}

function getMessagesByProfile(profileId) {
  return db.prepare('SELECT * FROM messages WHERE profile_id = ? ORDER BY created_at DESC').all(profileId);
}

function getAllMessages() {
  return db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
}

function deleteMessage(id) {
  const stmt = db.prepare('DELETE FROM messages WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// Stats
function getStats() {
  const totalProfiles = db.prepare('SELECT COUNT(*) as count FROM profiles').get().count;
  const boysRooms = db.prepare("SELECT COUNT(*) as count FROM profiles WHERE gender = 'Male'").get().count;
  const girlsRooms = db.prepare("SELECT COUNT(*) as count FROM profiles WHERE gender = 'Female'").get().count;
  const avgBudgetRow = db.prepare('SELECT AVG(monthly_budget) as avgBudget FROM profiles').get();
  const totalMessages = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
  const totalBookmarks = db.prepare('SELECT COUNT(*) as count FROM bookmarks').get().count;

  return {
    totalProfiles,
    boysRooms,
    girlsRooms,
    averageBudget: Math.round(avgBudgetRow.avgBudget || 0),
    totalMessages,
    totalBookmarks,
    activeLocalities: 6,
    compatibilityRate: '98%'
  };
}

// Reseed DB function
function reseedDatabase() {
  db.exec('DELETE FROM messages;');
  db.exec('DELETE FROM bookmarks;');
  db.exec('DELETE FROM profiles;');
  seedDefaultProfiles();
  return { success: true, message: 'Database reset to default Shirpur profiles' };
}

// Initialize on require
initSchema();

module.exports = {
  getAllProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  getBookmarks,
  toggleBookmark,
  createMessage,
  getMessagesByProfile,
  getAllMessages,
  deleteMessage,
  getStats,
  reseedDatabase
};

