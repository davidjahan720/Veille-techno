import express from 'express';
import cors from 'cors';
import Parser from 'rss-parser';

const app = express();
app.use(cors());
app.use(express.json());

const parser = new Parser();

const FEEDS = {
  'Stack Technique': [
    'https://www.journaldunet.com/solutions/dsi/rss/',
    'https://www.lemondeinformatique.fr/flux-rss/thematique/developpement/flux.xml',
    'https://www.nextinpact.com/rss/news.xml',
    'https://dev.to/feed/tag/french',
    'https://blog.clever-cloud.com/fr/feed/',
    'https://www.it-connect.fr/feed/',
  ],
  'RGPD & Souveraineté': [
    'https://www.cnil.fr/fr/rss.xml',
    'https://www.ssi.gouv.fr/feed/',
    'https://blog.ovhcloud.com/fr/feed/',
    'https://www.scaleway.com/fr/blog/feed/',
    'https://www.numerama.com/cyberguerre/feed/',
    'https://www.linformaticien.com/rss.xml',
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

    allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    res.json(allItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
