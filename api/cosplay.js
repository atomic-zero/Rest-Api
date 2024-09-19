const axios = require('axios');
const cheerio = require('cheerio');

const conversationHistories = {};

exports.config = {
    name: 'cosplay',
    aliases: ['cosplaytele', 'cosplay18'],
    version: '1.0.0',
    author: 'Kenneth Panio',
    description: 'Watch a random cosplay image with MediaFire links',
    usage: ['/cosplay?query=furina'],
    category: 'nsfw',
};

exports.initialize = async function ({ req, res }) {
    try {
        const query = req.query.query || '';

        const response = await axios.post('https://cosplaytele.com/wp-admin/admin-ajax.php', new URLSearchParams({
            action: 'ajaxsearchlite_search',
            aslp: query,
            asid: '2',
            options: 'customset[]=page&customset[]=post&asl_gen[]=title&qtranslate_lang=0&filters_initial=1&filters_changed=0'
        }), {
            headers: {
                'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'text/html',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Infinix X669 Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.40 Mobile Safari/537.36',
                'Referer': 'https://cosplaytele.com/'
            }
        });

        const $ = cheerio.load(response.data);
        const items = $('.item');
        const results = [];

        // Extract image and source URLs from the search results
        items.each((index, element) => {
            const imgTag = $(element).find('img.asl_image');
            const aTag = $(element).find('a.asl_res_url');

            if (imgTag.length && aTag.length) {
                const imageUrl = imgTag.attr('src');
                const sourceUrl = aTag.attr('href');
                results.push({ imageUrl, sourceUrl });
            }
        });

        // Select a random entry from the results
        const randomEntry = results[Math.floor(Math.random() * results.length)];
        if (!randomEntry) return res.json({ message: "No results found ; <" });

        // Fetch the page content of the selected entry
        const sourceResponse = await axios.get(randomEntry.sourceUrl);
        const $$ = cheerio.load(sourceResponse.data);

        const images = $$('img').map((i, el) => $$(el).attr('src')).get();
        const mediafireLinks = $$('a').map((i, el) => $$(el).attr('href')).get().filter(link => link.includes('mediafire.com'));

        // Select a random image from the page content
        const randomImage = images[Math.floor(Math.random() * images.length)];
        if (!randomImage) return res.json({ message: "No results found ; <" });

        // Prepare the response
        const mediafireLinksText = mediafireLinks.length > 0
            ? mediafireLinks.map((link, index) => `${index + 1}. ${link}`).join("\n")
            : "N/A";

        const responseJson = {
            imageUrl: randomImage,
            images,
            mediafireLinks
        };

        res.json({
            link: mediafireLinksText,
            password: mediafireLinks.length > 0 ? "cosplaytele" : "N/A",
            multi: images,
            single: randomImage,
            author: exports.config.author
        });
    } catch (e) {
        res.json({
            error: "ERROR: " + e.message
        });
    }
};