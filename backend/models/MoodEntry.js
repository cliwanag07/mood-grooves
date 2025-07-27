const mongoose = require('mongoose');

const MoodEntrySchema = new mongoose.Schema({
  userId: String,
  mood: String,
  journal: String,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MoodEntry', MoodEntrySchema);
