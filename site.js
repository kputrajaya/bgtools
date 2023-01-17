document.addEventListener('alpine:init', () => {
  const wrapper = new Masonry('#wrapper', {
    itemSelector: '.col-12',
    percentPosition: true,
    transitionDuration: 0,
  });
  const relayout = () => {
    wrapper.reloadItems();
    wrapper.layout();
  };
  setInterval(relayout, 1000);

  Alpine.data('bgs', () => ({
    // Data
    username: '',
    items: null,
    loading: false,
    limit: 1000,

    // Computed
    itemsLength() {
      return (this.items || []).length;
    },
    itemsSliced() {
      return (this.items || []).slice(0, this.limit);
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

      // Get collection data and retry
      let resCollection = null;
      const url = 'https://boardgamegeek.com/xmlapi/collection/' + this.username + '?own=1';
      const options = { 'Content-Type': 'application/xml' };
      while (true) {
        resCollection = await fetch(url, options).catch(() => null);
        if (resCollection && resCollection.status === 200) break;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Parse collection data
      const collectionText = await resCollection.text();
      const parser = new XMLParser({ ignoreAttributes: false });
      const collectionObj = parser.parse(collectionText);
      const collection = collectionObj.items.item.map((item) => ({
        id: item['@_objectid'],
        image: item.image.replace(/cf\.geekdo-images\.com/, 'ik.imagekit.io/kvn/bgg') + '?tr=w-800',
        thumbnail: item.thumbnail,
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
        rating: Math.floor(item.stats.rating['@_value']) || null,
        ratingBgg: (Math.round(parseFloat(item.stats.rating.average['@_value']) * 10) / 10).toFixed(1),
        ratingBggCount:
          item.stats.rating.usersrated['@_value'].length > 3
            ? Math.round(Math.floor(item.stats.rating.usersrated['@_value']) / 1000) + 'k'
            : item.stats.rating.usersrated['@_value'],
        comment: item.comment,
        owned: item.status['@_own'] == '1',
      }));

      // Sort by ratings then name
      collection.sort((a, b) => b.rating - a.rating || b.ratingBgg - a.ratingBgg || a.name.localeCompare(b.name));

      // Render to view
      this.items = collection;
      setTimeout(relayout, 10);

      this.loading = false;
    },
  }));
});
