const mongoose = require('mongoose');

const gameCacheSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  games: { type: [mongoose.Schema.Types.Mixed], default: [] },
  fetchedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GameCache', gameCacheSchema);