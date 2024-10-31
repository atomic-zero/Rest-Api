
const axios = require('axios');
const cheerio = require('cheerio');

exports.config = {
  name: 'gore',
  aliases: ['seegore', 'gorepage'],
  version: '1.0.0',
  author: 'International Security',
  description: 'Fetch a random gore image and video details from seegore.com',
  usage: ['/gore'],
  category: 'nsfw',
};

exports.initialize = async ({ req, res }) => {
  try {
    const page = Math.floor(Math.random() * 100);
    const response = await axios.get(`https://seegore.com/gore/page/${page}`);
    const $ = cheerio.load(response.data);
    const links = [];

    $('ul > li > article').each((_, element) => {
      links.push({
        title: $(element).find('div.content > header > h2').text(),
        link: $(element).find('div.post-thumbnail > a').attr('href'),
        thumb: $(element).find('div.post-thumbnail > a > div > img').attr('src'),
        view: $(element).find('div.post-thumbnail > div.post-meta.bb-post-meta.post-meta-bg > span.post-meta-item.post-views').text(),
        vote: $(element).find('div.post-thumbnail > div.post-meta.bb-post-meta.post-meta-bg > span.post-meta-item.post-votes').text(),
        tag: $(element).find('div.content > header > div > div.bb-cat-links').text(),
        comment: $(element).find('div.content > header > div > div.post-meta.bb-post-meta > a').text(),
      });
    });

    const random = links[Math.floor(Math.random() * links.length)];
    const detailResponse = await axios.get(random.link);
    const $$ = cheerio.load(detailResponse.data);

    const result = {
      status: true,
      title: random.title,
      source: random.link,
      thumb: random.thumb,
      tag: $$('div.site-main > div > header > div > div > p').text(),
      upload: $$('div.site-main').find('span.auth-posted-on > time:nth-child(2)').text(),
      author: $$('div.site-main').find('span.auth-name.mf-hide > a').text(),
      comment: random.comment,
      vote: random.vote,
      view: $$('div.site-main').find('span.post-meta-item.post-views.s-post-views.size-lg > span.count').text(),
      video1: $$('div.site-main').find('video > source').attr('src'),
      video2: $$('div.site-main').find('video > a').attr('href'),
      author: exports.config.author,
    };

    res.json(result);
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred.";
    res.status(statusCode).json({ error: errorMessage });
  }
};
