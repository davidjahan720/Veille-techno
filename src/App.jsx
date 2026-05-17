import React, { useState, useEffect } from 'react';
import { Layout, Shield, Cpu, RefreshCcw, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const categories = [
  { name: 'All', icon: Layout },
  { name: 'Stack Technique', icon: Cpu },
  { name: 'RGPD & Souveraineté', icon: Shield },
];

function App() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/rss');
      if (!response.ok) throw new Error('Failed to fetch RSS feeds');
      const data = await response.json();
      setItems(data);
      setFilteredItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeCategory === 'All') {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => item.category === activeCategory));
    }
  }, [activeCategory, items]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <RefreshCcw className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Tech Watch</h1>
          </div>
          <div className="text-sm text-slate-500">
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.name
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-slate-500 font-medium">Récupération des flux RSS...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
            <Shield className="w-5 h-5" />
            <p>{error}</p>
            <button onClick={fetchData} className="ml-auto underline font-medium">Réessayer</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, idx) => (
              <article key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
                <div className="p-5 flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {item.pubDate ? format(new Date(item.pubDate), 'd MMM HH:mm', { locale: fr }) : ''}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </a>
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-3 mb-4">
                    {item.content}
                  </p>
                </div>
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 truncate max-w-[150px]">
                    {item.source}
                  </span>
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 text-xs font-bold"
                  >
                    Lire <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500">Aucun article trouvé pour cette catégorie.</p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 py-10 mt-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Tech Watch App - Dashboard de Veille Technologique</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
