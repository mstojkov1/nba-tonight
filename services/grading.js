const Pick = require('../models/Pick');
const { getGames, isFinal, todayET } = require('./balldontlie');

async function gradePending(filter = {}) {
  const today = todayET();
  const pending = await Pick.find({ ...filter, result: 'pending', gameDate: { $lte: today } });
  const dates = [...new Set(pending.map((p) => p.gameDate))];

  for (const date of dates) {
    let games;
    try {
      games = await getGames(date);
    } catch (err) {
      continue;
    }

    for (const pick of pending.filter((p) => p.gameDate === date)) {
      const game = games.find((g) => g.id === pick.gameId);
      if (!game || !isFinal(game)) continue;

      const winner = game.home_team_score > game.visitor_team_score ? 'home' : 'visitor';
      pick.result = winner === pick.pickedSide ? 'correct' : 'incorrect';
      pick.finalScore = `${game.visitor_team.abbreviation} ${game.visitor_team_score} - ${game.home_team.abbreviation} ${game.home_team_score}`;
      await pick.save();
    }
  }
}

module.exports = { gradePending };