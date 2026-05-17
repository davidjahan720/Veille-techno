import express from 'express';
import cors from 'cors';
import Parser from 'rss-parser';

const app = express();
app.use(cors());
app.use(express.json());

const parser = new Parser();

const FEEDS = {
  'Stack Technique': [
    'https://vercel.com/blog/feed',
    'https://supabase.com/blog/rss.xml',
    'https://nextcloud.com/blog/feed/',
    'https://tailwind-extensions.vercel.app/rss.xml',
    'https://react.dev/rss.xml',
    'https://github.blog/feed/',
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
