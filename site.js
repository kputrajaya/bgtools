document.addEventListener('alpine:init', () => {
  const wrapper = new Masonry('#wrapper', {
    itemSelector: '.col-12',
    percentPosition: true,
  });
  const relayout = () => {
    wrapper.reloadItems();
    wrapper.layout();
  };
  setInterval(relayout, 1000);

  Alpine.data('bgs', () => ({
    username: '',
    usernameParam: '',
    items: null,
    loading: false,
    init() {
      const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
      });
      this.username = this.usernameParam = params.u || '';
      if (!this.username) return;

      this.load();
    },
    async load() {
      this.loading = true;

      // Initiate constants
      const host = 'https://boardgamegeek.com/xmlapi';
      const options = { 'Content-Type': 'application/xml' };
      const parser = new XMLParser({ ignoreAttributes: false });

      // Get collection data and retry
      let resCollection = null;
      while (!resCollection) {
        resCollection = await fetch(host + '/collection/' + this.username, options);
        if (resCollection.status !== 200) {
          resCollection = null;
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      // Parse collection data
      const collectionText = await resCollection.text();
      const collectionObj = parser.parse(collectionText);
      const collection = collectionObj.items.item
        .map((item) => ({
          id: item['@_objectid'],
          image: item.image,
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
        }))
        .filter((item) => item.owned);

      // Sort by rating then name
      collection.sort((a, b) => b.rating - a.rating || b.ratingBgg - a.ratingBgg || a.name.localeCompare(b.name));

      this.items = collection;
      this.loading = false;
      setTimeout(relayout, 10);
    },
  }));
});
