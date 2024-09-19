const axios = require('axios');
const cheerio = require('cheerio');

exports.config = {
    name: 'cosplay',
    aliases: ['cosplaytele', 'cosplay18'],
    version: '1.0.0',
    author: 'Kenneth Panio',
    description: 'search a random cosplay image with MediaFire links',
    usage: ['/cosplay?query=furina'],
    category: 'nsfw',
};

exports.initialize = async function ({ req, res, color }) {
    try {
        const query = req.query.query || '';

        // Fetch search results
        const response = await axios.post('https://cosplaytele.com/wp-admin/admin-ajax.php', new URLSearchParams({
            action: 'ajaxsearchlite_search',
            aslp: query,
            asid: '2',
            options: 'customset[]=page&customset[]=post&asl_gen[]=title&qtranslate_lang=0&filters_initial=1&filters_changed=0'
        }), {
            headers: {
                'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'text/html',
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://cosplaytele.com/'
            }
        });

        const $ = cheerio.load(response.data);
        const results = $('.item').map((_, element) => {
            const imgTag = $(element).find('img.asl_image');
            const aTag = $(element).find('a.asl_res_url');
            if (imgTag.length && aTag.length) {
                return { imageUrl: imgTag.attr('src'), sourceUrl: aTag.attr('href') };
            }
        }).get();

        // Select a random entry
        const randomEntry = results[Math.floor(Math.random() * results.length)];
        if (!randomEntry) return res.status(404).json({ message: "No results found for the query. Please try a different search term." });

        const sourceResponse = await axios.get(randomEntry.sourceUrl);
        const $$ = cheerio.load(sourceResponse.data);

        const images = $$('img').map((_, el) => $$(el).attr('src')).get();
        const filteredImages = images.slice(2); 

        const mediafireLinks = $$('a').map((_, el) => $$(el).attr('href')).get().filter(link => link.includes('mediafire.com'));

        const randomImage = filteredImages[Math.floor(Math.random() * filteredImages.length)];
        if (!randomImage) return res.status(404).json({ message: "No images found on the selected page. Please try again later." });

        res.json({
            mediafire: mediafireLinks.length > 0 ? mediafireLinks : [],
            password: mediafireLinks.length > 0 ? "cosplaytele" : "N/A",
            multi_img: filteredImages,
            single_img: randomImage,
            author: exports.config.author
        });
    } catch (e) {
        const statusCode = e.response?.status || 500;
        let errorMessage;

        switch (statusCode) {
            case 400:
                errorMessage = "Bad Request. The server could not understand the request.";
                break;
            case 401:
                errorMessage = "Unauthorized. Authentication is required and has failed or not yet been provided.";
                break;
            case 403:
                errorMessage = "Forbidden. You do not have permission to access this resource.";
                break;
            case 404:
                errorMessage = "Not Found. The requested resource could not be found.";
                break;
            case 500:
                errorMessage = "Internal Server Error. An error occurred on the server.";
                break;
            case 502:
                errorMessage = "Bad Gateway. The server received an invalid response from the upstream server.";
                break;
            default:
                errorMessage = "An unexpected error occurred. Please try again later.";
        }

        res.status(statusCode).json({ error: errorMessage });
        console.error(color.red(e.message));
    }
};