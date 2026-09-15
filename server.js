/**
 * Roommate Finder System - REST API Server
 * Exclusively tailored for R. C. Patel Institute of Technology (RCPIT), Shirpur
 * Built with Express.js + SQLite (via node:sqlite)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./backend/db');

const app = express();
const PORT = process.env.PORT || 3000;

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

    const newProfile = db.createProfile(req.body);
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
