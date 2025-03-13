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

document.addEventListener('alpine:init', () => {
  const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

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
        const ps = new PubSub({
          host: 'pubsub.h.kvn.pt',
          appKey: 'dials',
          getData: () => this.categories,
          setData: (data) => (this.categories = data),
        });
        this.$watch('categories', ps.pub);
      },
    };
  });
});
