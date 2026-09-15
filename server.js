/**
 * Roommate Finder System - REST API Server
 * Exclusively tailored for R. C. Patel Institute of Technology (RCPIT), Shirpur
 * Built with Express.js + SQLite (via node:sqlite)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('node:crypto');
const db = require('./backend/db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'rcpit-shirpur-roommate-auth-secret-2026';

// Token helpers (HMAC-SHA256 Signed Tokens)
function generateAuthToken(student) {
  const payload = {
    sub: student.id,
    email: student.email,
    name: student.name,
    iat: Date.now(),
    exp: Date.now() + 14 * 24 * 60 * 60 * 1000 // 14 days
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('base64url');
  return `${payloadStr}.${signature}`;
}

function verifyAuthToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadStr, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// Middleware helper to extract authenticated student if present
function getAuthUser(req) {
  const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
  if (!authHeader) return null;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  return verifyAuthToken(token);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from project root
app.use(express.static(path.join(__dirname)));

// ==========================================================================
// REST API Routes
// ==========================================================================

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Roommate Finder System API (RCPIT Shirpur)',
    timestamp: new Date().toISOString()
  });
});

// ==========================================================================
// Student Authentication Routes
// ==========================================================================

// Register new student
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, prn, department, year, phone } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter your full name (minimum 2 characters)' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid student or college email address' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const student = db.registerStudent({
      name,
      email,
      password,
      prn,
      department,
      year,
      phone
    });

    const token = generateAuthToken(student);
    res.status(201).json({
      message: 'Student account registered successfully! 🎓',
      token,
      student
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(400).json({ error: error.message || 'Failed to register student account' });
  }
});

// Login student
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const student = db.verifyStudentPassword(email, password);
    if (!student) {
      return res.status(401).json({ error: 'Invalid college email or password. Please check and try again.' });
    }

    const token = generateAuthToken(student);
    res.json({
      message: 'Student login successful! Welcome back.',
      token,
      student
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to process student login' });
  }
});

// Get current student profile & listings
app.get('/api/auth/me', (req, res) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ error: 'Not authenticated or session expired' });
    }

    const student = db.getStudentById(auth.sub);
    if (!student) {
      return res.status(404).json({ error: 'Student account not found' });
    }

    const myListings = db.getProfilesByStudentId(student.id);
    res.json({
      student,
      myListings
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Failed to verify authenticated student' });
  }
});

// Update student profile
app.put('/api/auth/profile', (req, res) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const updated = db.updateStudentProfile(auth.sub, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      message: 'Student profile updated successfully',
      student: updated
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    res.status(500).json({ error: 'Failed to update student profile' });
  }
});

// Change password
app.put('/api/auth/password', (req, res) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { oldPassword, newPassword } = req.body;
    db.changeStudentPassword(auth.sub, oldPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to update password' });
  }
});

// Get messages for current student listings
app.get('/api/auth/inbox', (req, res) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const messages = db.getMessagesForStudent(auth.sub);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching student inbox:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// 2. Campus & Roommate Stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

// 3. Get All Profiles (with filtering and search support)
app.get('/api/profiles', (req, res) => {
  try {
    const filters = {
      gender: req.query.gender,
      location: req.query.location,
      food: req.query.food,
      sleep: req.query.sleep,
      study: req.query.study,
      lifestyle: req.query.lifestyle,
      maxBudget: req.query.maxBudget,
      search: req.query.search,
      sortBy: req.query.sortBy
    };

    const profiles = db.getAllProfiles(filters);
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Failed to retrieve profiles' });
  }
});

// 4. Get Single Profile by ID
app.get('/api/profiles/:id', (req, res) => {
  try {
    const profile = db.getProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// 5. Create New Profile
app.post('/api/profiles', (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      college,
      email,
      phone,
      location,
      monthlyBudget,
      about
    } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }
    if (!age || isNaN(Number(age)) || Number(age) < 16 || Number(age) > 50) {
      return res.status(400).json({ error: 'Valid age between 16 and 50 is required' });
    }
    if (!gender || (gender !== 'Male' && gender !== 'Female')) {
      return res.status(400).json({ error: 'Gender must be Male or Female' });
    }
    if (!college || college.trim().length < 2) {
      return res.status(400).json({ error: 'College is required' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!phone || phone.replace(/[^0-9]/g, '').length < 10) {
      return res.status(400).json({ error: 'Valid 10-digit phone number is required' });
    }
    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }
    if (!monthlyBudget || isNaN(Number(monthlyBudget)) || Number(monthlyBudget) < 500) {
      return res.status(400).json({ error: 'Valid monthly budget is required' });
    }
    if (!about || about.trim().length < 10) {
      return res.status(400).json({ error: 'Bio must be at least 10 characters' });
    }

    const auth = getAuthUser(req);
    const profilePayload = {
      ...req.body,
      studentId: auth ? auth.sub : (req.body.studentId || null)
    };

    const newProfile = db.createProfile(profilePayload);
    res.status(201).json({
      message: 'Profile created successfully',
      profile: newProfile
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// 6. Update Profile
app.put('/api/profiles/:id', (req, res) => {
  try {
    const updated = db.updateProfile(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({
      message: 'Profile updated successfully',
      profile: updated
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 7. Delete Profile
app.delete('/api/profiles/:id', (req, res) => {
  try {
    const success = db.deleteProfile(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

// 8. Bookmarks: Get all
app.get('/api/bookmarks', (req, res) => {
  try {
    const bookmarks = db.getBookmarks();
    res.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Failed to retrieve bookmarks' });
  }
});

// 9. Bookmarks: Toggle
app.post('/api/bookmarks/toggle', (req, res) => {
  try {
    const { profileId } = req.body;
    if (!profileId) {
      return res.status(400).json({ error: 'profileId is required' });
    }
    const result = db.toggleBookmark(profileId);
    res.json(result);
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

// 10. Contact Messages / Inquiries
app.post('/api/messages', (req, res) => {
  try {
    const { profileId, message, senderName, senderContact } = req.body;
    if (!profileId || !message || !message.trim()) {
      return res.status(400).json({ error: 'profileId and message are required' });
    }

    const savedMessage = db.createMessage({
      profileId,
      message: message.trim(),
      senderName,
      senderContact
    });

    res.status(201).json({
      message: 'Message delivered to roommate successfully',
      data: savedMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 11. Get Messages sent to a Profile
app.get('/api/messages/:profileId', (req, res) => {
  try {
    const messages = db.getMessagesByProfile(req.params.profileId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// 12. Get All Messages (or for inbox stats)
app.get('/api/messages', (req, res) => {
  try {
    const messages = db.getAllMessages();
    res.json(messages);
  } catch (error) {
    console.error('Error fetching all messages:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// 13. Delete a Message by ID
app.delete('/api/messages/:id', (req, res) => {
  try {
    const success = db.deleteMessage(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// 14. Reseed Database (development/demo utility)
app.post('/api/seed', (req, res) => {
  try {
    const result = db.reseedDatabase();
    res.json(result);
  } catch (error) {
    console.error('Error reseeding database:', error);
    res.status(500).json({ error: 'Failed to reseed database' });
  }
});

// Fallback to index.html for root routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  🏠 Roommate Finder API Server (RCPIT Shirpur)     `);
  console.log(`  🚀 Live at: http://localhost:${PORT}             `);
  console.log(`  📊 Health check: http://localhost:${PORT}/api/health `);
  console.log(`  👥 Profiles API: http://localhost:${PORT}/api/profiles`);
  console.log(`====================================================`);
});
