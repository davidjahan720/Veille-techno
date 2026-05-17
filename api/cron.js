import { Mistral } from '@mistralai/mistralai';
import { Resend } from 'resend';
import Parser from 'rss-parser';

const parser = new Parser();
const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

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

export default async (req, res) => {
  try {
    let summaryContent = '';
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    for (const [category, urls] of Object.entries(FEEDS)) {
      const categoryItems = [];
      for (const url of urls) {
        try {
          const feed = await parser.parseURL(url);
          const recentItems = feed.items.filter(item => {
            const pubDate = new Date(item.pubDate || item.isoDate);
            return pubDate >= twentyFourHoursAgo;
          });
          categoryItems.push(...recentItems);
        } catch (err) {
          console.error(`Error fetching ${url}:`, err.message);
        }
      }

      if (categoryItems.length > 0) {
        // Prepare list for AI and maintain links
        const textToSummarize = categoryItems
          .slice(0, 15)
          .map(item => `- ${item.title}: ${item.contentSnippet || ''}`)
          .join('\n');

        const response = await mistral.chat.complete({
          model: 'mistral-small-latest',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en veille technologique. Résume les actualités suivantes de manière concise en français. Pour chaque article résumé, mentionne son titre exact pour que je puisse y associer le lien.'
            },
            {
              role: 'user',
              content: `Voici les nouveaux articles des dernières 24h pour la catégorie ${category} :\n${textToSummarize}`
            }
          ]
        });

        // Add summary + links to the email
        const linksList = categoryItems
          .slice(0, 15)
          .map(item => `<li><a href="${item.link}">${item.title}</a></li>`)
          .join('');

        summaryContent += `
          <div style="margin-bottom: 30px; padding: 20px; border-radius: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
            <h2 style="color: #4f46e5; margin-top: 0;">${category}</h2>
            <div style="line-height: 1.6; color: #334155;">
              ${response.choices[0].message.content.replace(/\n/g, '<br>')}
            </div>
            <h3 style="font-size: 16px; margin-top: 20px; color: #64748b;">Sources des nouveaux articles :</h3>
            <ul style="font-size: 14px; color: #4f46e5;">
              ${linksList}
            </ul>
          </div>
        `;
      }
    }

    if (summaryContent) {
      await resend.emails.send({
        from: 'Veille Techno <onboarding@resend.dev>',
        to: [process.env.NOTIFICATION_EMAIL],
        subject: `Résumé de votre veille - ${now.toLocaleDateString('fr-FR')}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="text-align: center; color: #1e293b;">Votre Veille Technologique</h1>
            <p style="text-align: center; color: #64748b;">Voici les nouveautés des dernières 24 heures.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            ${summaryContent}
            <footer style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 40px;">
              Généré automatiquement par votre Tech Watch App.
            </footer>
          </div>
        `,
      });
      res.status(200).json({ success: true, message: 'Email sent with new articles' });
    } else {
      res.status(200).json({ success: true, message: 'No new articles in the last 24h' });
    }
  } catch (error) {
    console.error('Cron error:', error);
    res.status(500).json({ error: error.message });
  }
};
