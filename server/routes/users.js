const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) {
      user.name = name;
      user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get user ranking
router.get('/ranking', auth, async (req, res) => {
  try {
    const users = await User.find()
      .select('name avatar score')
      .sort({ score: -1 })
      .limit(10);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ranking' });
  }
});

// Update user score
router.put('/score', auth, async (req, res) => {
  try {
    const { score } = req.body;
    
    const user = await User.findById(req.user._id);
    user.score = score;
    
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating score' });
  }
});

module.exports = router;
