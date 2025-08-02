import mongoose from 'mongoose';

const TrackSchema = new mongoose.Schema({
  name: String,
  artist: String,
  url: String,
});

const EntrySchema = new mongoose.Schema({
  prompt: String,
  tags: [String],
  tracks: [TrackSchema],
  createdAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  spotifyId: { type: String, unique: true },
  displayName: String,
  entries: [EntrySchema],
  createdAt: { type: Date, default: Date.now },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
