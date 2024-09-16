(() => {
  const gameData = {
    'A Feast for Odin': [
      'Boats and Ships',
      'Emigrated Ships',
      'Sheeps and Cattles',
      'English Crown',
      'Exploration Boards',
      'Sheds and Houses',
      'Final Income',
      'Silver',
      'Occupations',
      'Negative Points',
      'Thing Penalties',
    ],
    Agricola: [
      'Fields',
      'Pastures',
      'Fenced Stables',
      'Unused Spaces',
      'Grain',
      'Vegetables',
      'Sheeps',
      'Wild Boars',
      'Cattles',
      'Clay Rooms',
      'Stone Rooms',
      'Family Members',
      'Card Points',
      'Bonus Points',
      'Begging Tokens',
    ],
    Earth: [
      'Base Point',
      'Event',
      'Compost',
      'Sprout',
      'Growth',
      'Terrain Bonus',
      'Shared Ecosystem',
      'Personal Ecosystem',
      'Fauna',
      'First to Complete',
    ],
    Evacuation: [
      'Lowest Production',
      'Goal Card 1',
      'Goal Card 2',
      'Goal Card 3',
      'Happy Face Bonus',
      'Old World Sites',
      'Old World Populations',
      'Missing Stadiums',
      'Penalty Chips',
    ],
    'Gaia Project': ['VP Track', 'Research Track', 'Final Scoring', 'Resources'],
    Keyflower: ['Fixed Points Tiles', 'Autumn Tiles', 'Winter Tiles', 'Boat Tiles', 'Turn Order Tiles', 'Gold'],
    Nusfjord: ['Boats', 'Buildings', 'Unused Spaces', 'Shares', 'Unissued Shares', 'Golds'],
    'Rising Sun': ['VP Track', 'Province Tokens', 'Province Set Bonus', 'Winter Upgrades'],
  };

  const tableContainer = document.getElementById('scoreTable');
  let table;
  let numPlayers = 1;

  function createElm(tag, className, attributes = {}) {
    const element = document.createElement(tag);
    element.className = className;
    Object.entries(attributes).forEach(([key, value]) => (element[key] = value));
    return element;
  }

  function createInput(type, className, value, onfocus, onblur) {
    return createElm('input', className, { type, value, onfocus, onblur });
  }

  function createScoreRow(numPlayers, categoryName = '') {
    const row = document.createElement('tr');
    row
      .appendChild(createElm('td'))
      .appendChild(createInput('text', 'p-2 text-start', categoryName, (e) => e.target.select()));
    for (let i = 1; i <= numPlayers; i++) {
      row
        .appendChild(createElm('td'))
        .appendChild(createInput('tel', 'p-2 text-end', '0', (e) => e.target.select(), updateTotals));
    }
    return row;
  }

  function createTotalRow(numPlayers) {
    const row = document.createElement('tr');
    row.appendChild(createElm('th', 'p-2 text-start')).innerText = 'Total';
    for (let i = 1; i <= numPlayers; i++) {
      row.appendChild(createElm('th', 'p-2 text-end')).innerText = '0';
    }
    return row;
  }

  function generateTable() {
    table = createElm('table', 'table');
    const headerRow = document.createElement('tr');
    headerRow.appendChild(createElm('th', 'p-2')).innerText = 'Category';
    for (let i = 1; i <= numPlayers; i++) {
      headerRow.appendChild(createElm('th', 'p-2 text-end')).innerText = `P${i}`;
    }
    table.appendChild(headerRow);
    for (let i = 0; i < 3; i++) {
      table.appendChild(createScoreRow(numPlayers, `Category ${i + 1}`));
    }
    table.appendChild(createTotalRow(numPlayers));
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
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

  function loadCategories() {
    const gameList = Object.keys(gameData);
    const promptOptions = gameList.map((game, index) => `${index + 1}. ${game}`).join('\n');
    const selectedGameIndex = Math.floor(prompt(`Load categories for a game:\n${promptOptions}`));
    if (selectedGameIndex && selectedGameIndex > 0 && selectedGameIndex <= gameList.length) {
      const categories = gameData[gameList[selectedGameIndex - 1]];
      while (table.rows.length > 2) table.deleteRow(1);
      categories.forEach((category) => table.insertBefore(createScoreRow(numPlayers, category), table.lastChild));
      updateTotals();
    }
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
      table.rows[i]
        .appendChild(createElm('td'))
        .appendChild(createInput('tel', 'p-2 text-end', '0', (e) => e.target.select(), updateTotals));
    }
    table.rows[table.rows.length - 1].appendChild(createElm('th', 'total p-2 text-end')).innerText = '0';
    updateTotals();
  }

  generateTable();
  document.getElementById('loadBtn').addEventListener('click', loadCategories);
  document.getElementById('addRowBtn').addEventListener('click', addRow);
  document.getElementById('addColumnBtn').addEventListener('click', addColumn);
})();
