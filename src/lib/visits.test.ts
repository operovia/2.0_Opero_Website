import { describe, expect, it } from 'vitest';
import { countryFrom, deviceOf, fillDays, isBot, plainHost, referrerHost, todayIn, visitDay, visitorCode } from './visits';

const safari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

describe('isBot', () => {
  it('knows crawlers, link previews, monitors and scripts by name', () => {
    for (const name of [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
      'curl/8.4.0',
      'python-requests/2.31',
      'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120.0.0.0',
      'UptimeRobot/2.0; http://www.uptimerobot.com/',
      '',
    ]) {
      expect(isBot(name), name).toBe(true);
    }
  });

  it('takes a person’s browser for one', () => {
    expect(isBot(safari)).toBe(false);
    expect(isBot(iphone)).toBe(false);
    expect(isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')).toBe(false);
  });
});

describe('deviceOf', () => {
  it('tells phones and tablets from desktops', () => {
    expect(deviceOf(iphone)).toBe('mobile');
    expect(deviceOf('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36')).toBe('mobile');
    expect(deviceOf('Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1')).toBe(
      'mobile',
    );
    expect(deviceOf(safari)).toBe('desktop');
    expect(deviceOf('')).toBe('desktop');
  });
});

describe('referrerHost', () => {
  const own = ['operovia.com', 'www.operovia.com:443', 'opero-site.replit.app'];

  it('keeps the host of an outside page, without www, the path or the port', () => {
    expect(referrerHost('https://www.linkedin.com/feed/update/123', own)).toBe('linkedin.com');
    expect(referrerHost('https://news.ycombinator.com:443/item?id=1', own)).toBe('news.ycombinator.com');
    expect(referrerHost('HTTPS://T.CO/abc', own)).toBe('t.co');
  });

  it('reads a direct visit, an unreadable header and a link from this site as nothing', () => {
    expect(referrerHost(null, own)).toBe('');
    expect(referrerHost(undefined, own)).toBe('');
    expect(referrerHost('', own)).toBe('');
    expect(referrerHost('not a url', own)).toBe('');
    expect(referrerHost('https://operovia.com/partners', own)).toBe('');
    expect(referrerHost('https://www.operovia.com/', own)).toBe('');
    expect(referrerHost('https://opero-site.replit.app/founder', own)).toBe('');
  });

  it('cuts a host that goes on and on', () => {
    expect(referrerHost(`https://${'a'.repeat(300)}.example/`, own)).toHaveLength(200);
  });
});

describe('plainHost', () => {
  it('lowercases, drops the port and a leading www', () => {
    expect(plainHost(' WWW.Operovia.com:3000 ')).toBe('operovia.com');
    expect(plainHost('localhost:3100')).toBe('localhost');
    expect(plainHost('')).toBe('');
  });
});

describe('visitorCode', () => {
  it('reads the same for the same person all day and differently tomorrow, the address or the browser changed, or another salt', () => {
    const code = visitorCode('salt', '2026-10-09', '203.0.113.5', safari);
    expect(code).toHaveLength(32);
    expect(visitorCode('salt', '2026-10-09', '203.0.113.5', safari)).toBe(code);
    expect(visitorCode('salt', '2026-10-10', '203.0.113.5', safari)).not.toBe(code);
    expect(visitorCode('salt', '2026-10-09', '203.0.113.6', safari)).not.toBe(code);
    expect(visitorCode('salt', '2026-10-09', '203.0.113.5', iphone)).not.toBe(code);
    expect(visitorCode('pepper', '2026-10-09', '203.0.113.5', safari)).not.toBe(code);
  });

  it('never carries the address itself', () => {
    expect(visitorCode('salt', '2026-10-09', '203.0.113.5', safari)).not.toContain('203');
  });

  it('takes the day from the UTC date', () => {
    expect(visitDay(new Date('2026-10-09T23:59:59Z'))).toBe('2026-10-09');
    expect(visitDay(new Date('2026-10-10T00:00:00Z'))).toBe('2026-10-10');
  });
});

describe('countryFrom', () => {
  it('takes the first platform header that names a country, uppercase', () => {
    expect(countryFrom((name) => (name === 'cf-ipcountry' ? 'us' : null))).toBe('US');
    expect(countryFrom((name) => (name === 'x-vercel-ip-country' ? 'CA' : null))).toBe('CA');
    expect(countryFrom((name) => (name === 'cf-ipcountry' ? 'XX' : name === 'x-country-code' ? 'GB' : null))).toBe('GB');
  });

  it('reads nothing when no header says, or says something that is not a country', () => {
    expect(countryFrom(() => null)).toBe('');
    expect(countryFrom(() => 'United States')).toBe('');
    expect(countryFrom(() => 'T1')).toBe('');
  });
});

describe('fillDays', () => {
  it('runs from today back without gaps, newest first, with zeros where nothing was recorded', () => {
    const rows = [
      { day: '2026-10-09', views: 12, visitors: 7, guests: 2, bots: 30 },
      { day: '2026-10-07', views: 3, visitors: 3, guests: 0, bots: 1 },
    ];
    expect(fillDays(rows, '2026-10-09', 4)).toEqual([
      rows[0],
      { day: '2026-10-08', views: 0, visitors: 0, guests: 0, bots: 0 },
      rows[1],
      { day: '2026-10-06', views: 0, visitors: 0, guests: 0, bots: 0 },
    ]);
  });

  it('crosses a month boundary', () => {
    expect(fillDays([], '2026-11-01', 2).map((row) => row.day)).toEqual(['2026-11-01', '2026-10-31']);
  });
});

describe('todayIn', () => {
  it('gives the date in the given zone, where the day turns later than in UTC', () => {
    // 03:30 UTC on the tenth is still the evening of the ninth in Michigan.
    expect(todayIn('America/Detroit', new Date('2026-10-10T03:30:00Z'))).toBe('2026-10-09');
    expect(todayIn('UTC', new Date('2026-10-10T03:30:00Z'))).toBe('2026-10-10');
  });
});
