document.addEventListener('alpine:init', () => {
  const defaultUsername = 'kputrajaya';
  const pubsubHost = 'https://pubsub.h.kvn.pt';
  const masonryWrapper = new Masonry('#wrapper', {
    itemSelector: '.col-12',
    percentPosition: true,
    transitionDuration: 0,
  });
  const xmlParser = new XMLParser({ ignoreAttributes: false });

  const _fetchBgg = async (path) => {
    const url = `https://boardgamegeek.com/xmlapi2/${path}`;
    const options = { 'Content-Type': 'application/xml' };
    let fetchRes;
    do {
      fetchRes = await fetch(url, options).catch(() => null);
      if (fetchRes && fetchRes.status === 200) break;
      await new Promise((resolve) => setTimeout(resolve, 2500));
    } while (true);
    const collectionText = await fetchRes.text();
    return xmlParser.parse(collectionText);
  };
  const ensureArray = (value) => (value ? (Array.isArray(value) ? value : [value]) : []);
  const getGames = async (username) => {
    const collectionObj = await _fetchBgg(
      `collection/?username=${username}&own=1&excludesubtype=boardgameexpansion&stats=1`
    );
    return ensureArray(collectionObj?.items?.item)
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
        ratingBggCount: _formatRatingCount(item.stats.rating.usersrated['@_value']),
        rank: Math.floor((item.stats.rating.ranks.rank[0] || item.stats.rating.ranks.rank)['@_value']),
        comment: item.comment,
        enriched: {},
      }))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (a.rank || 999999) - (b.rank || 999999));
  };
  const _formatRatingCount = (count) => {
    return count.length > 3 ? Math.floor(Math.floor(count) / 1000) + 'k' : count;
  };
  const getExpansions = async (username) => {
    const collectionObj = await _fetchBgg(`collection/?username=${username}&own=1&subtype=boardgameexpansion`);
    return ensureArray(collectionObj?.items?.item)
      .map((item) => ({
        id: item['@_objectid'],
        image: item.thumbnail,
        name: String(item.name['#text']),
        year: item.yearpublished,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };
  const getThings = async (thingIds) => {
    const chunkSize = 20;
    const chunks = [];
    for (let i = 0; i < thingIds.length; i += chunkSize) {
      chunks.push(thingIds.slice(i, i + chunkSize));
    }
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const chunkThingIds = chunk.join(',');
        const cacheKey = `bgshelf:${chunkThingIds}`;

        const cached = await fetch(`${pubsubHost}/get/${cacheKey}`)
          .then((res) => res.json())
          .catch(() => null);
        if (cached) return cached;

        const thingObj = await _fetchBgg(`thing?id=${chunkThingIds}&stats=1&pagesize=${chunkSize}`);
        const chunkResult = ensureArray(thingObj?.items?.item).map((item) => ({
          id: item['@_id'],
          parentIds: ensureArray(item.link)
            .filter((link) => link['@_type'] === 'boardgameexpansion')
            .map((link) => link['@_id']),
          weight: parseFloat(item.statistics.ratings.averageweight['@_value']) || null,
          playersBest: _getBestPlayerCount(item),
        }));
        fetch(`${pubsubHost}/set/${cacheKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunkResult),
        }).catch(() => null);
        return chunkResult;
      })
    );
    return results.flat();
  };
  const _getBestPlayerCount = (item) => {
    const playerPoll = item.poll.find((poll) => poll['@_name'] === 'suggested_numplayers');
    return ensureArray(playerPoll.results)
      .filter((result) => {
        const votes = result.result.reduce((acc, vote) => {
          acc[vote['@_value']] = Math.floor(vote['@_numvotes']);
          return acc;
        }, {});
        const totalVotes = (votes.Best || 0) + (votes.Recommended || 0) + (votes['Not Recommended'] || 0);
        return votes.Best >= totalVotes / 2;
      })
      .map((result) => Math.floor(result['@_numplayers']));
  };
  const relayout = () => {
    setTimeout(() => {
      masonryWrapper.reloadItems();
      masonryWrapper.layout();
    }, 50);
  };

  setInterval(relayout, 1000);

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
      if (this.filter.player !== null) {
        items = items.filter(
          (item) => item.players.max >= this.filter.player && item.players.min <= this.filter.player
        );
      }
      if (this.filter.playTime !== null) {
        items = items.filter(
          (item) => item.playTime.max >= this.filter.playTime && item.playTime.max < this.filter.playTime + 60
        );
      }
      if (this.filter.weight !== null) {
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
        for (let i = item.players.min; i <= Math.min(item.players.max, this.FILTER_PLAYER_MAX); i++) {
          counter[i] = (counter[i] || 0) + 1;
        }
      });
      return Object.entries(counter)
        .sort(([a], [b]) => a - b)
        .map(([player, count]) => ({
          value: player,
          text: `${player < this.FILTER_PLAYER_MAX ? player : this.FILTER_PLAYER_MAX + '+'}
            (${this.formatNumber(count)})`,
        }));
    },
    filterPlayTimeOptions() {
      if (!this.items) return [];

      const durations = [180, 120, 60, 0];
      const counter = Object.fromEntries(durations.map((duration) => [duration, 0]));
      this.items.forEach((item) => {
        durations.some((duration) => {
          if (duration <= item.playTime.max) {
            counter[duration] += 1;
            return true;
          }
          return false;
        });
      });
      return Object.entries(counter).map(([minutes, count]) => ({
        value: minutes,
        text: `${minutes}+ min (${this.formatNumber(count)})`,
      }));
    },
    filterWeightOptions() {
      if (!this.items) return [];

      const counter = {};
      this.items.forEach((item) => {
        const group = Math.floor(item.enriched.weight);
        if (group) {
          counter[group] = (counter[group] || 0) + 1;
        }
      });
      return Object.entries(counter)
        .sort(([a], [b]) => a - b)
        .map(([group, count]) => ({
          value: group,
          text: `${group}+ (${this.formatNumber(count)})`,
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
          groups.push(currentStart === lastNum ? lastNum : `${currentStart}−${lastNum}`);
        }
        currentStart = lastNum = nums[i];
      }
      return groups.join(', ');
    },
    async load() {
      this.loading = true;
      this.items = await getGames(this.username);
      relayout();
      this.loading = false;

      await this.enrich();
      relayout();
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
            if (gameIds.has(parentId)) {
              itemMap[parentId] = itemMap[parentId] || {};
              itemMap[parentId].expansions = [...ensureArray(itemMap[parentId].expansions), expansionMap[thing.id]];
            }
          });
        }
      });

      // Enrich item data
      this.items.forEach((item) => {
        item.enriched = itemMap[item.id] || {};
      });
    },

    // Initialization
    init() {
      const params = new URLSearchParams(window.location.search);
      this.username = params.get('u') || defaultUsername;
      if (this.username) {
        this.load();
      }
      this.$watch('filter', relayout);
    },
  }));
});
