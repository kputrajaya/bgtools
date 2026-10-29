const { XMLParser, XMLValidator } = require('fast-xml-parser');

const MAX_RETRIES = 4;
const DEFAULT_RETRY_DELAY_MS = 3000;
const MAX_RETRY_WAIT_MS = MAX_RETRIES * DEFAULT_RETRY_DELAY_MS;
const RETRYABLE_STATUSES = new Set([202, 429, 503]);
const PENDING_MESSAGE = /accepted.*processed|try again later|request is pending/i;
const parser = new XMLParser({ ignoreAttributes: false });

const parseXml = (xml) => {
  if (XMLValidator.validate(xml) !== true) throw new Error('BGG returned invalid XML');
  const data = parser.parse(xml);
  if (!data || typeof data !== 'object' || !Object.keys(data).length) throw new Error('BGG returned empty XML');
  return data;
};

const getRetryDelay = (retryAfter) => {
  if (!retryAfter) return DEFAULT_RETRY_DELAY_MS;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;

  const retryAt = Date.parse(retryAfter);
  return Number.isNaN(retryAt) ? DEFAULT_RETRY_DELAY_MS : Math.max(0, retryAt - Date.now());
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const queryBgg = async (targetUrl, res) => {
  if (!process.env.BGG_API_KEY) return res.status(500).json({ error: 'BGG API key is not configured' });

  let retries = 0;
  let totalRetryWait = 0;
  const retry = async (delay) => {
    if (retries >= MAX_RETRIES || totalRetryWait + delay > MAX_RETRY_WAIT_MS) return false;
    retries += 1;
    totalRetryWait += delay;
    await wait(delay);
    return true;
  };

  try {
    while (true) {
      const response = await fetch(targetUrl, {
        headers: { Authorization: `Bearer ${process.env.BGG_API_KEY}` },
      });

      if (RETRYABLE_STATUSES.has(response.status)) {
        const delay = getRetryDelay(response.headers.get('Retry-After'));
        await response.text();
        if (await retry(delay)) continue;
        return res.status(503).json({ error: 'BGG is still processing the request; try again later' });
      }

      if (!response.ok) {
        console.error(`BoardGameGeek API responded with status: ${response.status}`);
        return res.status(502).json({ error: 'BoardGameGeek request failed' });
      }

      const data = parseXml(await response.text());
      const message = data.items?.message ?? data.message;
      if (!message) return res.status(200).json(data);

      const messageText = typeof message === 'object' ? message['#text'] : message;
      if (PENDING_MESSAGE.test(messageText || '')) {
        if (await retry(DEFAULT_RETRY_DELAY_MS)) continue;
        return res.status(503).json({ error: 'BGG is still processing the request; try again later' });
      }
      return res.status(502).json({ error: `BoardGameGeek: ${messageText || 'request failed'}` });
    }
  } catch (error) {
    console.error('Error proxying BGG request:', error);
    return res.status(502).json({ error: 'Error proxying BoardGameGeek request' });
  }
};

module.exports = { queryBgg };
