module.exports = async (req, res) => {
  const { path } = req.query;
  const url = `https://boardgamegeek.com/xmlapi2/${path}`;

  try {
    const fetchRes = await fetch(url);
    const data = await fetchRes.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/xml');
    res.send(data);
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
};
