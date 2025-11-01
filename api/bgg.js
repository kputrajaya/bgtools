module.exports = async (req, res) => {
  const { path } = req.query;
  const targetUrl = `https://boardgamegeek.com/xmlapi2/${path}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${process.env.BGG_API_KEY}`,
      },
    });
    if (!response.ok) {
      throw new Error(`BoardGameGeek API responded with status: ${response.status}`);
    }

    const data = await response.text();
    res.setHeader('Content-Type', response.headers.get('Content-Type'));
    res.status(200).send(data);
  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).send('Error proxying request');
  }
};
