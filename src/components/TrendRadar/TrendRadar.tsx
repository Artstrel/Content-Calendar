import React, { useState } from 'react';
import { Trend, Post, ContentFormat, AiTelemetry } from '../../types/index.ts';
import { Sparkles, Plus, ArrowUpRight, Loader2, Activity, Globe, ExternalLink, Link2, Search } from 'lucide-react';
import { scanTrendsAI, createTrend } from '../../services/api.ts';

interface TrendRadarProps {
  trends: Trend[];
  posts?: Post[];
  settings?: any;
  onRefreshTrends: () => void;
  onCreatePostFromTrend: (trend: Trend) => void;
  onOpenExistingPost?: (post: Post) => void;
}

export const TrendRadar: React.FC<TrendRadarProps> = ({
  trends,
  posts = [],
  settings,
  onRefreshTrends,
  onCreatePostFromTrend,
  onOpenExistingPost
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanTelemetry, setScanTelemetry] = useState<AiTelemetry | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isWebRadarOpen, setIsWebRadarOpen] = useState<boolean>(false);
  const [webQuery, setWebQuery] = useState<string>('');
  const [webUrl, setWebUrl] = useState<string>('');
  const [useWebGrounding, setUseWebGrounding] = useState<boolean>(true);
  const [webSources, setWebSources] = useState<Array<{ title: string; url: string; snippet?: string }>>([]);
  const [newTrend, setNewTrend] = useState({
    title: '',
    category: 'branding',
    categoryLabel: 'Брендинг',
    source: 'Behance / Dribbble',
    description: '',
    keyTakeaway: '',
    suggestedFormat: 'carousel' as ContentFormat,
    tags: 'Swiss Grid, Typography'
  });

  const categories = [
    { id: 'all', label: 'ALL CATEGORIES' },
    { id: 'typography', label: 'TYPOGRAPHY' },
    { id: 'branding', label: 'BRANDING' },
    { id: '3d', label: '3D & SPATIAL' },
    { id: 'motion', label: 'MOTION & AI' },
    { id: 'editorial', label: 'EDITORIAL PRINT' }
  ];

  const filteredTrends = selectedCategory === 'all'
    ? trends
    : trends.filter(t => t.category === selectedCategory);

  const handleScan = async (params?: { query?: string; url?: string }) => {
    setIsScanning(true);
    setScanTelemetry(null);
    try {
      const res = await scanTrendsAI({
        category: selectedCategory,
        model: settings?.defaultModel,
        query: params?.query || (webQuery.trim() ? webQuery.trim() : undefined),
        url: params?.url || (webUrl.trim() ? webUrl.trim() : undefined),
        useWebSearch: useWebGrounding
      });

      let addedCount = 0;
      if (res.trends && Array.isArray(res.trends) && res.trends.length > 0) {
        for (const t of res.trends) {
          const saved = await createTrend(t);
          if (!saved.alreadyExisted) {
            addedCount++;
          }
        }
      }

      if (res.telemetry) {
        if (addedCount > 0) {
          res.telemetry.message = `${res.telemetry.message ? res.telemetry.message + ' ' : ''}[+${addedCount} НОВЫХ В РАДАРЕ]`;
        }
        setScanTelemetry(res.telemetry);
      }
      if (res.webSources && res.webSources.length > 0) {
        setWebSources(res.webSources);
      }
      onRefreshTrends();
    } catch (err: any) {
      console.error(err);
      alert('Ошибка при сканировании трендов: ' + (err.message || 'Сбой'));
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveCustomTrend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrend.title.trim()) return;

    try {
      const tagArray = newTrend.tags.split(',').map(t => t.trim()).filter(Boolean);
      await createTrend({
        ...newTrend,
        category: newTrend.category as any,
        tags: tagArray
      });
      setIsAddModalOpen(false);
      setNewTrend({
        title: '',
        category: 'branding',
        categoryLabel: 'Брендинг',
        source: 'Behance / Dribbble',
        description: '',
        keyTakeaway: '',
        suggestedFormat: 'carousel',
        tags: 'Swiss Grid, Typography'
      });
      onRefreshTrends();
    } catch (err) {
      console.error(err);
      alert('Не удалось сохранить тренд');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Action and Category Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid var(--border-light)',
        paddingBottom: '16px'
      }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button
              key={c.id}
              className={`swiss-filter-pill ${selectedCategory === c.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {settings?.defaultModel && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
              [{settings.defaultModel}]
            </span>
          )}
          <button 
            className="swiss-btn swiss-btn-sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={14} />
            + ADD REFERENCE
          </button>
          <button 
            className={`swiss-btn swiss-btn-sm ${isWebRadarOpen ? 'active' : ''}`}
            onClick={() => setIsWebRadarOpen(!isWebRadarOpen)}
            style={isWebRadarOpen ? { borderColor: 'var(--text-primary)', backgroundColor: 'var(--bg-surface-elevated)' } : {}}
            title="Открыть живой онлайн-поиск и парсер страниц по URL"
          >
            <Globe size={14} />
            {isWebRadarOpen ? '✕ ЗАКРЫТЬ WEB ПАРСЕР' : '🌐 WEB ПАРСЕР & URL'}
          </button>
          <button 
            className="swiss-btn swiss-btn-primary swiss-btn-sm"
            onClick={() => handleScan()}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <Loader2 size={14} className="spin" />
                AI SCANNING (КАСКАД)...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                SCAN TRENDS (AI КАСКАД)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Web Radar & URL Scraper Panel */}
      {isWebRadarOpen && (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-focus)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={16} color="var(--accent-primary)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '12px' }}>
                LIVE WEB RADAR // АВТОНОМНЫЙ ПАРСЕР ПО СЕТИ И ССЫЛКАМ
              </span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useWebGrounding}
                onChange={e => setUseWebGrounding(e.target.checked)}
                style={{ accentColor: 'var(--text-primary)' }}
              />
              ОНЛАЙН-ГРАУНДИНГ (GOOGLE SEARCH & WEB)
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="swiss-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Search size={12} />
                Поиск актуальных тем и практик в сети
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="swiss-input"
                  placeholder="Например: Figma AI updates 2026, Kinetic Swiss typography..."
                  value={webQuery}
                  onChange={e => setWebQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleScan({ query: webQuery }); }}
                />
                <button
                  type="button"
                  className="swiss-btn swiss-btn-primary"
                  style={{ whiteSpace: 'nowrap', fontSize: '11px' }}
                  onClick={() => handleScan({ query: webQuery })}
                  disabled={isScanning}
                >
                  {isScanning ? <Loader2 size={13} className="spin" /> : <Search size={13} />}
                  ПОИСК В СЕТИ
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="swiss-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Link2 size={12} />
                Парсинг целевой ссылки (Behance, статья, кейс)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="url"
                  className="swiss-input"
                  placeholder="https://behance.net/gallery/... или ссылка на дизайн-статью"
                  value={webUrl}
                  onChange={e => setWebUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && webUrl.trim()) handleScan({ url: webUrl }); }}
                />
                <button
                  type="button"
                  className="swiss-btn"
                  style={{ whiteSpace: 'nowrap', fontSize: '11px', borderColor: '#33cc66', color: '#33cc66' }}
                  onClick={() => handleScan({ url: webUrl })}
                  disabled={isScanning || !webUrl.trim()}
                >
                  {isScanning ? <Loader2 size={13} className="spin" /> : <ExternalLink size={13} />}
                  СПАРСИТЬ URL
                </button>
              </div>
            </div>
          </div>

          {webSources.length > 0 && (
            <div style={{ paddingTop: '8px', borderTop: '1px dashed var(--border-light)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-secondary)' }}>
                ИСТОЧНИКИ В СЕТИ:
              </span>
              {webSources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-light)',
                    padding: '2px 8px',
                    textDecoration: 'none'
                  }}
                  title={s.snippet || s.title}
                >
                  <Globe size={10} color="#33cc66" />
                  <span>{s.title?.slice(0, 35) || s.url}</span>
                  <ExternalLink size={9} />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Real-Time AI Telemetry Alert */}
      {scanTelemetry && (() => {
        const isLive = scanTelemetry.live;
        const isGemini = scanTelemetry.provider === 'gemini';
        const isOpenRouter = scanTelemetry.provider === 'openrouter';
        const isCascade = !!scanTelemetry.cascadeTriggered;

        let badgeTitle = '○ САНДБОКС / ЛОКАЛЬНЫЙ ШАБЛОН';
        let badgeColor = '#ffaa00';
        let badgeBg = '#1f1505';

        if (isLive) {
          if (isGemini) {
            badgeTitle = '● GOOGLE GEMINI LIVE // 200 OK';
            badgeColor = '#33cc66';
            badgeBg = '#0d1f12';
          } else if (isOpenRouter) {
            badgeTitle = isCascade ? '⚡️ АВТО-КАСКАД OPENROUTER // 200 OK' : '● OPENROUTER LIVE // 200 OK';
            badgeColor = isCascade ? '#ffcc00' : '#ffaa00';
            badgeBg = '#1f1505';
          }
        }

        return (
          <div style={{
            padding: '12px 16px',
            backgroundColor: badgeBg,
            border: `1px solid ${badgeColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={16} color={badgeColor} />
              <div>
                <span style={{ fontWeight: 800, color: badgeColor }}>
                  {badgeTitle}
                </span>
                <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                  {scanTelemetry.message || (scanTelemetry.live ? `${scanTelemetry.model} (${scanTelemetry.latencyMs}мс)` : scanTelemetry.error)}
                </span>
              </div>
            </div>
            <button 
              type="button" 
              className="swiss-btn swiss-btn-sm" 
              style={{ fontSize: '10px', padding: '2px 8px' }}
              onClick={() => setScanTelemetry(null)}
            >
              ✕ ЗАКРЫТЬ
            </button>
          </div>
        );
      })()}

      {/* Grid of Trend Cards */}
      <div className="trend-radar-grid">
        {filteredTrends.map(trend => {
          const existingPost = posts.find(p => p.title.trim().toLowerCase() === trend.title.trim().toLowerCase());

          return (
            <article key={trend.id} className="trend-card" style={existingPost ? { borderColor: '#2e4d36' } : {}}>
              <div>
                <div className="trend-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="trend-category-tag">{trend.categoryLabel} // {trend.source}</span>
                    {trend.sourceUrl && (
                      <a
                        href={trend.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          color: '#33cc66',
                          fontSize: '9px',
                          textDecoration: 'none',
                          fontFamily: 'var(--font-mono)',
                          border: '1px solid #33cc66',
                          padding: '1px 5px'
                        }}
                        title={`Открыть первоисточник: ${trend.sourceUrl}`}
                      >
                        <Globe size={10} />
                        <span>LINK</span>
                        <ExternalLink size={8} />
                      </a>
                    )}
                  </div>
                  {existingPost ? (
                    <span style={{ 
                      backgroundColor: '#122616', 
                      color: '#33cc66', 
                      border: '1px solid #33cc66', 
                      padding: '2px 6px', 
                      fontSize: '9px', 
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700
                    }}>
                      ✓ В ПЛАНЕ [{existingPost.status.toUpperCase()}]
                    </span>
                  ) : (
                    <span className="trend-relevance-score">INDEX {trend.relevanceScore}%</span>
                  )}
                </div>

                <h3 className="trend-card-title">{trend.title}</h3>
                <p className="trend-card-desc">{trend.description}</p>

                {trend.keyTakeaway && (
                  <div className="trend-takeaway-box">
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      KEY STRATEGY //
                    </div>
                    {trend.keyTakeaway}
                  </div>
                )}

                <div className="trend-tags">
                  {trend.tags.map((tag, idx) => (
                    <span key={idx} className="trend-tag">#{tag}</span>
                  ))}
                </div>
              </div>

              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                {existingPost ? (
                  <button 
                    className="swiss-btn" 
                    style={{ width: '100%', justifyContent: 'space-between', borderColor: '#33cc66', color: '#33cc66' }}
                    onClick={() => onOpenExistingPost ? onOpenExistingPost(existingPost) : onCreatePostFromTrend(trend)}
                  >
                    <span>✓ КАРТОЧКА СУЩЕСТВУЕТ (ОТКРЫТЬ)</span>
                    <ArrowUpRight size={15} />
                  </button>
                ) : (
                  <button 
                    className="swiss-btn swiss-btn-primary" 
                    style={{ width: '100%', justifyContent: 'space-between' }}
                    onClick={() => onCreatePostFromTrend(trend)}
                  >
                    <span>+ CONVERT TO CONTENT PLAN</span>
                    <ArrowUpRight size={15} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Add Custom Trend Modal */}
      {isAddModalOpen && (
        <div className="swiss-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="swiss-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="swiss-modal-header">
              <span className="swiss-modal-title">+ ADD DESIGN INSPIRATION / TREND</span>
              <button className="swiss-btn swiss-btn-sm" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveCustomTrend}>
              <div className="swiss-modal-body">
                <div className="swiss-form-group">
                  <label className="swiss-label">Название тренда или референса</label>
                  <input 
                    type="text" 
                    className="swiss-input"
                    placeholder="Например: Kinetic Swiss Post-Punk Typography"
                    value={newTrend.title}
                    onChange={e => setNewTrend({ ...newTrend, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="swiss-form-group">
                    <label className="swiss-label">Категория</label>
                    <select 
                      className="swiss-select"
                      value={newTrend.category}
                      onChange={e => {
                        const cat = e.target.value;
                        const labels: Record<string, string> = {
                          typography: 'Типографика',
                          branding: 'Брендинг',
                          '3d': '3D & Пространство',
                          motion: 'Motion & AI',
                          editorial: 'Editorial Print'
                        };
                        setNewTrend({ ...newTrend, category: cat, categoryLabel: labels[cat] || cat });
                      }}
                    >
                      <option value="typography">Типографика</option>
                      <option value="branding">Брендинг</option>
                      <option value="3d">3D & Пространство</option>
                      <option value="motion">Motion & AI</option>
                      <option value="editorial">Editorial Print</option>
                    </select>
                  </div>

                  <div className="swiss-form-group">
                    <label className="swiss-label">Источник (ссылка / платформа)</label>
                    <input 
                      type="text" 
                      className="swiss-input"
                      placeholder="Behance, X @designer, Studio Portfolio"
                      value={newTrend.source}
                      onChange={e => setNewTrend({ ...newTrend, source: e.target.value })}
                    />
                  </div>
                </div>

                <div className="swiss-form-group">
                  <label className="swiss-label">Описание и визуальные особенности</label>
                  <textarea 
                    className="swiss-textarea"
                    placeholder="В чем суть визуального приема..."
                    value={newTrend.description}
                    onChange={e => setNewTrend({ ...newTrend, description: e.target.value })}
                  />
                </div>

                <div className="swiss-form-group">
                  <label className="swiss-label">Практический инсайт для соцсетей</label>
                  <input 
                    type="text" 
                    className="swiss-input"
                    placeholder="Как этот прием привлечет внимание в ленте..."
                    value={newTrend.keyTakeaway}
                    onChange={e => setNewTrend({ ...newTrend, keyTakeaway: e.target.value })}
                  />
                </div>

                <div className="swiss-form-group">
                  <label className="swiss-label">Теги (через запятую)</label>
                  <input 
                    type="text" 
                    className="swiss-input"
                    value={newTrend.tags}
                    onChange={e => setNewTrend({ ...newTrend, tags: e.target.value })}
                  />
                </div>
              </div>

              <div className="swiss-modal-footer">
                <button type="button" className="swiss-btn" onClick={() => setIsAddModalOpen(false)}>
                  ОТМЕНА
                </button>
                <button type="submit" className="swiss-btn swiss-btn-primary">
                  СОХРАНИТЬ В РАДАР
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
