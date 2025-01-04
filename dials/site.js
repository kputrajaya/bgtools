document.addEventListener('alpine:init', () => {
  const PRESETS = {
    Gloomhaven: [
      {
        name: 'Players',
        open: true,
        items: [...Array(4).keys()].map((i) => ({
          name: `P${i + 1}`,
          metrics: [{ value: 10 }, { value: 0, context: 'info' }],
          size: 1,
        })),
      },
      ...[...Array(6).keys()].map((i) => ({
        name: `Monster ${i + 1}`,
        open: false,
        items: [...Array(10).keys()].map((j) => ({ name: `${j + 1}`, metrics: [{ value: 0 }], size: 1 })),
      })),
    ],
    'Star Realms': [
      {
        name: 'Players',
        open: true,
        items: [...Array(2).keys()].map((i) => ({
          name: `P${i + 1}`,
          metrics: [{ value: 50 }],
          size: 4,
        })),
      },
      {
        name: 'Players',
        open: false,
        items: [...Array(2).keys()].map((i) => ({
          name: `P${i + 3}`,
          metrics: [{ value: 50 }],
          size: 4,
        })),
      },
    ],
    'Generic: 1 Value': [
      {
        name: 'Players',
        open: true,
        items: [...Array(4).keys()].map((i) => ({ name: `P${i + 1}`, metrics: [{ value: 0 }], size: 4 })),
      },
      {
        name: 'Players',
        open: false,
        items: [...Array(4).keys()].map((i) => ({ name: `P${i + 5}`, metrics: [{ value: 0 }], size: 4 })),
      },
      {
        name: 'Players',
        open: false,
        items: [...Array(4).keys()].map((i) => ({ name: `P${i + 9}`, metrics: [{ value: 0 }], size: 4 })),
      },
    ],
    'Generic: 2 Values': [
      {
        name: 'Players',
        open: true,
        items: [...Array(4).keys()].map((i) => ({
          name: `P${i + 1}`,
          metrics: [{ value: 0 }, { value: 0, context: 'info' }],
          size: 2,
        })),
      },
      {
        name: 'Players',
        open: false,
        items: [...Array(4).keys()].map((i) => ({
          name: `P${i + 5}`,
          metrics: [{ value: 0 }, { value: 0, context: 'info' }],
          size: 2,
        })),
      },
      {
        name: 'Players',
        open: false,
        items: [...Array(4).keys()].map((i) => ({
          name: `P${i + 9}`,
          metrics: [{ value: 0 }, { value: 0, context: 'info' }],
          size: 2,
        })),
      },
    ],
    'Generic: 3 Values': [
      {
        name: 'Players',
        open: true,
        items: [...Array(4).keys()].map((i) => ({
          name: `P${i + 1}`,
          metrics: [{ value: 0 }, { value: 0, context: 'warning' }, { value: 0, context: 'info' }],
          size: 2,
        })),
      },
      {
        name: 'Players',
        open: false,
        items: [...Array(4).keys()].map((i) => ({
          name: `P${i + 5}`,
          metrics: [{ value: 0 }, { value: 0, context: 'warning' }, { value: 0, context: 'info' }],
          size: 2,
        })),
      },
      {
        name: 'Players',
        open: false,
        items: [...Array(4).keys()].map((i) => ({
          name: `P${i + 9}`,
          metrics: [{ value: 0 }, { value: 0, context: 'warning' }, { value: 0, context: 'info' }],
          size: 2,
        })),
      },
    ],
  };

  const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));
  const getParams = () => {
    const params = {};
    const search = window.location.search;
    if (search) {
      search
        .substring(1)
        .split('&')
        .forEach((param) => {
          const [key, value] = param.split('=');
          params[key] = decodeURIComponent(value).replace(/\+/g, ' ').replace(/\|/g, '\n');
        });
    }
    return params;
  };

  Alpine.data('dials', function () {
    return {
      // Constants
      presetKeys: Object.keys(PRESETS),

      // Data
      categories: this.$persist([]),
      lastJson: null,

      // Method
      loadPreset(presetKey) {
        this.categories = deepCopy(PRESETS[presetKey]);
      },
      itemActive(item) {
        return item.note || item.metrics.some((metric) => metric.value > 0);
      },
      editNote(item) {
        const newNote = prompt(`Enter note for ${item.name}:`, item.note || '');
        if (newNote !== null) {
          item.note = newNote.trim();
        }
      },
      metricDecrease(metric) {
        if (metric.value > 0) {
          metric.value--;
        } else {
          metric.value = 0;
        }
      },
      metricIncrease(metric) {
        metric.value++;
      },
      metricBlur(metric) {
        const safeValue = Math.max(0, Math.floor(metric.value) || 0);
        metric.value = null;
        metric.value = safeValue;
      },
      reset() {
        const response = prompt('Reset values? Type "y" to continue.') || '';
        if (response.trim().toLowerCase() !== 'y') return;
        this.categories = [];
      },

      // Initialization
      init() {
        const connect = (subKey) => {
          const ws = new WebSocket('wss://pubsub.h.kvn.pt/');
          ws.onopen = () => {
            console.log('Subscribing to:', subKey);
            ws.send(JSON.stringify({ action: 'sub', key: subKey }));
          };
          ws.onmessage = (event) => {
            console.log('Received data');
            this.lastJson = event.data;
            this.categories = JSON.parse(event.data);
          };
          this.$watch('categories', (value) => {
            const currentJson = JSON.stringify(value);
            if (currentJson === this.lastJson) return;
            this.lastJson = currentJson;
            console.log('Sending data');
            ws.send(JSON.stringify({ action: 'pub', key: subKey, data: value }));
          });
          const interval = setInterval(() => {
            console.log('Sending data (interval)');
            ws.send(JSON.stringify({ action: 'pub', key: subKey, data: this.categories }));
          }, 60000);
          ws.onerror = function (err) {
            console.error('Socket error:', err.message);
            ws.close();
          };
          ws.onclose = (e) => {
            console.log('Socket closed:', e.reason);
            setTimeout(() => connect(subKey), 1000);
            clearInterval(interval);
          };
        };

        const params = getParams();
        if (params.k) {
          connect('dials:' + params.k);
        }
      },
    };
  });
});
