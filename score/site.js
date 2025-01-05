(async () => {
  const MAX_CATEGORIES = 20;
  const MAX_PLAYERS = 20;
  const global = {
    tableContainer: document.getElementById('scoreTable'),
    gameData: { '': ['Category 1', 'Category 2', 'Category 3'] },
    table: null,
    numPlayers: 2,
    debounceTimeout: null,
  };

  function createElm(tag, className = '', attributes = {}) {
    const element = document.createElement(tag);
    element.className = className;
    Object.entries(attributes).forEach(([key, value]) => (element[key] = value));
    return element;
  }

  function createInput(type, className, value, handler = null) {
    const attributes = {
      type,
      value,
      onfocus: (e) => e.target.select(),
    };
    if (handler) {
      attributes.onblur = () => {
        clearTimeout(global.debounceTimeout);
        handler();
      };
      attributes.onkeyup = () => {
        clearTimeout(global.debounceTimeout);
        global.debounceTimeout = setTimeout(() => handler(), 1000);
      };
    }
    return createElm('input', className, attributes);
  }

  function createScoreRow(categoryName = '') {
    const row = createElm('tr');
    row.appendChild(createElm('td')).appendChild(createInput('text', 'p-2 text-start', categoryName));
    for (let i = 1; i <= global.numPlayers; i++) {
      row.appendChild(createElm('td')).appendChild(createInput('tel', 'p-2 text-end', '0', updateTotals));
    }
    return row;
  }

  function createTotalRow() {
    const row = createElm('tr');
    row.appendChild(createElm('th', 'p-2 text-start')).innerText = 'Total';
    for (let i = 1; i <= global.numPlayers; i++) {
      row.appendChild(createElm('th', 'p-2 text-end')).innerText = '0';
    }
    return row;
  }

  function updateTotals() {
    const numRows = global.table.rows.length;
    for (let player = 1; player <= global.numPlayers; player++) {
      const sum = Array.from(global.table.rows)
        .slice(1, -1)
        .reduce((acc, row) => {
          const input = row.cells[player].firstChild;
          const value = parseInt(input.value) || 0;
          input.value = value;
          return acc + value;
        }, 0);
      global.table.rows[numRows - 1].cells[player].innerText = sum;
    }
  }

  async function initialize() {
    // Create table
    global.table = createElm('table', 'table fs-7');
    const headerRow = createElm('tr');
    headerRow.appendChild(createElm('th', 'p-2')).innerText = 'Category';
    for (let i = 1; i <= global.numPlayers; i++) {
      headerRow.appendChild(createElm('th', 'p-2 text-end')).innerText = `P${i}`;
    }
    global.table.appendChild(headerRow);
    global.table.appendChild(createTotalRow());
    global.tableContainer.innerHTML = '';
    global.tableContainer.appendChild(global.table);
    loadCategories('');

    // Load game data
    try {
      const response = await fetch(
        'https://gist.githubusercontent.com/kputrajaya/1e0d9e787c7716a05199659fb42d3ba5/raw/bgtools-score.json'
      );
      global.gameData = Object.assign(global.gameData, await response.json());
    } catch (error) {
      alert('Failed to load game presets!');
    }

    // Create dropdown
    const gameSelect = document.getElementById('gameSelect');
    Object.keys(global.gameData).forEach((game) => {
      if (!game) return;
      const option = createElm('option');
      option.value = game;
      option.textContent = game;
      gameSelect.appendChild(option);
    });
  }

  function loadCategories(selectedGame) {
    const categories = global.gameData[selectedGame];
    while (global.table.rows.length > 2) global.table.deleteRow(1);
    categories.forEach((category) => global.table.insertBefore(createScoreRow(category), global.table.lastChild));
    updateTotals();
  }

  function addRow() {
    const numCategories = global.table.rows.length - 2;
    if (numCategories >= MAX_CATEGORIES) return;

    global.table.insertBefore(createScoreRow(`Category ${numCategories + 1}`), global.table.lastChild);
  }

  function addColumn() {
    if (global.numPlayers >= MAX_PLAYERS) return;

    global.numPlayers++;
    global.table.rows[0].appendChild(createElm('th', 'p-2 text-end')).innerText = `P${global.numPlayers}`;
    for (let i = 1; i < global.table.rows.length - 1; i++) {
      global.table.rows[i]
        .appendChild(createElm('td'))
        .appendChild(createInput('tel', 'p-2 text-end', '0', updateTotals));
    }
    global.table.rows[global.table.rows.length - 1].appendChild(createElm('th', 'total p-2 text-end')).innerText = '0';
    updateTotals();
  }

  await initialize();
  document.getElementById('gameSelect').addEventListener('change', (e) => loadCategories(e.target.value));
  document.getElementById('addRowBtn').addEventListener('click', addRow);
  document.getElementById('addColumnBtn').addEventListener('click', addColumn);
})();
