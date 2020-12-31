const cheerio = require('cheerio');
const axios = require('axios');

const EVENTS_URL = `https://karate.org.nz/events/?tribe_paged=1&tribe_event_display=list&tribe-bar-date=`; //`https://karate.org.nz/events`;
const DATE_QUERY_URL = `&tribe_event_display=list&tribe-bar-date=`;

async function getPage(url) {
  try {
    return await axios.get(url);
  } catch (error) {
    console.error(error);
  }
}

async function digForEventPages(url, date) {
  const page = await getPage(url + date);

  const $ = cheerio.load(page.data);
  const links = $('.tribe-events-list-event-title .tribe-event-url');
  const linkArr = links
    .map((i, elm) => {
      return elm.attribs['href'];
    })
    .toArray();

  const nextPage = $('.tribe-events-nav-next.tribe-events-nav-right a');

  if (!nextPage || !nextPage.attr('href')) {
    return linkArr;
  }

  const otherLinks = await digForEventPages(
    nextPage.attr('href') + DATE_QUERY_URL,
    date,
  );
  return linkArr.concat(otherLinks);
}

async function getEventsData(urlArr) {
  return Promise.all(
    urlArr.map(async url => {
      const res = await getPage(url);
      const $ = cheerio.load(res.data);

      const eventName = $('.tribe-events-single-event-title').text();
      const eventPrice = $('.tribe-events-event-cost').text();
      const eventDesc = $(
        '.tribe-events-single-event-description.tribe-events-content',
      ).html();

      const startDate = $('.tribe-events-start-datetime').attr('title');
      const endDate = $('.tribe-events-end-datetime').attr('title');

      const venue = $('.tribe-venue').text();
      const address = $('.tribe-events-address .tribe-address').text();
      const location = `${venue}, ${address}`;

      return {
        name: eventName,
        startDate: startDate,
        endDate: endDate,
        location: location,
        description: eventDesc,
        offSitelink: url,
        cost: eventPrice,
        signUpURL: '',
      };
    }),
  );
}

function getDates(startDate, endDate) {
  const startArr = startDate.split('@')[0].split(' ');

  const endArr = endDate.split('@')[0].split(' ');

  return {
    start: '',
    end: '',
    englishString: '',
  };
}

let now = new Date().toISOString();

now = now.slice(0, now.indexOf('T'));
console.log(`date ${now}`);

now = '2018-12-03';

digForEventPages(EVENTS_URL, now).then(async eventUrls => {
  console.log('Urls array: ', eventUrls);
  const eventArr = await getEventsData(eventUrls);
  console.log('events arr', eventArr);
});

function stringToDate(month, day) {}
