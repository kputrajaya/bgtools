(async () => {
  const tableContainer = document.getElementById('scoreTable');
  let gameData = {};
  let table;
  let numPlayers = 2;

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
      let timeout;
      const debouncedHandler = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => handler(this), 1000);
      };
      attributes.onblur = handler;
      attributes.onkeyup = debouncedHandler;
    }
    return createElm('input', className, attributes);
  }

  function createScoreRow(numPlayers, categoryName = '') {
    const row = createElm('tr');
    row.appendChild(createElm('td')).appendChild(createInput('text', 'p-2 fs-7 text-start', categoryName));
    for (let i = 1; i <= numPlayers; i++) {
      row.appendChild(createElm('td')).appendChild(createInput('tel', 'p-2 text-end', '0', updateTotals));
    }
    return row;
  }

  function createTotalRow(numPlayers) {
    const row = createElm('tr');
    row.appendChild(createElm('th', 'p-2 fs-7 text-start')).innerText = 'Total';
    for (let i = 1; i <= numPlayers; i++) {
      row.appendChild(createElm('th', 'p-2 text-end')).innerText = '0';
    }
    return row;
  }

  function updateTotals() {
    const numRows = table.rows.length;
    for (let player = 1; player <= numPlayers; player++) {
      const sum = Array.from(table.rows)
        .slice(1, -1)
        .reduce((acc, row) => {
          const input = row.cells[player].firstChild;
          const value = parseInt(input.value) || 0;
          input.value = value;
          return acc + value;
        }, 0);
      table.rows[numRows - 1].cells[player].innerText = sum;
    }
  }

  async function initialize() {
    // Load game data
    const response = await fetch(
      'https://gist.githubusercontent.com/kputrajaya/1e0d9e787c7716a05199659fb42d3ba5/raw/bgtools-score.json'
    );
    gameData = await response.json();

    // Create dropdown
    const gameSelect = document.getElementById('gameSelect');
    Object.keys(gameData).forEach((game) => {
      if (!game) return;
      const option = createElm('option');
      option.value = game;
      option.textContent = game;
      gameSelect.appendChild(option);
    });

    // Create table
    table = createElm('table', 'table');
    const headerRow = createElm('tr', 'fs-7');
    headerRow.appendChild(createElm('th', 'p-2')).innerText = 'Category';
    for (let i = 1; i <= numPlayers; i++) {
      headerRow.appendChild(createElm('th', 'p-2 text-end')).innerText = `P${i}`;
    }
    table.appendChild(headerRow);
    table.appendChild(createTotalRow(numPlayers));
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
    loadCategories('');
  }

  function loadCategories(selectedGame) {
    const categories = gameData[selectedGame];
    while (table.rows.length > 2) table.deleteRow(1);
    categories.forEach((category) => table.insertBefore(createScoreRow(numPlayers, category), table.lastChild));
    updateTotals();
  }

  function addRow() {
    const numCategories = table.rows.length - 2;
    if (numCategories >= 20) return;
    table.insertBefore(createScoreRow(numPlayers, `Category ${numCategories + 1}`), table.lastChild);
  }

  function addColumn() {
    if (numPlayers >= 20) return;
    numPlayers++;
    table.rows[0].appendChild(createElm('th', 'p-2 text-end')).innerText = `P${numPlayers}`;
    for (let i = 1; i < table.rows.length - 1; i++) {
      table.rows[i].appendChild(createElm('td')).appendChild(createInput('tel', 'p-2 text-end', '0', updateTotals));
    }
    table.rows[table.rows.length - 1].appendChild(createElm('th', 'total p-2 text-end')).innerText = '0';
    updateTotals();
  }

  await initialize();
  document.getElementById('gameSelect').addEventListener('change', (e) => loadCategories(e.target.value));
  document.getElementById('addRowBtn').addEventListener('click', addRow);
  document.getElementById('addColumnBtn').addEventListener('click', addColumn);
})();
