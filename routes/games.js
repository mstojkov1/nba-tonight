const express = require('express');
const router = express.Router();
const Pick = require('../models/Pick');
const { getGames, describe, todayET, isValidDate } = require('../services/balldontlie');

router.get('/', async (req, res, next) => {
  try {
    const today = todayET();
    const date = isValidDate(req.query.date) ? req.query.date : today;

    const games = (await getGames(date)).map((g) => ({ ...g, ...describe(g) }));

    const picks = await Pick.find({ gameDate: date }).lean();
    const counts = {};
    picks.forEach((p) => {
      counts[p.gameId] = counts[p.gameId] || { home: 0, visitor: 0 };
      counts[p.gameId][p.pickedSide]++;
    });

    res.render('games', {
      title: 'Games',
      date,
      isToday: date === today,
      games,
      counts,
      error: req.query.error || ''
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;