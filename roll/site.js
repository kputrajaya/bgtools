const getParam = (key) => {
  return new URLSearchParams(window.location.search).get(key);
};
const setParam = (key, value) => {
  const params = new URLSearchParams(window.location.search);
  params.set(key, value);
  window.history.replaceState({}, '', window.location.pathname + '?' + params.toString());
};
const copyText = (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text);
    return true;
  }

  // Fallback for unsupported clipboard API
  let copied = false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
    copied = true;
  } catch (e) {}
  document.body.removeChild(textarea);
  return copied;
};
const toast = (message) => {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = 'rgba(60,60,60,0.95)';
  toast.style.color = '#fff';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '6px';
  toast.style.fontSize = '1rem';
  toast.style.zIndex = 9999;
  toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s';
    toast.style.opacity = '0';
    setTimeout(() => document.body.removeChild(toast), 400);
  }, 1200);
};

document.addEventListener('alpine:init', () => {
  Alpine.data('roll', function () {
    return {
      // Data
      input: getParam('d') || '',
      result: null,

      // Computed
      get hasRolled() {
        return this.result !== null;
      },
      get dice() {
        const dice = {};
        (this.input || '')
          .split(/[\s\+]+/)
          .filter((part) => part)
          .forEach((part) => {
            const isMod = /^\-?\d+$/.test(part);
            if (isMod) {
              dice[0] = (dice[0] || 0) + parseInt(part, 10);
              return
            }
            const match = part.match(/^(\d*)d(\d+)$/);
            if (match) {
              const numDice = match[1] ? parseInt(match[1], 10) : 1;
              const numSides = parseInt(match[2], 10);
              dice[numSides] = (dice[numSides] || 0) + numDice;
            }
          });
        if (dice[0] === 0) {
          delete dice[0];
        }
        return Object.entries(dice)
          .sort((a, b) => b[0] - a[0])
          .flatMap(([side, count]) =>
            side > 0 ?
              Array.from({length: count}, () => ({side, result: null})) :
              [{side: 0, result: count}]
          );
      },
      get details() {
        return this.result || this.dice;
      },
      get total() {
        return this.details.reduce((sum, die) => sum + (die.result || 0), 0);
      },

      // Method
      add(part) {
        this.input += ' ' + part;
        this.cleanInput();
      },
      clear() {
        this.input = '';
      },
      cleanInput() {
        const parts = [];
        this.dice.forEach(({side, result}) => {
          const text = side > 0 ? `d${side}` : (result > 0 ? `+${result}` : result);
          const lastPart = parts.length ? parts[parts.length - 1] : null;
          if (side > 0 && lastPart?.text === text) {
            lastPart.count += 1;
          } else {
            parts.push({text, count: 1});
          }
        });
        this.input = parts.map(({text, count}) => count > 1 ? `${count}${text}` : text).join(' ');
      },
      roll() {
        if (this.hasRolled) return;
        this.result = this.dice.map(({side, result}) =>
          side > 0 ? ({side, result: Math.floor(Math.random() * side) + 1}) : ({side, result})
        );
      },
      share() {
        if (copyText(window.location.href)) {
          toast('URL copied to clipboard!');
        }
      },
      restart() {
        window.location.href = window.location.pathname;
      },

      // Initialization
      init() {
        if (!getParam('k')) {
          const key = Array.from({ length: 20 }, () => Math.random().toString(36)[2]).join('');
          setParam('k', key);
          window.location.reload();
        }

        const ps = new PubSub({
          host: 'wss://pubsub.h.kvn.pt',
          appKey: 'roll',
          getData: () => this.result,
          setData: (data) => (this.result = data),
        });
        this.$watch('result', ps.pub);
        this.$watch('input', (value) => {
          setParam('d', value);
        });
      },
    };
  });
});
