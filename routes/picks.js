const mongoose = require('mongoose');

const pickSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, lowercase: true, maxlength: 30 },
    gameId: { type: Number, required: true },
    gameDate: { type: String, required: true },
    homeTeam: { type: String, required: true },
    visitorTeam: { type: String, required: true },
    pickedSide: { type: String, enum: ['home', 'visitor'], required: true },
    pickedTeam: { type: String, required: true },
    note: { type: String, trim: true, maxlength: 300, default: '' },
    result: { type: String, enum: ['pending', 'correct', 'incorrect'], default: 'pending' },
    finalScore: { type: String, default: '' }
  },
  { timestamps: true }
);

pickSchema.index({ username: 1, gameId: 1 }, { unique: true });

module.exports = mongoose.model('Pick', pickSchema);