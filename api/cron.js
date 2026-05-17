import { Mistral } from '@mistralai/mistralai';
import { Resend } from 'resend';
import Parser from 'rss-parser';

const parser = new Parser();
const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

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

export default async (req, res) => {
  try {
    let summaryContent = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const [category, urls] of Object.entries(FEEDS)) {
      const categoryItems = [];
      for (const url of urls) {
        try {
          const feed = await parser.parseURL(url);
          const recentItems = feed.items.filter(item => {
            const pubDate = new Date(item.pubDate || item.isoDate);
            return pubDate >= today;
          });
          categoryItems.push(...recentItems);
        } catch (err) {
          console.error(`Error fetching ${url}:`, err.message);
        }
      }

      if (categoryItems.length > 0) {
        const textToSummarize = categoryItems
          .slice(0, 10)
          .map(item => `- ${item.title}: ${item.contentSnippet || ''}`)
          .join('\n');

        const response = await mistral.chat.complete({
          model: 'mistral-small-latest',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en veille technologique. Résume les actualités suivantes de manière concise en français.'
            },
            {
              role: 'user',
              content: `Voici les articles du jour pour la catégorie ${category} :\n${textToSummarize}`
            }
          ]
        });

        summaryContent += `<h2>${category}</h2>\n<p>${response.choices[0].message.content.replace(/\n/g, '<br>')}</p>\n`;
      }
    }

    if (summaryContent) {
      await resend.emails.send({
        from: 'Tech Watch <onboarding@resend.dev>',
        to: [process.env.NOTIFICATION_EMAIL],
        subject: `Veille Techno du ${new Date().toLocaleDateString()}`,
        html: `<h1>Résumé de votre veille technologique</h1>${summaryContent}`,
      });
      res.status(200).json({ success: true, message: 'Email sent' });
    } else {
      res.status(200).json({ success: true, message: 'No new articles today' });
    }
  } catch (error) {
    console.error('Cron error:', error);
    res.status(500).json({ error: error.message });
  }
};
