const express = require('express');
const router = express.Router();
const MoodEntry = require('../models/MoodEntry');

// POST /api/mood
router.post('/', async (req, res) => {
  const entry = new MoodEntry(req.body);
  await entry.save();
  res.json(entry);
});

// GET /api/mood/:userId
router.get('/:userId', async (req, res) => {
  const logs = await MoodEntry.find({ userId: req.params.userId }).sort({ date: -1 });
  res.json(logs);
});

module.exports = router;
