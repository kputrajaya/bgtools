const { queryBgg } = require('../lib/bgg');

const COLLECTION_URL = 'https://boardgamegeek.com/xmlapi2/collection';

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const query = req.query || {};
  const username = typeof query.username === 'string' ? query.username.trim() : '';
  if (Object.keys(query).some((name) => name !== 'username')) {
    return res.status(400).json({ error: 'Unexpected query parameter' });
  }
  if (!username || username.length > 100 || /[\u0000-\u001f\u007f]/.test(username)) {
    return res.status(400).json({ error: 'Valid username required' });
  }

  const targetUrl = new URL(COLLECTION_URL);
  targetUrl.searchParams.set('username', username);
  targetUrl.searchParams.set('own', '1');
  targetUrl.searchParams.set('excludesubtype', 'boardgameexpansion');
  targetUrl.searchParams.set('stats', '1');
  return queryBgg(targetUrl, res);
};
