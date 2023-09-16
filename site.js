document.addEventListener('alpine:init', () => {
  const defaultUsername = 'kputrajaya';
  const wrapper = new Masonry('#wrapper', {
    itemSelector: '.col-12',
    percentPosition: true,
    transitionDuration: 0,
  });
  const parser = new XMLParser({ ignoreAttributes: false });

  const getData = async (path) => {
    let fetchRes = null;
    const url = `https://boardgamegeek.com/xmlapi2/${path}`;
    const options = { 'Content-Type': 'application/xml' };
    while (true) {
      fetchRes = await fetch(url, options).catch(() => null);
      if (fetchRes && fetchRes.status === 200) break;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    const collectionText = await fetchRes.text();
    return parser.parse(collectionText);
  };
  const getCollection = async (username) => {
    const collectionObj = await getData(
      `collection/?username=${username}&own=1&excludesubtype=boardgameexpansion&stats=1`
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
        ratingBgg: Math.round(parseFloat(item.stats.rating.average['@_value']) * 10) / 10,
        ratingBggCount:
          item.stats.rating.usersrated['@_value'].length > 3
            ? Math.round(Math.floor(item.stats.rating.usersrated['@_value']) / 1000) + 'k'
            : item.stats.rating.usersrated['@_value'],
        rank: Math.floor((item.stats.rating.ranks.rank[0] || item.stats.rating.ranks.rank)['@_value']),
        comment: item.comment,
        owned: item.status['@_own'] == '1',
      }))
      .sort((a, b) => b.rating - a.rating || a.rank - b.rank);
    return collection;
  };
  const getThings = async (thingIds) => {
    const thingObjs = await getData(`thing?id=${thingIds.join(',')}&stats=1&pagesize=100`);
    return thingObjs.items.item;
  };
  const relayout = () => {
    wrapper.reloadItems();
    wrapper.layout();
  };

  setInterval(relayout, 750);

  Alpine.data('bgs', () => ({
    // Constants
    itemsLimit: 1000,
    filterPlayerMax: 10,

    // Data
    username: '',
    items: null,
    filter: { player: null, weight: null },
    loading: false,

    // Computed
    itemsLength() {
      return this.items ? this.items.length : 0;
    },
    itemsSliced() {
      if (!this.items) return [];

      let items = this.items;
      if (this.filter.player) {
        const filterPlayer = Math.floor(this.filter.player);
        items = items.filter((item) => item.players.min <= filterPlayer && item.players.max >= filterPlayer);
      }
      if (this.filter.weight) {
        const filterWeight = Math.floor(this.filter.weight);
        items = items.filter((item) => item.weight >= filterWeight && item.weight < filterWeight + 1);
      }
      return items.slice(0, this.itemsLimit);
    },
    filterPlayerOptions() {
      if (!this.items) return [];

      const counter = {};
      this.items.forEach((item) => {
        for (let i = item.players.min; i <= item.players.max && i <= this.filterPlayerMax; i++) {
          counter[i] = (counter[i] || 0) + 1;
        }
      });
      return Object.keys(counter)
        .sort((a, b) => a - b)
        .map((count) => ({
          value: count,
          text: `${count < this.filterPlayerMax ? count : this.filterPlayerMax + '+'} player${count > 1 ? 's' : ''}
            (${this.formatNumber(counter[count])})`,
        }));
    },
    filterWeightOptions() {
      if (!this.items) return [];

      const counter = {};
      this.items.forEach((item) => {
        const group = Math.floor(item.weight);
        if (!group) return;

        counter[group] = (counter[group] || 0) + 1;
      });
      return Object.keys(counter)
        .sort((a, b) => a - b)
        .map((group) => ({
          value: group,
          text: `${group}+ (${this.formatNumber(counter[group])})`,
        }));
    },

    // Method
    formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    init() {
      const params = new URLSearchParams(window.location.search);
      this.username = params.get('u') || defaultUsername;
      if (!this.username) return;
      this.load();
    },
    async load() {
      this.loading = true;

      this.items = await getCollection(this.username);
      setTimeout(relayout, 10);

      this.loading = false;
      this.enrich();
    },
    async enrich() {
      const thingIds = this.items.map((item) => item.id);
      const chunkSize = 100;
      for (let i = 0; i < thingIds.length; i += chunkSize) {
        const objects = await getThings(thingIds.slice(i, i + chunkSize));
        objects.forEach((item, j) => {
          this.items[i + j].weight = parseFloat(item.statistics.ratings.averageweight['@_value']) || null;
        });
      }
    },
  }));
});
