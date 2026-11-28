const GameCache = require('../models/GameCache');

const BASE = 'https://api.balldontlie.io/v1';
const LIVE_TTL_MS = 60 * 1000; // reuse a saved copy for 1 minute
const ISO_START = /^\d{4}-\d{2}-\d{2}T/;


function todayET() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function isValidDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s || '');
}

function isFinal(game) {
  return game.status === 'Final';
}

function isScheduled(game) {
  return ISO_START.test(game.status) && new Date(game.status) > new Date();
}

function describe(game) {
  if (isFinal(game)) return { state: 'final', label: 'Final' };
  if (ISO_START.test(game.status)) {
    const start = new Date(game.status);
    if (start > new Date()) {
      const time = start.toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: '2-digit'
      });
      return { state: 'scheduled', label: `${time} ET` };
    }
    return { state: 'live', label: 'In progress' };
  }
  return { state: 'live', label: `${game.status} ${game.time || ''}`.trim() };
}

async function fetchFromApi(date) {
  const url = `${BASE}/games?dates[]=${encodeURIComponent(date)}&per_page=100`;
  const res = await fetch(url, {
    headers: { Authorization: process.env.BALLDONTLIE_API_KEY }
  });
  if (!res.ok) {
    const message =
      res.status === 429
        ? 'Too many requests to the games API. Wait a minute and try again.'
        : `Games API error (${res.status}).`;
    throw Object.assign(new Error(message), { status: 502 });
  }
  const body = await res.json();
  return body.data;
}

async function getGames(date) {
  const cached = await GameCache.findOne({ date });

  if (cached) {
    const allFinal = cached.games.length > 0 && cached.games.every(isFinal);
    const fresh = Date.now() - cached.fetchedAt.getTime() < LIVE_TTL_MS;
    if (allFinal || fresh) return cached.games;
  }

  try {
    const games = await fetchFromApi(date);
    await GameCache.findOneAndUpdate(
      { date },
      { games, fetchedAt: new Date() },
      { upsert: true }
    );
    return games;
  } catch (err) {
    if (cached) return cached.games;
    throw err;
  }
}

module.exports = { todayET, isValidDate, isFinal, isScheduled, describe, getGames };