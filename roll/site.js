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
      dice: getParam('d') || '',
      result: null,

      // Computed
      get hasRolled() {
        return this.result !== null;
      },
      get details() {
        if (this.result) return this.result;
        const allDice = (this.dice || '')
          .split(/[\s\+]+/)
          .filter((part) => part)
          .flatMap((part) => {
            // If a modifier
            const isMod = /^\-?\d+$/.test(part);
            if (isMod) {
              const value = parseInt(part, 10);
              return [{ side: null, result: value }];
            }

            // If a die
            const match = part.match(/^(\d*)d(\d+)$/);
            if (match) {
              const numDice = match[1] ? parseInt(match[1], 10) : 1;
              const numSides = parseInt(match[2], 10);
              return Array(numDice).fill({
                side: numSides,
                result: null,
              });
            }

            // Invalid
            return [null];
          });
        return allDice.every((die) => die) ? allDice : [];
      },
      get total() {
        return this.details.reduce((sum, die) => sum + (die.result || 0), 0);
      },

      // Method
      addDice(part) {
        this.dice = (this.dice.trim() + ' ' + part).trim();
      },
      clearDice() {
        this.dice = '';
      },
      roll() {
        if (this.hasRolled || !this.details.length) return;
        this.result = this.details.map((die) =>
          die.side ? { ...die, result: Math.floor(Math.random() * die.side) + 1 } : die
        );
      },
      share() {
        const copied = copyText(window.location.href);
        if (copied) {
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
        this.$watch('dice', (value) => {
          setParam('d', value);
        });
      },
    };
  });
});
