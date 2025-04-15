/**
 * Generate a random language header
 * @returns {string} A randomly selected Accept-Language header
 */
function getRandomLanguageHeader() {
  const languages = [
    "fr-FR,fr;q=0.9,en;q=0.8",
    "de-DE,de;q=0.9,en;q=0.8",
    "es-ES,es;q=0.9,en;q=0.8",
    "it-IT,it;q=0.9,en;q=0.8",
    "ja-JP,ja;q=0.9,en;q=0.8",
    "zh-CN,zh;q=0.9,en;q=0.8",
    "pt-BR,pt;q=0.9,en;q=0.8",
    "ru-RU,ru;q=0.9,en;q=0.8",
  ];

  return languages[Math.floor(Math.random() * languages.length)];
}

/**
 * Generate a random Accept header
 * @returns {string} A randomly selected Accept header
 */
function getRandomAcceptHeader() {
  const acceptHeaders = [
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "text/html,application/xhtml+xml,application/xml;q=0.8,image/avif,image/webp,image/apng,*/*;q=0.5",
  ];

  return acceptHeaders[Math.floor(Math.random() * acceptHeaders.length)];
}

/**
 * Generate a modified User-Agent based on a random selection
 * @returns {string} A modified User-Agent string
 */
function getRandomUserAgent() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  ];

  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

export { getRandomLanguageHeader, getRandomAcceptHeader, getRandomUserAgent };
