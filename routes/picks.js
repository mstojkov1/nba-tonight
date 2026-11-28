const express = require('express');
const router = express.Router();
const Pick = require('../models/Pick');
const { getGames, isScheduled, isValidDate } = require('../services/balldontlie');
const { gradePending } = require('../services/grading');

function backToGames(res, date, message) {
  const dateQuery = isValidDate(date) ? `date=${date}&` : '';
  res.redirect(`/?${dateQuery}error=${encodeURIComponent(message)}`);
}

router.get('/', async (req, res, next) => {
  try {
    const user = (req.query.user || '').trim().toLowerCase();
    const filter = user ? { username: user } : {};

    await gradePending(filter);
    const picks = await Pick.find(filter).sort({ gameDate: -1, createdAt: -1 }).lean();

    res.render('picks', { title: 'My Picks', picks, user });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { gameId, gameDate, pickedSide, note } = req.body;
    const username = (req.body.username || '').trim();

    if (!isValidDate(gameDate)) return backToGames(res, null, 'Invalid date.');
    if (!username || username.length > 30) {
      return backToGames(res, gameDate, 'Enter a name up to 30 characters.');
    }
    if (!['home', 'visitor'].includes(pickedSide)) {
      return backToGames(res, gameDate, 'Choose a team.');
    }

    const games = await getGames(gameDate);
    const game = games.find((g) => String(g.id) === String(gameId));
    if (!game) return backToGames(res, gameDate, 'Game not found.');
    if (!isScheduled(game)) return backToGames(res, gameDate, 'Picks are closed for that game.');

    await Pick.create({
      username,
      gameId: game.id,
      gameDate,
      homeTeam: game.home_team.full_name,
      visitorTeam: game.visitor_team.full_name,
      pickedSide,
      pickedTeam: pickedSide === 'home' ? game.home_team.full_name : game.visitor_team.full_name,
      note
    });

    res.redirect(`/picks?user=${encodeURIComponent(username.toLowerCase())}`);
  } catch (err) {
    if (err.code === 11000) {
      return backToGames(res, req.body.gameDate, 'You already picked that game.');
    }
    next(err);
  }
});

module.exports = router;