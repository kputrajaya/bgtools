const { constructBggHandler } = require('./_shared/bgg');

const MAX_DETAIL_IDS = 20;

module.exports = (req, res) =>
  constructBggHandler(req, res, (query) => {
    const ids = typeof query.ids === 'string' ? query.ids.trim() : '';
    if (!/^[1-9]\d*(,[1-9]\d*)*$/.test(ids)) throw new TypeError('Valid thing ids required');
    if (ids.split(',').length > MAX_DETAIL_IDS) {
      throw new TypeError(`No more than ${MAX_DETAIL_IDS} thing ids allowed`);
    }

    const params = new URLSearchParams({ id: ids, stats: '1', pagesize: String(MAX_DETAIL_IDS) });
    return `/xmlapi2/thing?${params}`;
  });
