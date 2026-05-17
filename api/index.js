const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');

const app = express();
app.use(cors());
app.use(express.json());

const parser = new Parser();

const FEEDS = {
  Frontend: [
    'https://frontendmasters.com/blog/feed/',
    'https://web.dev/feed.xml',
    'https://css-tricks.com/feed/',
    'https://overreacted.io/rss.xml',
  ],
  Backend: [
    'https://news.ycombinator.com/rss',
    'http://feeds.feedburner.com/HighScalability',
    'https://martinfowler.com/feed.atom',
    'https://thevaluable.dev/rss.xml',
  ],
  'Cloud & DevOps': [
    'https://feed.infoq.com/',
    'https://aws.amazon.com/blogs/aws/feed/',
    'https://cloud.google.com/feeds/gcp-release-notes.xml',
  ],
  'RGPD & Souveraineté': [
    'https://www.cnil.fr/fr/rss.xml',
    'https://www.ssi.gouv.fr/feed/',
    'https://blog.ovhcloud.com/feed/',
    'https://www.scaleway.com/en/blog/feed/',
    'https://krebsonsecurity.com/feed/',
    'https://www.schneier.com/feed/atom/',
  ],
};

app.get('/api/rss', async (req, res) => {
  try {
    const allItems = [];
    
    for (const [category, urls] of Object.entries(FEEDS)) {
      const categoryPromises = urls.map(async (url) => {
        try {
          const feed = await parser.parseURL(url);
          return feed.items.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate || item.isoDate,
            content: item.contentSnippet || item.content,
            source: feed.title,
            category: category,
          }));
        } catch (err) {
          console.error(`Error fetching ${url}:`, err.message);
          return [];
        }
      });
      
      const results = await Promise.all(categoryPromises);
      allItems.push(...results.flat());
    }

    // Sort by date descending
    allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    res.json(allItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
