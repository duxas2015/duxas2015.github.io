/**
 * Извлекает данные об эпизодах из HTML-строки и преобразует их в JSON-объект.
 * @param {string} htmlString - HTML-строка, содержащая данные об эпизодах.
 * @returns {object} Объект JSON, где ключи — это ID сезонов, а значения — 
 * объекты, в которых ключи — ID эпизодов, а значения — 
 * URL-адреса. Возвращает пустой объект, если данные не найдены.
 */
function extractEpisodesData(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const episodesContainer = doc.getElementById('simple-episodes-tabs');

  if (!episodesContainer) {
    return {};
  }

  const result = {};
  const episodeLinks = episodesContainer.querySelectorAll('a.b-simple_episode__item');

  episodeLinks.forEach(link => {
    const seasonId = link.getAttribute('data-season_id');
    const episodeId = link.getAttribute('data-episode_id');
    const href = link.getAttribute('href');

    if (seasonId && episodeId && href) {
      if (!result[seasonId]) {
        result[seasonId] = {};
      }
      result[seasonId][episodeId] = href;
    }
  });

  return result;
}

/**
 * Получает HTML-код по указанному URL, а затем извлекает и возвращает
 * данные об эпизодах в формате JSON.
 * @param {string} url - URL-адрес веб-страницы для получения.
 * @returns {Promise<object>} Промис, который разрешается объектом JSON с данными
 * об эпизодах или пустым объектом в случае ошибки.
 */
async function fetchAndExtractEpisodes(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }
    const htmlString = await response.text();
    const episodesData = extractEpisodesData(htmlString);
    console.log(episodesData); // Выводим результат в консоль
    return episodesData;
  } catch (error) {
    console.error("Произошла ошибка:", error);
    return {};
  }
}

// Глобальная переменная с адресом
const gl_url = 'https://rezka.pub/series/drama/1752-doktor-haus-2004-latest/238-subtitles.html';

// Вызов функции при загрузке страницы
window.onload = () => {
  fetchAndExtractEpisodes(gl_url);
};

