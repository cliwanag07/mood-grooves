import mongoose, { Schema, models, model } from 'mongoose';

const MoodEntrySchema = new Schema({
  userId: String,
  mood: String,
  journal: String,
  date: { type: Date, default: Date.now },
});

export default models.MoodEntry || model('MoodEntry', MoodEntrySchema); 