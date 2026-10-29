const { constructBggHandler } = require('../lib/bgg');

module.exports = (req, res) =>
  constructBggHandler(req, res, (query) => {
    const username = typeof query.username === 'string' ? query.username.trim() : '';
    if (!username || username.length > 100 || /[\u0000-\u001f\u007f]/.test(username)) {
      throw new TypeError('Valid username required');
    }

    const params = new URLSearchParams({ username, subtype: 'boardgameexpansion' });
    return `/xmlapi2/collection?${params}`;
  });
