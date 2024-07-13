document.addEventListener('alpine:init', () => {
  const defaultUsername = 'kputrajaya';
  const masonryWrapper = new Masonry('#wrapper', {
    itemSelector: '.col-12',
    percentPosition: true,
    transitionDuration: 0,
  });
  const xmlParser = new XMLParser({ ignoreAttributes: false });

  const fetchBgg = async (path) => {
    let fetchRes = null;
    const url = `https://boardgamegeek.com/xmlapi2/${path}`;
    const options = { 'Content-Type': 'application/xml' };
    while (true) {
      fetchRes = await fetch(url, options).catch(() => null);
      if (fetchRes && fetchRes.status === 200) break;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    const collectionText = await fetchRes.text();
    return xmlParser.parse(collectionText);
  };
  const getGames = async (username) => {
    const collectionObj = await fetchBgg(
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
        rating: Math.floor(item.stats.rating['@_value']) || null,
        ratingBgg: Math.round(parseFloat(item.stats.rating.average['@_value']) * 10) / 10,
        ratingBggCount:
          item.stats.rating.usersrated['@_value'].length > 3
            ? Math.round(Math.floor(item.stats.rating.usersrated['@_value']) / 1000) + 'k'
            : item.stats.rating.usersrated['@_value'],
        rank: Math.floor((item.stats.rating.ranks.rank[0] || item.stats.rating.ranks.rank)['@_value']),
        comment: item.comment,
        enriched: {},
      }))
      .sort((a, b) => b.rating - a.rating || a.rank - b.rank);
    return collection;
  };
  const getExpansions = async (username) => {
    const collectionObj = await fetchBgg(`collection/?username=${username}&own=1&subtype=boardgameexpansion`);
    const collection = collectionObj.items.item
      .map((item) => ({
        id: item['@_objectid'],
        image: item.thumbnail,
        name: String(item.name['#text']),
        year: item.yearpublished,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return collection;
  };
  const getThings = async (thingIds) => {
    let result = [];
    const chunkSize = 100;
    for (let i = 0; i < thingIds.length; i += chunkSize) {
      const thingObj = await fetchBgg(
        `thing?id=${thingIds.slice(i, i + chunkSize).join(',')}&stats=1&pagesize=${chunkSize}`
      );
      const things = thingObj.items.item.map((item) => ({
        id: item['@_id'],
        parentIds: item.link.filter((link) => link['@_type'] === 'boardgameexpansion').map((link) => link['@_id']),
        weight: parseFloat(item.statistics.ratings.averageweight['@_value']) || null,
        playersBest: item.poll
          .find((item) => item['@_name'] === 'suggested_numplayers')
          .results.filter((result) => {
            let voteBest = 0;
            let voteReco = 0;
            let voteNotReco = 0;
            result.result.forEach((result) => {
              switch (result['@_value']) {
                case 'Best':
                  voteBest = Math.floor(result['@_numvotes']);
                  break;
                case 'Recommended':
                  voteReco = Math.floor(result['@_numvotes']);
                  break;
                case 'Not Recommended':
                  voteNotReco = Math.floor(result['@_numvotes']);
                  break;
              }
            });
            return voteBest > voteReco && voteBest > voteNotReco;
          })
          .map((result) => Math.floor(result['@_numplayers'])),
      }));
      result = result.concat(things);
    }
    return result;
  };
  const relayout = () => {
    masonryWrapper.reloadItems();
    masonryWrapper.layout();
  };

  setInterval(relayout, 750);

  Alpine.data('bgs', () => ({
    // Constants
    ITEMS_LIMIT: 1000,
    FILTER_PLAYER_MAX: 10,

    // Data
    username: '',
    items: null,
    filter: { player: null, playTime: null, weight: null },
    loading: false,

    // Computed
    itemsLength() {
      return this.items ? this.items.length : 0;
    },
    itemsSliced() {
      if (!this.items) return [];

      let items = this.items;
      if (this.filter.player) {
        items = items.filter(
          (item) => item.players.min <= this.filter.player && item.players.max >= this.filter.player
        );
      }
      if (this.filter.playTime) {
        items = items.filter((item) => item.playTime.max <= this.filter.playTime);
      }
      if (this.filter.weight) {
        items = items.filter(
          (item) => item.enriched.weight >= this.filter.weight && item.enriched.weight < this.filter.weight + 1
        );
      }
      return items.slice(0, this.ITEMS_LIMIT);
    },
    filterPlayerOptions() {
      if (!this.items) return [];

      const counter = {};
      this.items.forEach((item) => {
        for (let i = item.players.min; i <= item.players.max && i <= this.FILTER_PLAYER_MAX; i++) {
          counter[i] = (counter[i] || 0) + 1;
        }
      });
      return Object.keys(counter)
        .sort((a, b) => a - b)
        .map((count) => ({
          value: count,
          text: `${count < this.FILTER_PLAYER_MAX ? count : this.FILTER_PLAYER_MAX + '+'} player${count > 1 ? 's' : ''}
            (${this.formatNumber(counter[count])})`,
        }));
    },
    filterPlayTimeOptions() {
      if (!this.items) return [];

      const counter = { 30: 0, 60: 0, 120: 0 };
      this.items.forEach((item) => {
        for (let duration in counter) {
          if (duration >= item.playTime.max) {
            counter[duration] += 1;
          }
        }
      });
      return Object.keys(counter).map((minutes) => ({
        value: minutes,
        text: `${minutes} minutes (${this.formatNumber(counter[minutes])})`,
      }));
    },
    filterWeightOptions() {
      if (!this.items) return [];

      const counter = {};
      this.items.forEach((item) => {
        const group = Math.floor(item.enriched.weight);
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
    formatCounts(nums) {
      if (!nums) return '';

      const groups = [];
      let currentStart = null;
      let lastNum = null;
      for (let i = 0; i <= nums.length; i++) {
        if (lastNum && nums[i] === lastNum + 1) {
          lastNum = nums[i];
          continue;
        }
        if (currentStart) {
          groups.push(currentStart === lastNum ? lastNum : `${currentStart}–${lastNum}`);
        }
        currentStart = lastNum = nums[i];
      }
      return groups.join(', ');
    },
    init() {
      const params = new URLSearchParams(window.location.search);
      this.username = params.get('u') || defaultUsername;
      if (!this.username) return;
      this.load();
    },
    async load() {
      this.loading = true;

      this.items = await getGames(this.username);
      setTimeout(relayout, 10);

      this.loading = false;
      this.enrich();
    },
    async enrich() {
      // Get thing IDs
      const gameIds = new Set(this.items.map((item) => item.id));
      const expansions = await getExpansions(this.username);
      const expansionIds = new Set(expansions.map((expansion) => expansion.id));
      const expansionMap = Object.fromEntries(expansions.map((expansion) => [expansion.id, expansion]));

      // Get things and store data in a map
      const things = await getThings([...expansionIds, ...gameIds]);
      const itemMap = {};
      things.forEach((thing) => {
        if (gameIds.has(thing.id)) {
          itemMap[thing.id] = itemMap[thing.id] || {};
          itemMap[thing.id].weight = thing.weight;
          itemMap[thing.id].playersBest = thing.playersBest;
        } else if (expansionIds.has(thing.id)) {
          thing.parentIds.forEach((parentId) => {
            if (!gameIds.has(parentId)) return;
            itemMap[parentId] = itemMap[parentId] || {};
            itemMap[parentId].expansions = [...(itemMap[parentId].expansions || []), expansionMap[thing.id]];
          });
        }
      });

      // Enrich item data
      this.items.forEach((item) => {
        item.enriched = itemMap[item.id] || {};
      });
      console.log(this.items);
    },
  }));
});
