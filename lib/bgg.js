const { XMLParser, XMLValidator } = require('fast-xml-parser');

const BGG_HOST = 'https://boardgamegeek.com';
const MAX_RETRIES = 4;
const DEFAULT_RETRY_DELAY_MS = 3000;
const MAX_RETRY_WAIT_MS = MAX_RETRIES * DEFAULT_RETRY_DELAY_MS;
const RETRYABLE_STATUSES = new Set([202, 429, 503]);
const PENDING_MESSAGE = /accepted.*processed|try again later|request is pending/i;
const parser = new XMLParser({ ignoreAttributes: false });

class BggApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'BggApiError';
    this.statusCode = statusCode;
  }
}

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

const queryBgg = async (targetUrl) => {
  if (!process.env.BGG_API_KEY) throw new BggApiError(500, 'BGG API key is not configured');

  let totalRetryWait = 0;
  const retry = async (attempt, delay) => {
    if (attempt >= MAX_RETRIES || totalRetryWait + delay > MAX_RETRY_WAIT_MS) return false;
    totalRetryWait += delay;
    await wait(delay);
    return true;
  };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    let response;
    try {
      response = await fetch(targetUrl, {
        headers: { Authorization: `Bearer ${process.env.BGG_API_KEY}` },
      });
    } catch {
      if (!(await retry(attempt, DEFAULT_RETRY_DELAY_MS))) {
        throw new BggApiError(502, 'Unable to reach BoardGameGeek');
      }
      continue;
    }

    if (RETRYABLE_STATUSES.has(response.status)) {
      const delay = getRetryDelay(response.headers.get('Retry-After'));
      await response.text().catch(() => '');
      if (!(await retry(attempt, delay))) {
        throw new BggApiError(503, 'BGG is still processing the request; try again later');
      }
      continue;
    }

    if (!response.ok) {
      console.error(`BoardGameGeek API responded with status: ${response.status}`);
      throw new BggApiError(502, 'BoardGameGeek request failed');
    }

    let data;
    try {
      data = parseXml(await response.text());
    } catch {
      throw new BggApiError(502, 'BGG returned invalid XML');
    }

    const message = data.items?.message ?? data.message;
    if (message) {
      const messageText = typeof message === 'object' ? message['#text'] : message;
      if (PENDING_MESSAGE.test(messageText || '')) {
        if (!(await retry(attempt, DEFAULT_RETRY_DELAY_MS))) {
          throw new BggApiError(503, 'BGG is still processing the request; try again later');
        }
        continue;
      }
      throw new BggApiError(502, `BoardGameGeek: ${messageText || 'request failed'}`);
    }

    return data;
  }

  throw new BggApiError(503, 'BGG is still processing the request; try again later');
};

const sendBggResponse = async (targetUrl, res) => {
  try {
    return res.status(200).json(await queryBgg(targetUrl));
  } catch (error) {
    const bggError = error instanceof BggApiError ? error : null;
    if (!bggError) console.error('BGG request failed:', error);
    return res.status(bggError?.statusCode || 502).json({ error: bggError?.message || 'BGG request failed' });
  }
};

const constructBggHandler = (req, res, buildTargetPath) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  let targetPath;
  try {
    targetPath = buildTargetPath(req.query || {});
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Invalid request parameters' });
  }

  const targetUrl = `${BGG_HOST}${targetPath}`;
  return sendBggResponse(targetUrl, res);
};

module.exports = { BGG_HOST, constructBggHandler };
