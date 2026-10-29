const { queryBgg } = require('../lib/bgg');

const MAX_DETAIL_IDS = 20;
const THING_URL = 'https://boardgamegeek.com/xmlapi2/thing';

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const query = req.query || {};
  const ids = typeof query.ids === 'string' ? query.ids.trim() : '';
  if (Object.keys(query).some((name) => name !== 'ids')) {
    return res.status(400).json({ error: 'Unexpected query parameter' });
  }
  if (!/^[1-9]\d*(,[1-9]\d*)*$/.test(ids)) {
    return res.status(400).json({ error: 'Valid thing ids required' });
  }
  if (ids.split(',').length > MAX_DETAIL_IDS) {
    return res.status(400).json({ error: `No more than ${MAX_DETAIL_IDS} thing ids allowed` });
  }

  const targetUrl = new URL(THING_URL);
  targetUrl.searchParams.set('id', ids);
  targetUrl.searchParams.set('stats', '1');
  targetUrl.searchParams.set('pagesize', String(MAX_DETAIL_IDS));
  return queryBgg(targetUrl, res);
};
