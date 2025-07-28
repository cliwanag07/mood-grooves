const express = require('express');
const router = express.Router();
const { analyzeMood } = require('../services/geminiService');

// TODO: Add your logic here

// POST /api/ai
router.post('/', async (req, res) => {
  const { journal } = req.body;
  if (!journal) return res.status(400).json({ error: 'Missing journal entry' });
  try {
    const result = await analyzeMood(journal);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze mood' });
  }
});

module.exports = router;
