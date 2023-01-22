document.addEventListener('alpine:init', () => {
  const wrapper = new Masonry('#wrapper', {
    itemSelector: '.col-12',
    percentPosition: true,
    transitionDuration: 0,
  });

  const getData = async (path) => {
    // Fetch data
    let fetchRes = null;
    const url = `https://boardgamegeek.com/xmlapi2/${path}`;
    const options = { 'Content-Type': 'application/xml' };
    while (true) {
      fetchRes = await fetch(url, options).catch(() => null);
      if (fetchRes && fetchRes.status === 200) break;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Parse XML
    const collectionText = await fetchRes.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    return parser.parse(collectionText);
  };
  const relayout = () => {
    wrapper.reloadItems();
    wrapper.layout();
  };
  setInterval(relayout, 1000);

  Alpine.data('bgs', () => ({
    // Constants
    limit: 1000,
    maxFilterable: 10,

    // Data
    username: '',
    items: null,
    filter: null,
    loading: false,

    // Computed
    itemsLength() {
      return (this.items || []).length;
    },
    itemsSliced() {
      let items = this.items || [];
      if (this.filter) {
        items = items.filter((item) => item.players.min <= this.filter && item.players.max >= this.filter);
      }
      return items.slice(0, this.limit);
    },
    filterOptions() {
      if (!this.items) return [];

      const counter = {};
      this.items.forEach((item) => {
        for (i = item.players.min; i <= item.players.max && i <= this.maxFilterable; i++) {
          counter[i] = (counter[i] || 0) + 1;
        }
      });
      return Object.keys(counter)
        .sort((a, b) => a - b)
        .map((count) => ({
          value: count,
          text: `${count < this.maxFilterable ? count : `${this.maxFilterable}+`}
            player${count > 1 ? 's' : ''}
            (${this.formatNumber(counter[count])})`,
        }));
    },

    // Method
    init() {
      const params = new URLSearchParams(window.location.search);
      this.username = params.get('u') || '';
      if (!this.username) return;
      this.load();
    },
    formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    async load() {
      this.loading = true;

      const collectionObj = await getData(
        `collection/?username=${this.username}&own=1&excludesubtype=boardgameexpansion&stats=1`
      );
      const collection = collectionObj.items.item
        .map((item) => ({
          id: item['@_objectid'],
          image: item.image.replace(/cf\.geekdo-images\.com/, 'ik.imagekit.io/kvn/bgg') + '?tr=w-800',
          name: String(item.name['#text']),
          year: item.yearpublished,
          players: {
            min: Math.floor(item.stats['@_minplayers']),
            max: Math.floor(item.stats['@_maxplayers']),
          },
          playTime: {
            min: Math.floor(item.stats['@_minplaytime']),
            max: Math.floor(item.stats['@_maxplaytime']),
          },
          weight: null,
          rating: Math.floor(item.stats.rating['@_value']) || null,
          ratingBgg: (Math.round(parseFloat(item.stats.rating.average['@_value']) * 10) / 10).toFixed(1),
          ratingBggCount:
            item.stats.rating.usersrated['@_value'].length > 3
              ? Math.round(Math.floor(item.stats.rating.usersrated['@_value']) / 1000) + 'k'
              : item.stats.rating.usersrated['@_value'],
          rank: Math.floor((item.stats.rating.ranks.rank[0] || item.stats.rating.ranks.rank)['@_value']),
          comment: item.comment,
          owned: item.status['@_own'] == '1',
        }))
        .sort((a, b) => b.rating - a.rating || a.rank - b.rank);

      // Render to view
      this.items = collection;
      setTimeout(relayout, 10);

      this.loading = false;
      this.enrich();
    },
    async enrich() {
      const objectIds = this.items.map((item) => item.id);
      const chunkSize = 100;
      for (let i = 0; i < objectIds.length; i += chunkSize) {
        const thingObjs = await getData(`thing?id=${objectIds.slice(i, i + chunkSize).join(',')}&stats=1&pagesize=100`);
        thingObjs.items.item.forEach((item, j) => {
          this.items[i + j].weight = parseFloat(item.statistics.ratings.averageweight['@_value']).toFixed(2);
        });
      }
    },
  }));
});
