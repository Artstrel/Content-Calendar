import React, { useState, useEffect } from 'react';
import { 
  LEGAL_DATA, 
  Language, 
  LegalTab, 
  LegalSection 
} from './legalContent.ts';
import { 
  Shield, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Copy, 
  Check, 
  Printer, 
  ArrowLeft, 
  ExternalLink, 
  Search,
  Lock,
  Share2
} from 'lucide-react';

interface LegalPageProps {
  initialTab?: LegalTab;
  initialLang?: Language;
  onBackToApp?: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({
  initialTab = 'tos',
  initialLang = 'ru',
  onBackToApp
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [lang, setLang] = useState<Language>(initialLang);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync with window hash if present on mount
  useEffect(() => {
    const hash = window.location.hash.toLowerCase().replace('#', '');
    if (hash === 'privacy') setActiveTab('privacy');
    else if (hash === 'terms' || hash === 'tos') setActiveTab('tos');
    else if (hash === 'deletion' || hash === 'data-deletion') setActiveTab('deletion');
    else if (hash === 'compliance' || hash === 'meta') setActiveTab('compliance');
  }, []);

  // Update hash when tab changes
  const handleTabChange = (tab: LegalTab) => {
    setActiveTab(tab);
    window.location.hash = tab === 'tos' ? 'terms' : tab;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentData = LEGAL_DATA[lang];
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://swisscontentengine.app';

  // Filter sections by search query
  const filterSections = (sections: LegalSection[]) => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(s => 
      s.title.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.content.some(p => p.toLowerCase().includes(q))
    );
  };

  return (
    <div className="swiss-legal-container">
      {/* Top Swiss Control Bar */}
      <div className="swiss-legal-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {onBackToApp && (
            <button 
              className="swiss-btn swiss-btn-sm" 
              onClick={onBackToApp}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={14} />
              {lang === 'ru' ? '← НАЗАД В СТУДИЮ' : '← BACK TO STUDIO'}
            </button>
          )}
          <div className="swiss-legal-breadcrumbs">
            <span>SYS // COMPLIANCE</span>
            <span>/</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              {activeTab === 'tos' && (lang === 'ru' ? '01 // УСЛОВИЯ ИСПОЛЬЗОВАНИЯ' : '01 // TERMS OF SERVICE')}
              {activeTab === 'privacy' && (lang === 'ru' ? '02 // ПОЛИТИКА ПРИВАТНОСТИ' : '02 // PRIVACY POLICY')}
              {activeTab === 'deletion' && (lang === 'ru' ? '03 // УДАЛЕНИЕ ДАННЫХ' : '03 // DATA DELETION')}
              {activeTab === 'compliance' && (lang === 'ru' ? '04 // СТАНДАРТЫ API И META REVIEW' : '04 // API COMPLIANCE')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Language Switcher */}
          <div className="swiss-lang-toggle">
            <button 
              className={`swiss-lang-btn ${lang === 'ru' ? 'active' : ''}`}
              onClick={() => setLang('ru')}
              title="Русский язык"
            >
              RU
            </button>
            <button 
              className={`swiss-lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
              title="English"
            >
              EN
            </button>
          </div>

          {/* Quick Print Button */}
          <button 
            className="swiss-btn swiss-btn-sm" 
            onClick={() => window.print()}
            title={lang === 'ru' ? 'Печать или экспорт в PDF' : 'Print or Export to PDF'}
          >
            <Printer size={14} />
            <span className="hide-mobile">{lang === 'ru' ? 'ПЕЧАТЬ / PDF' : 'PRINT / PDF'}</span>
          </button>

          {/* Direct Public Page Link */}
          <a 
            href={`/legal.html#${activeTab === 'tos' ? 'terms' : activeTab}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="swiss-btn swiss-btn-sm"
            title={lang === 'ru' ? 'Открыть статическую версию' : 'Open static standalone version'}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ExternalLink size={14} />
            <span className="hide-mobile">PUBLIC URL</span>
          </a>
        </div>
      </div>

      {/* Main Legal Hero */}
      <div className="swiss-legal-hero">
        <div className="swiss-legal-hero-badge">
          <Shield size={14} />
          <span>LEGAL SPECIFICATION // SWISS PROTOCOL 8PX</span>
        </div>
        <h1 className="swiss-legal-hero-title">
          {activeTab === 'tos' && currentData.tos.title}
          {activeTab === 'privacy' && currentData.privacy.title}
          {activeTab === 'deletion' && currentData.deletion.title}
          {activeTab === 'compliance' && currentData.compliance.title}
        </h1>
        <p className="swiss-legal-hero-subtitle">
          {activeTab === 'tos' && currentData.tos.subtitle}
          {activeTab === 'privacy' && currentData.privacy.subtitle}
          {activeTab === 'deletion' && currentData.deletion.subtitle}
          {activeTab === 'compliance' && currentData.compliance.subtitle}
        </p>

        {/* Navigation Tabs */}
        <div className="swiss-legal-nav-tabs">
          <button 
            className={`swiss-legal-tab ${activeTab === 'tos' ? 'active' : ''}`}
            onClick={() => handleTabChange('tos')}
          >
            <FileText size={15} />
            <span>01 // {lang === 'ru' ? 'УСЛОВИЯ (TOS)' : 'TERMS OF SERVICE'}</span>
          </button>

          <button 
            className={`swiss-legal-tab ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => handleTabChange('privacy')}
          >
            <Lock size={15} />
            <span>02 // {lang === 'ru' ? 'КОНФИДЕНЦИАЛЬНОСТЬ' : 'PRIVACY POLICY'}</span>
          </button>

          <button 
            className={`swiss-legal-tab ${activeTab === 'deletion' ? 'active' : ''}`}
            onClick={() => handleTabChange('deletion')}
          >
            <Trash2 size={15} />
            <span>03 // {lang === 'ru' ? 'УДАЛЕНИЕ ДАННЫХ' : 'DATA DELETION'}</span>
          </button>

          <button 
            className={`swiss-legal-tab ${activeTab === 'compliance' ? 'active' : ''}`}
            onClick={() => handleTabChange('compliance')}
          >
            <CheckCircle2 size={15} />
            <span>04 // {lang === 'ru' ? 'META & API REVIEW' : 'API COMPLIANCE'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar & Body */}
      <div className="swiss-legal-layout">
        {/* Left Swiss Sidebar */}
        <aside className="swiss-legal-sidebar">
          {/* Quick Search */}
          <div className="swiss-legal-search-box">
            <Search size={14} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder={lang === 'ru' ? 'Поиск по статьям...' : 'Search clauses...'} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="swiss-legal-search-input"
            />
          </div>

          {/* Document Metadata Box */}
          <div className="swiss-legal-meta-card">
            <div className="swiss-legal-meta-row">
              <span className="swiss-legal-meta-label">ARCHITECTURE:</span>
              <span className="swiss-legal-meta-val">LOCAL-FIRST / P2P</span>
            </div>
            <div className="swiss-legal-meta-row">
              <span className="swiss-legal-meta-label">REVISION:</span>
              <span className="swiss-legal-meta-val">v1.4.0-CH</span>
            </div>
            <div className="swiss-legal-meta-row">
              <span className="swiss-legal-meta-label">LAST UPDATED:</span>
              <span className="swiss-legal-meta-val">
                {activeTab === 'tos' && currentData.tos.lastUpdated}
                {activeTab === 'privacy' && currentData.privacy.lastUpdated}
                {activeTab === 'deletion' && currentData.deletion.lastUpdated}
                {activeTab === 'compliance' && currentData.compliance.lastVerified}
              </span>
            </div>
            <div className="swiss-legal-meta-row">
              <span className="swiss-legal-meta-label">DATA BROKERAGE:</span>
              <span className="swiss-legal-meta-val" style={{ color: '#33cc66' }}>ZERO / NONE</span>
            </div>
          </div>

          {/* Meta App Review Fast URLs Box */}
          <div className="swiss-meta-review-box">
            <div className="swiss-meta-review-title">
              <Share2 size={13} />
              <span>META APP REVIEW HELPER</span>
            </div>
            <p className="swiss-meta-review-desc">
              {lang === 'ru' 
                ? 'Скопируйте публичные ссылки для вставки в поля Meta App Review (Instagram Graph API):'
                : 'One-click copy the live URLs required for Meta App Review & X Developer Portal:'}
            </p>

            <div className="swiss-meta-review-item">
              <div className="swiss-meta-item-header">
                <span>Privacy Policy URL:</span>
                <button 
                  className="swiss-btn-copy-small"
                  onClick={() => copyToClipboard(`${baseUrl}/legal.html#privacy`, 'privacy-url')}
                >
                  {copiedKey === 'privacy-url' ? <Check size={11} color="#33cc66" /> : <Copy size={11} />}
                  {copiedKey === 'privacy-url' ? 'COPIED' : 'COPY'}
                </button>
              </div>
              <code>{`${baseUrl}/legal.html#privacy`}</code>
            </div>

            <div className="swiss-meta-review-item">
              <div className="swiss-meta-item-header">
                <span>Terms of Service URL:</span>
                <button 
                  className="swiss-btn-copy-small"
                  onClick={() => copyToClipboard(`${baseUrl}/legal.html#terms`, 'tos-url')}
                >
                  {copiedKey === 'tos-url' ? <Check size={11} color="#33cc66" /> : <Copy size={11} />}
                  {copiedKey === 'tos-url' ? 'COPIED' : 'COPY'}
                </button>
              </div>
              <code>{`${baseUrl}/legal.html#terms`}</code>
            </div>

            <div className="swiss-meta-review-item">
              <div className="swiss-meta-item-header">
                <span>User Data Deletion URL:</span>
                <button 
                  className="swiss-btn-copy-small"
                  onClick={() => copyToClipboard(`${baseUrl}/legal.html#deletion`, 'deletion-url')}
                >
                  {copiedKey === 'deletion-url' ? <Check size={11} color="#33cc66" /> : <Copy size={11} />}
                  {copiedKey === 'deletion-url' ? 'COPIED' : 'COPY'}
                </button>
              </div>
              <code>{`${baseUrl}/legal.html#deletion`}</code>
            </div>
          </div>

          {/* Quick Table of Contents Jump Links */}
          {activeTab !== 'compliance' && (
            <div className="swiss-legal-toc">
              <div className="swiss-legal-toc-title">
                {lang === 'ru' ? 'СОДЕРЖАНИЕ РАЗДЕЛА' : 'TABLE OF CONTENTS'}
              </div>
              {(() => {
                const doc = activeTab === 'tos' ? currentData.tos : activeTab === 'privacy' ? currentData.privacy : currentData.deletion;
                return doc.sections.map(sec => (
                  <a 
                    key={sec.id} 
                    href={`#${sec.id}`}
                    className="swiss-legal-toc-item"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <span className="swiss-legal-toc-num">{sec.number}</span>
                    <span className="swiss-legal-toc-name">{sec.title}</span>
                  </a>
                ));
              })()}
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="swiss-legal-content-body">
          {/* TERMS OF SERVICE TAB */}
          {activeTab === 'tos' && (
            <div className="swiss-legal-section-list">
              <div className="swiss-legal-doc-preface">
                <strong>{lang === 'ru' ? 'ОФИЦИАЛЬНОЕ УВЕДОМЛЕНИЕ:' : 'OFFICIAL NOTICE:'}</strong>{' '}
                {lang === 'ru' 
                  ? 'Настоящее Соглашение определяет взаимные права и обязанности при использовании локально-ориентированной системы Kraftwerk Swiss Content Engine. Пользователь обладает 100% суверенитетом над всеми создаваемыми материалами и сохраняет полный контроль над приватными API-токенами.'
                  : 'This Agreement outlines the legal framework governing use of the Kraftwerk Swiss Content Engine. The user maintains 100% intellectual property sovereignty over all generated creative works and retains exclusive custody of all private API tokens.'}
              </div>

              {filterSections(currentData.tos.sections).map(sec => (
                <section key={sec.id} id={sec.id} className="swiss-legal-article">
                  <header className="swiss-legal-article-header">
                    <span className="swiss-legal-article-number">{sec.number}</span>
                    <h2 className="swiss-legal-article-title">{sec.title}</h2>
                  </header>

                  <div className="swiss-legal-article-summary">
                    {sec.summary}
                  </div>

                  <div className="swiss-legal-article-paragraphs">
                    {sec.content.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* PRIVACY POLICY TAB */}
          {activeTab === 'privacy' && (
            <div className="swiss-legal-section-list">
              <div className="swiss-legal-doc-preface" style={{ borderColor: '#33cc66' }}>
                <strong style={{ color: '#33cc66' }}>{lang === 'ru' ? 'ГАРАНТИЯ ПРИВАТНОСТИ:' : 'PRIVACY GUARANTEE:'}</strong>{' '}
                {lang === 'ru'
                  ? 'Сервис Swiss Content Engine спроектирован так, что не имеет централизованных баз сбора пользовательских данных. Ни один API-токен, контент-план или черновик поста не передается рекламным брокерам и не продается третьим сторонам.'
                  : 'Swiss Content Engine is engineered without centralized databases pooling user materials. Zero API keys, editorial schedules, or creative drafts are ever transferred to data brokers, advertising networks, or unauthorized third parties.'}
              </div>

              {filterSections(currentData.privacy.sections).map(sec => (
                <section key={sec.id} id={sec.id} className="swiss-legal-article">
                  <header className="swiss-legal-article-header">
                    <span className="swiss-legal-article-number">{sec.number}</span>
                    <h2 className="swiss-legal-article-title">{sec.title}</h2>
                  </header>

                  <div className="swiss-legal-article-summary">
                    {sec.summary}
                  </div>

                  <div className="swiss-legal-article-paragraphs">
                    {sec.content.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* USER DATA DELETION TAB */}
          {activeTab === 'deletion' && (
            <div className="swiss-legal-section-list">
              <div className="swiss-legal-doc-preface" style={{ borderColor: '#ff3b30' }}>
                <strong style={{ color: '#ff3b30' }}>{lang === 'ru' ? 'ПРАВО НА ЗАБВЕНИЕ (GDPR / META POLICY):' : 'RIGHT TO BE FORGOTTEN (GDPR / META MANDATE):'}</strong>{' '}
                {lang === 'ru'
                  ? 'В данном разделе приведены исчерпывающие пошаговые инструкции по полному удалению всех данных и отзыву авторизаций в подключенных социальных сетях (Instagram, Facebook, X, TikTok, Telegram).'
                  : 'This section provides explicit step-by-step instructions for permanent data erasure and instant revocation of permissions across all integrated platforms (Instagram, Facebook, X, TikTok, Telegram).'}
              </div>

              {filterSections(currentData.deletion.sections).map(sec => (
                <section key={sec.id} id={sec.id} className="swiss-legal-article">
                  <header className="swiss-legal-article-header">
                    <span className="swiss-legal-article-number">{sec.number}</span>
                    <h2 className="swiss-legal-article-title">{sec.title}</h2>
                  </header>

                  <div className="swiss-legal-article-summary">
                    {sec.summary}
                  </div>

                  <div className="swiss-legal-article-paragraphs">
                    {sec.content.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* DEVELOPER & API COMPLIANCE TAB */}
          {activeTab === 'compliance' && (
            <div className="swiss-compliance-view">
              {/* Compliance Badges Grid */}
              <div className="swiss-compliance-badge-grid">
                {currentData.compliance.badges.map((b, i) => (
                  <div key={i} className="swiss-compliance-badge-card">
                    <div className="swiss-compliance-badge-top">
                      <span className="swiss-compliance-badge-label">{b.label}</span>
                      <span className="swiss-compliance-badge-status">{b.status}</span>
                    </div>
                    <p className="swiss-compliance-badge-desc">{b.description}</p>
                  </div>
                ))}
              </div>

              {/* Platform Scopes & Permissions Table */}
              <div className="swiss-compliance-table-container">
                <h3 className="swiss-compliance-table-title">
                  {lang === 'ru' ? 'РАЗРЕШЕНИЯ И ОБЛАСТИ ДОСТУПА ПОДКЛЮЧЕННЫХ API (SCOPES)' : 'CONNECTED PLATFORM PERMISSION SCOPES & RETENTION'}
                </h3>
                <div className="swiss-table-responsive">
                  <table className="swiss-legal-table">
                    <thead>
                      <tr>
                        <th>{lang === 'ru' ? 'ПЛАТФОРМА' : 'PLATFORM'}</th>
                        <th>{lang === 'ru' ? 'ЗАПРАШИВАЕМЫЕ SCOPES' : 'REQUESTED SCOPES'}</th>
                        <th>{lang === 'ru' ? 'ЦЕЛЬ ИСПОЛЬЗОВАНИЯ' : 'PURPOSE & USAGE'}</th>
                        <th>{lang === 'ru' ? 'ХРАНЕНИЕ ДАННЫХ' : 'DATA RETENTION'}</th>
                        <th>{lang === 'ru' ? 'СПОСОБ УДАЛЕНИЯ' : 'DELETION METHOD'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.compliance.platforms.map((p, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{p.name}</td>
                          <td>
                            {p.scopes.map((s, si) => (
                              <span key={si} className="swiss-scope-pill">{s}</span>
                            ))}
                          </td>
                          <td>{p.purpose}</td>
                          <td style={{ color: '#33cc66' }}>{p.dataRetention}</td>
                          <td>{p.deletionMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Frequently Asked Questions */}
              <div className="swiss-compliance-faq-container">
                <h3 className="swiss-compliance-table-title">
                  {lang === 'ru' ? 'ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ ПО БЕЗОПАСНОСТИ' : 'FREQUENTLY ASKED COMPLIANCE QUESTIONS'}
                </h3>
                <div className="swiss-faq-list">
                  {currentData.compliance.faq.map((item, idx) => (
                    <div key={idx} className="swiss-faq-item">
                      <div className="swiss-faq-q">
                        <span className="swiss-faq-num">Q{idx + 1} //</span>
                        <span>{item.q}</span>
                      </div>
                      <div className="swiss-faq-a">
                        {item.a}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Swiss Legal Footer */}
      <footer className="swiss-legal-footer">
        <div className="swiss-legal-footer-left">
          <span>KRAFTWERK // CONTENT ENGINE</span>
          <span>•</span>
          <span>SWISS INTERNATIONAL DESIGN PROTOCOL</span>
          <span>•</span>
          <span>ALL RIGHTS RESERVED © 2026</span>
        </div>
        <div className="swiss-legal-footer-right">
          <span>GDPR / CCPA COMPLIANT</span>
          <span>•</span>
          <span>META & X API READY</span>
        </div>
      </footer>
    </div>
  );
};
