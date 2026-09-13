import React, { useState, useRef } from 'react';
import { AppSettings, AiTestConnectionResult } from '../../types/index.ts';
import { 
  updateSettings, 
  testOpenRouterConnection, 
  testGeminiConnection, 
  testCascadeConnection,
  testSupabaseConnection,
  exportDatabase,
  importDatabase
} from '../../services/api.ts';
import { testSocialApi, SocialTestResult } from '../../services/socialApi.ts';
import { Key, Shield, Check, ExternalLink, Loader2, Terminal, Sparkles, RefreshCw, Database, Download, Upload } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsSaved
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<AppSettings>>({
    supabaseUrl: settings.supabaseUrl || '',
    supabaseAnonKey: settings.supabaseAnonKey || '',
    geminiApiKey: settings.geminiApiKey || '',
    openRouterApiKey: settings.openRouterApiKey || '',
    aiProviderMode: settings.aiProviderMode || 'cascade',
    defaultModel: settings.defaultModel || 'gemini-3.8-flash',
    telegramBotToken: settings.telegramBotToken || '',
    telegramChatId: settings.telegramChatId || '',
    blueskyIdentifier: settings.blueskyIdentifier || '',
    blueskyAppPassword: settings.blueskyAppPassword || '',
    xApiKey: settings.xApiKey || '',
    xAccessToken: settings.xAccessToken || '',
    instagramAccessToken: settings.instagramAccessToken || '',
    instagramAccountId: settings.instagramAccountId || '',
    tiktokAccessToken: settings.tiktokAccessToken || '',
    pinterestAccessToken: settings.pinterestAccessToken || '',
    linkedinAccessToken: settings.linkedinAccessToken || '',
    threadsAccessToken: settings.threadsAccessToken || '',
    simulationMode: settings.simulationMode !== false
  });

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [isTestingOpenRouter, setIsTestingOpenRouter] = useState(false);
  const [isTestingCascade, setIsTestingCascade] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<AiTestConnectionResult | null>(null);
  const [openRouterTestResult, setOpenRouterTestResult] = useState<AiTestConnectionResult | null>(null);
  const [cascadeTestResult, setCascadeTestResult] = useState<AiTestConnectionResult | null>(null);

  // Social network API testing state
  const [testingSocial, setTestingSocial] = useState<Record<string, boolean>>({});
  const [socialTestResults, setSocialTestResults] = useState<Record<string, SocialTestResult | null>>({});

  const handleTestSocial = async (channel: string, credentials: Record<string, string>) => {
    setTestingSocial(prev => ({ ...prev, [channel]: true }));
    setSocialTestResults(prev => ({ ...prev, [channel]: null }));
    try {
      const res = await testSocialApi(channel, credentials);
      setSocialTestResults(prev => ({ ...prev, [channel]: res }));
    } catch (err: any) {
      setSocialTestResults(prev => ({
        ...prev,
        [channel]: {
          success: false,
          latencyMs: 0,
          message: err.message || 'Ошибка проверки соединения'
        }
      }));
    } finally {
      setTestingSocial(prev => ({ ...prev, [channel]: false }));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(formData);
      setFeedback('Настройки успешно сохранены!');
      onSettingsSaved();
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении настроек');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSupabase = async () => {
    if (!formData.supabaseUrl || !formData.supabaseAnonKey) {
      setSupabaseTestResult({
        success: false,
        latencyMs: 0,
        message: 'Укажите URL проекта Supabase и anon-ключ перед проверкой'
      });
      return;
    }
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const res = await testSupabaseConnection(formData.supabaseUrl, formData.supabaseAnonKey);
      setSupabaseTestResult(res);
    } catch (err: any) {
      setSupabaseTestResult({
        success: false,
        latencyMs: 0,
        message: err.message || 'Сетевая ошибка'
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleExportDb = async () => {
    setIsExporting(true);
    try {
      const jsonStr = await exportDatabase();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `swiss-content-calendar-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Ошибка экспорта базы: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportDb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const res = await importDatabase(text);
      alert(`База успешно импортирована!\nЗагружено постов: ${res.postsCount}\nЗагружено трендов: ${res.trendsCount}`);
      onSettingsSaved();
    } catch (err: any) {
      alert(`Ошибка импорта: ${err.message}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTestGemini = async () => {
    setIsTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const modelToTest = formData.defaultGeminiModel || (formData.defaultModel?.includes('gemini') ? formData.defaultModel : 'gemini-3.8-flash');
      const res = await testGeminiConnection(formData.geminiApiKey || undefined, modelToTest);
      setGeminiTestResult(res);
    } catch (err: any) {
      setGeminiTestResult({
        connected: false,
        status: 500,
        statusText: 'Error',
        latencyMs: 0,
        message: err.message || 'Сбой сети при обращении к серверу'
      });
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleTestOpenRouter = async () => {
    setIsTestingOpenRouter(true);
    setOpenRouterTestResult(null);
    try {
      const modelToTest = (formData.defaultModel?.includes('/') && formData.defaultModel?.includes(':free'))
        ? formData.defaultModel
        : 'google/gemma-4-31b-it:free';
      const res = await testOpenRouterConnection(formData.openRouterApiKey || undefined, modelToTest);
      setOpenRouterTestResult(res);
    } catch (err: any) {
      setOpenRouterTestResult({
        connected: false,
        status: 500,
        statusText: 'Error',
        latencyMs: 0,
        message: err.message || 'Сбой сети при обращении к серверу'
      });
    } finally {
      setIsTestingOpenRouter(false);
    }
  };

  const handleTestCascade = async () => {
    setIsTestingCascade(true);
    setCascadeTestResult(null);
    try {
      const res = await testCascadeConnection({
        geminiApiKey: formData.geminiApiKey || undefined,
        openRouterApiKey: formData.openRouterApiKey || undefined
      });
      setCascadeTestResult(res);
    } catch (err: any) {
      setCascadeTestResult({
        connected: false,
        status: 500,
        statusText: 'Error',
        latencyMs: 0,
        message: err.message || 'Сбой сети'
      });
    } finally {
      setIsTestingCascade(false);
    }
  };

  return (
    <div className="swiss-modal-overlay" onClick={onClose}>
      <div className="swiss-modal" style={{ maxWidth: '860px' }} onClick={e => e.stopPropagation()}>
        <div className="swiss-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key size={16} />
            <span className="swiss-modal-title">API // ИНТЕГРАЦИИ, AI КАСКАД И КЛЮЧИ ДОСТУПА</span>
          </div>
          <button className="swiss-btn swiss-btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="swiss-modal-body" style={{ maxHeight: '72vh' }}>
            {/* Simulation Mode Switch */}
            <div style={{ 
              backgroundColor: formData.simulationMode ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)', 
              border: '1px solid var(--border-medium)', 
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={15} />
                  ТЕСТОВЫЙ РЕЖИМ СИМУЛЯЦИИ (SANDBOX)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  При включенном режиме публикация в соцсети выполняется в песочнице с валидацией лимитов без необходимости иметь реальные API-ключи соцсетей.
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                <input 
                  type="checkbox" 
                  checked={formData.simulationMode}
                  onChange={e => setFormData({ ...formData, simulationMode: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--text-primary)' }}
                />
                {formData.simulationMode ? 'ВКЛЮЧЕН' : 'ОТКЛЮЧЕН'}
              </label>
            </div>

            {/* Section 0: CLOUD DATABASE (SUPABASE & BACKUP) */}
            <div style={{ marginBottom: '28px', border: '1px solid var(--border-medium)', padding: '16px', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} color="#33cc66" />
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                    00 // ОБЛАЧНАЯ БАЗА ДАННЫХ (SUPABASE & BACKUP)
                  </h4>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="swiss-btn swiss-btn-sm"
                    style={{ fontSize: '11px', borderColor: '#33cc66', color: '#33cc66' }}
                    onClick={handleTestSupabase}
                    disabled={isTestingSupabase}
                  >
                    {isTestingSupabase ? (
                      <>
                        <Loader2 size={12} className="spin" />
                        ТЕСТ ПОДКЛЮЧЕНИЯ...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={12} />
                        ПРОВЕРИТЬ SUPABASE
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Для надежного хранения данных на <strong>GitHub Pages</strong> подключите бесплатный облачный проект <strong>Supabase (PostgreSQL)</strong>. Если параметры не заданы, данные хранятся автономно в вашем браузере (LocalStorage). Ваши ключи сохраняются исключительно на вашем устройстве.
              </div>

              {/* Supabase Test Result Banner */}
              {supabaseTestResult && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  backgroundColor: supabaseTestResult.success ? '#0d1f12' : '#260e0e',
                  border: `1px solid ${supabaseTestResult.success ? '#33cc66' : '#ff4444'}`,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px'
                }}>
                  <div style={{ fontWeight: 800, color: supabaseTestResult.success ? '#33cc66' : '#ff4444', marginBottom: '4px' }}>
                    {supabaseTestResult.success ? '✓ ОБЛАЧНАЯ БАЗА ДАННЫХ ПОДКЛЮЧЕНА' : '✕ ОШИБКА ПОДКЛЮЧЕНИЯ К SUPABASE'}
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>
                    {supabaseTestResult.message}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="swiss-form-group">
                  <label className="swiss-label">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    className="swiss-input"
                    placeholder="https://xyzcompany.supabase.co"
                    value={formData.supabaseUrl}
                    onChange={e => setFormData({ ...formData, supabaseUrl: e.target.value })}
                  />
                </div>
                <div className="swiss-form-group">
                  <label className="swiss-label">
                    Supabase Anon Public Key {settings.hasSupabaseKey && <span style={{ color: '#33cc66' }}>[Задан]</span>}
                  </label>
                  <input
                    type="password"
                    className="swiss-input"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={formData.supabaseAnonKey}
                    onChange={e => setFormData({ ...formData, supabaseAnonKey: e.target.value })}
                  />
                </div>
              </div>

              {/* Database Export & Import Tools */}
              <div style={{ 
                borderTop: '1px solid var(--border-subtle)', 
                paddingTop: '12px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  Резервное копирование: сохраните полный снимок постов и трендов в файл JSON
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept=".json" 
                    onChange={handleImportDb} 
                  />
                  <button
                    type="button"
                    className="swiss-btn swiss-btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Upload size={12} />
                    {isImporting ? 'ИМПОРТ...' : 'ИМПОРТ ИЗ JSON'}
                  </button>
                  <button
                    type="button"
                    className="swiss-btn swiss-btn-sm"
                    onClick={handleExportDb}
                    disabled={isExporting}
                    style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={12} />
                    {isExporting ? 'ЭКСПОРТ...' : 'ЭКСПОРТ ВСЕЙ БАЗЫ (JSON)'}
                  </button>
                </div>
              </div>
            </div>

            {/* Section 1: DUAL AI ENGINES (GEMINI & OPENROUTER CASCADE) */}
            <div style={{ marginBottom: '28px', border: '1px solid var(--border-medium)', padding: '16px', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#ffaa00" />
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                    01 // ДВОЙНОЙ AI КАСКАД (GEMINI + OPENROUTER)
                  </h4>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="swiss-btn swiss-btn-sm"
                    style={{ fontSize: '11px', borderColor: '#33cc66', color: '#33cc66' }}
                    onClick={handleTestCascade}
                    disabled={isTestingCascade}
                  >
                    {isTestingCascade ? (
                      <>
                        <Loader2 size={12} className="spin" />
                        ТЕСТ КАСКАДА...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={12} />
                        ⚡️ ТЕСТ ВСЕГО КАСКАДА (FAILOVER)
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Failover explanation banner */}
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Система использует двухуровневый каскад: запросы сначала направляются в <strong>Google Gemini API</strong> (высокая скорость и бесплатные квоты с чистым JSON). Если у Gemini исчерпан лимит запросов (ошибка 429) или произошел сбой, система мгновенно и прозрачно переключается на резервный пул <strong>OpenRouter API</strong>.
              </div>

              {/* Cascade Test Result Banner */}
              {cascadeTestResult && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  backgroundColor: cascadeTestResult.connected ? '#0d1f12' : '#260e0e',
                  border: `1px solid ${cascadeTestResult.connected ? '#33cc66' : '#ff4444'}`,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px'
                }}>
                  <div style={{ fontWeight: 800, color: cascadeTestResult.connected ? '#33cc66' : '#ff4444', marginBottom: '4px' }}>
                    {cascadeTestResult.connected ? '✓ КАСКАД АКТИВЕН И ГОТОВ К РАБОТЕ' : '✕ КАСКАД НЕ АКТИВЕН (ОБА ПРОВАЙДЕРА НЕДОСТУПНЫ)'}
                  </div>
                  <div style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>
                    {cascadeTestResult.message}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                    <div>
                      <strong>Google Gemini (Основной):</strong> {cascadeTestResult.gemini?.connected ? `✓ 200 OK (${cascadeTestResult.gemini.latencyMs}мс)` : `✕ ${cascadeTestResult.gemini?.message || 'Не подключен'}`}
                    </div>
                    <div>
                      <strong>OpenRouter (Резерв):</strong> {cascadeTestResult.openRouter?.connected ? `✓ 200 OK (${cascadeTestResult.openRouter.latencyMs}мс, ${cascadeTestResult.openRouter.actualModel})` : `✕ ${cascadeTestResult.openRouter?.message || 'Не подключен'}`}
                    </div>
                  </div>
                </div>
              )}

              {/* Cascade Priority Selector */}
              <div className="swiss-form-group" style={{ marginBottom: '18px' }}>
                <label className="swiss-label">Режим работы отказоустойчивого каскада</label>
                <select 
                  className="swiss-select"
                  value={formData.aiProviderMode || 'cascade'}
                  onChange={e => setFormData({ ...formData, aiProviderMode: e.target.value as any })}
                >
                  <option value="cascade">🔄 Умный каскад: Gemini (Основной) ➔ OpenRouter (Резерв при 429 / сбое) // РЕКОМЕНДУЕТСЯ</option>
                  <option value="gemini_only">✨ Только Google Gemini API</option>
                  <option value="openrouter_only">⚡️ Только OpenRouter API</option>
                </select>
              </div>

              {/* DUAL KEYS GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                {/* SUB-BLOCK 1: GOOGLE GEMINI */}
                <div style={{ border: '1px solid var(--border-subtle)', padding: '12px', backgroundColor: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#33cc66' }}>
                      ✨ 01.A // GOOGLE GEMINI API (ОСНОВНОЙ)
                    </span>
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ color: 'var(--text-secondary)', fontSize: '10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      Получить бесплатный ключ <ExternalLink size={10} />
                    </a>
                  </div>

                  <div className="swiss-form-group" style={{ marginBottom: '10px' }}>
                    <label className="swiss-label" style={{ fontSize: '11px' }}>
                      Gemini API Key {settings.hasGeminiKey && <span style={{ color: '#33cc66' }}>[Установлен: {settings.geminiApiKeyMasked}]</span>}
                    </label>
                    <input 
                      type="password" 
                      className="swiss-input" 
                      placeholder={settings.hasGeminiKey ? 'Оставьте пустым, чтобы не менять' : 'AIzaSy...'}
                      value={formData.geminiApiKey}
                      onChange={e => setFormData({ ...formData, geminiApiKey: e.target.value })}
                    />
                  </div>

                  <button
                    type="button"
                    className="swiss-btn swiss-btn-sm"
                    style={{ width: '100%', fontSize: '10px', padding: '6px 10px', borderColor: '#33cc66', color: '#33cc66' }}
                    onClick={handleTestGemini}
                    disabled={isTestingGemini}
                  >
                    {isTestingGemini ? (
                      <>
                        <Loader2 size={11} className="spin" />
                        ТЕСТ GEMINI...
                      </>
                    ) : (
                      <>
                        <Terminal size={11} />
                        ⚡️ ТЕСТ GEMINI (САНДБОКС-ПИНГ)
                      </>
                    )}
                  </button>

                  {geminiTestResult && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 10px',
                      backgroundColor: geminiTestResult.connected ? '#0d1f12' : '#260e0e',
                      border: `1px solid ${geminiTestResult.connected ? '#33cc66' : '#ff4444'}`,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      lineHeight: 1.4
                    }}>
                      <div style={{ fontWeight: 800, color: geminiTestResult.connected ? '#33cc66' : '#ff4444' }}>
                        {geminiTestResult.connected ? `✓ 200 OK (${geminiTestResult.latencyMs}мс)` : `✕ Ошибка (${geminiTestResult.status})`}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>{geminiTestResult.message}</div>
                    </div>
                  )}
                </div>

                {/* SUB-BLOCK 2: OPENROUTER */}
                <div style={{ border: '1px solid var(--border-subtle)', padding: '12px', backgroundColor: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#ffaa00' }}>
                      ⚡️ 01.B // OPENROUTER API (РЕЗЕРВ / FALLBACK)
                    </span>
                    <a 
                      href="https://openrouter.ai/keys" 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ color: 'var(--text-secondary)', fontSize: '10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      Получить ключ <ExternalLink size={10} />
                    </a>
                  </div>

                  <div className="swiss-form-group" style={{ marginBottom: '10px' }}>
                    <label className="swiss-label" style={{ fontSize: '11px' }}>
                      OpenRouter API Key {settings.hasOpenRouterKey && <span style={{ color: '#33cc66' }}>[Установлен: {settings.openRouterApiKeyMasked}]</span>}
                    </label>
                    <input 
                      type="password" 
                      className="swiss-input" 
                      placeholder={settings.hasOpenRouterKey ? 'Оставьте пустым, чтобы не менять' : 'sk-or-v1-...'}
                      value={formData.openRouterApiKey}
                      onChange={e => setFormData({ ...formData, openRouterApiKey: e.target.value })}
                    />
                  </div>

                  <button
                    type="button"
                    className="swiss-btn swiss-btn-sm"
                    style={{ width: '100%', fontSize: '10px', padding: '6px 10px', borderColor: '#ffaa00', color: '#ffaa00' }}
                    onClick={handleTestOpenRouter}
                    disabled={isTestingOpenRouter}
                  >
                    {isTestingOpenRouter ? (
                      <>
                        <Loader2 size={11} className="spin" />
                        ТЕСТ OPENROUTER...
                      </>
                    ) : (
                      <>
                        <Terminal size={11} />
                        ⚡️ ТЕСТ OPENROUTER (САНДБОКС-ПИНГ)
                      </>
                    )}
                  </button>

                  {openRouterTestResult && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 10px',
                      backgroundColor: openRouterTestResult.connected ? '#0d1f12' : '#260e0e',
                      border: `1px solid ${openRouterTestResult.connected ? '#33cc66' : '#ff4444'}`,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      lineHeight: 1.4
                    }}>
                      <div style={{ fontWeight: 800, color: openRouterTestResult.connected ? '#33cc66' : '#ff4444' }}>
                        {openRouterTestResult.connected ? `✓ 200 OK (${openRouterTestResult.latencyMs}мс)` : `✕ Ошибка (${openRouterTestResult.status})`}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>{openRouterTestResult.message}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Model selection */}
              <div className="swiss-form-group" style={{ marginBottom: 0 }}>
                <label className="swiss-label">Предпочитаемая модель генерации (по умолчанию)</label>
                <select 
                  className="swiss-select"
                  value={formData.defaultModel}
                  onChange={e => setFormData({ ...formData, defaultModel: e.target.value })}
                >
                  {settings.availableModels?.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 2: Telegram */}
            <div style={{ marginBottom: '24px', border: '1px solid var(--border-medium)', padding: '16px', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                    02 // TELEGRAM BOT & CHANNEL
                  </h4>
                  {settings.hasTelegramKey && <span style={{ color: '#33cc66', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>[Ключ сохранен]</span>}
                </div>
                <button
                  type="button"
                  className="swiss-btn swiss-btn-sm"
                  style={{ fontSize: '11px', borderColor: '#33cc66', color: '#33cc66' }}
                  onClick={() => handleTestSocial('telegram', {
                    telegramBotToken: formData.telegramBotToken || '',
                    telegramChatId: formData.telegramChatId || ''
                  })}
                  disabled={testingSocial['telegram']}
                >
                  {testingSocial['telegram'] ? (
                    <>
                      <Loader2 size={12} className="spin" />
                      ТЕСТ TELEGRAM...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={12} />
                      ПРОВЕРИТЬ TELEGRAM API
                    </>
                  )}
                </button>
              </div>

              {socialTestResults['telegram'] && (
                <div style={{
                  marginBottom: '14px',
                  padding: '10px 14px',
                  backgroundColor: socialTestResults['telegram'].success ? '#0d1f12' : '#260e0e',
                  border: `1px solid ${socialTestResults['telegram'].success ? '#33cc66' : '#ff4444'}`,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px'
                }}>
                  <div style={{ fontWeight: 800, color: socialTestResults['telegram'].success ? '#33cc66' : '#ff4444', marginBottom: '2px' }}>
                    {socialTestResults['telegram'].success ? `✓ ПОДКЛЮЧЕНО (${socialTestResults['telegram'].latencyMs}мс)` : '✕ ОШИБКА ПОДКЛЮЧЕНИЯ К TELEGRAM'}
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>{socialTestResults['telegram'].message}</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="swiss-form-group">
                  <label className="swiss-label">
                    Bot Token {settings.hasTelegramKey && <span style={{ color: '#33cc66' }}>[Задан]</span>}
                  </label>
                  <input 
                    type="password" 
                    className="swiss-input" 
                    placeholder={settings.hasTelegramKey ? 'Оставьте пустым, чтобы не менять' : '123456789:ABCdefGHIjklMNO...'}
                    value={formData.telegramBotToken}
                    onChange={e => setFormData({ ...formData, telegramBotToken: e.target.value })}
                  />
                </div>
                <div className="swiss-form-group">
                  <label className="swiss-label">Target Channel / Chat ID</label>
                  <input 
                    type="text" 
                    className="swiss-input" 
                    placeholder="@design_channel или -10012345678"
                    value={formData.telegramChatId}
                    onChange={e => setFormData({ ...formData, telegramChatId: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Bluesky */}
            <div style={{ marginBottom: '24px', border: '1px solid var(--border-medium)', padding: '16px', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                    03 // BLUESKY (ATPROTO)
                  </h4>
                  {settings.hasBlueskyKey && <span style={{ color: '#33cc66', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>[Ключ сохранен]</span>}
                </div>
                <button
                  type="button"
                  className="swiss-btn swiss-btn-sm"
                  style={{ fontSize: '11px', borderColor: '#33cc66', color: '#33cc66' }}
                  onClick={() => handleTestSocial('bluesky', {
                    blueskyIdentifier: formData.blueskyIdentifier || '',
                    blueskyAppPassword: formData.blueskyAppPassword || ''
                  })}
                  disabled={testingSocial['bluesky']}
                >
                  {testingSocial['bluesky'] ? (
                    <>
                      <Loader2 size={12} className="spin" />
                      ТЕСТ BLUESKY...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={12} />
                      ПРОВЕРИТЬ BLUESKY API
                    </>
                  )}
                </button>
              </div>

              {socialTestResults['bluesky'] && (
                <div style={{
                  marginBottom: '14px',
                  padding: '10px 14px',
                  backgroundColor: socialTestResults['bluesky'].success ? '#0d1f12' : '#260e0e',
                  border: `1px solid ${socialTestResults['bluesky'].success ? '#33cc66' : '#ff4444'}`,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px'
                }}>
                  <div style={{ fontWeight: 800, color: socialTestResults['bluesky'].success ? '#33cc66' : '#ff4444', marginBottom: '2px' }}>
                    {socialTestResults['bluesky'].success ? `✓ ПОДКЛЮЧЕНО (${socialTestResults['bluesky'].latencyMs}мс)` : '✕ ОШИБКА ПОДКЛЮЧЕНИЯ К BLUESKY'}
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>{socialTestResults['bluesky'].message}</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="swiss-form-group">
                  <label className="swiss-label">Handle / Identifier</label>
                  <input 
                    type="text" 
                    className="swiss-input" 
                    placeholder="studio.bsky.social"
                    value={formData.blueskyIdentifier}
                    onChange={e => setFormData({ ...formData, blueskyIdentifier: e.target.value })}
                  />
                </div>
                <div className="swiss-form-group">
                  <label className="swiss-label">
                    App Password {settings.hasBlueskyKey && <span style={{ color: '#33cc66' }}>[Задан]</span>}
                  </label>
                  <input 
                    type="password" 
                    className="swiss-input" 
                    placeholder={settings.hasBlueskyKey ? 'Оставьте пустым, чтобы не менять' : 'xxxx-xxxx-xxxx-xxxx'}
                    value={formData.blueskyAppPassword}
                    onChange={e => setFormData({ ...formData, blueskyAppPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Instagram & Meta Threads */}
            <div style={{ marginBottom: '24px', border: '1px solid var(--border-medium)', padding: '16px', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                  04 // META ECOSYSTEM (INSTAGRAM GRAPH & THREADS)
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* 04.A: INSTAGRAM */}
                <div style={{ border: '1px solid var(--border-subtle)', padding: '12px', backgroundColor: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>
                      04.A // INSTAGRAM GRAPH API
                    </span>
                    <button
                      type="button"
                      className="swiss-btn swiss-btn-sm"
                      style={{ fontSize: '10px', padding: '4px 8px' }}
                      onClick={() => handleTestSocial('instagram', {
                        instagramAccessToken: formData.instagramAccessToken || '',
                        instagramAccountId: formData.instagramAccountId || ''
                      })}
                      disabled={testingSocial['instagram']}
                    >
                      {testingSocial['instagram'] ? <Loader2 size={10} className="spin" /> : <RefreshCw size={10} />}
                      ПРОВЕРИТЬ INSTAGRAM
                    </button>
                  </div>

                  {socialTestResults['instagram'] && (
                    <div style={{
                      marginBottom: '10px',
                      padding: '8px 10px',
                      backgroundColor: socialTestResults['instagram'].success ? '#0d1f12' : '#260e0e',
                      border: `1px solid ${socialTestResults['instagram'].success ? '#33cc66' : '#ff4444'}`,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px'
                    }}>
                      <div style={{ fontWeight: 800, color: socialTestResults['instagram'].success ? '#33cc66' : '#ff4444' }}>
                        {socialTestResults['instagram'].success ? `✓ ПОДКЛЮЧЕНО (${socialTestResults['instagram'].latencyMs}мс)` : '✕ ОШИБКА INSTAGRAM'}
                      </div>
                      <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>{socialTestResults['instagram'].message}</div>
                    </div>
                  )}

                  <div className="swiss-form-group" style={{ marginBottom: '10px' }}>
                    <label className="swiss-label" style={{ fontSize: '11px' }}>
                      Instagram Graph Token {settings.hasInstagramKey && <span style={{ color: '#33cc66' }}>[Задан]</span>}
                    </label>
                    <input 
                      type="password" 
                      className="swiss-input" 
                      placeholder={settings.hasInstagramKey ? 'Оставьте пустым, чтобы не менять' : 'EAAB... (User / Page Access Token)'}
                      value={formData.instagramAccessToken}
                      onChange={e => setFormData({ ...formData, instagramAccessToken: e.target.value })}
                    />
                  </div>
                  <div className="swiss-form-group" style={{ marginBottom: 0 }}>
                    <label className="swiss-label" style={{ fontSize: '11px' }}>Instagram Business Account ID (опционально)</label>
                    <input 
                      type="text" 
                      className="swiss-input" 
                      placeholder="17841400000000000"
                      value={formData.instagramAccountId}
                      onChange={e => setFormData({ ...formData, instagramAccountId: e.target.value })}
                    />
                  </div>
                </div>

                {/* 04.B: THREADS */}
                <div style={{ border: '1px solid var(--border-subtle)', padding: '12px', backgroundColor: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>
                      04.B // META THREADS API
                    </span>
                    <button
                      type="button"
                      className="swiss-btn swiss-btn-sm"
                      style={{ fontSize: '10px', padding: '4px 8px' }}
                      onClick={() => handleTestSocial('threads', {
                        threadsAccessToken: formData.threadsAccessToken || ''
                      })}
                      disabled={testingSocial['threads']}
                    >
                      {testingSocial['threads'] ? <Loader2 size={10} className="spin" /> : <RefreshCw size={10} />}
                      ПРОВЕРИТЬ THREADS
                    </button>
                  </div>

                  {socialTestResults['threads'] && (
                    <div style={{
                      marginBottom: '10px',
                      padding: '8px 10px',
                      backgroundColor: socialTestResults['threads'].success ? '#0d1f12' : '#260e0e',
                      border: `1px solid ${socialTestResults['threads'].success ? '#33cc66' : '#ff4444'}`,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px'
                    }}>
                      <div style={{ fontWeight: 800, color: socialTestResults['threads'].success ? '#33cc66' : '#ff4444' }}>
                        {socialTestResults['threads'].success ? `✓ ПОДКЛЮЧЕНО (${socialTestResults['threads'].latencyMs}мс)` : '✕ ОШИБКА THREADS'}
                      </div>
                      <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>{socialTestResults['threads'].message}</div>
                    </div>
                  )}

                  <div className="swiss-form-group" style={{ marginBottom: 0 }}>
                    <label className="swiss-label" style={{ fontSize: '11px' }}>
                      Threads Access Token {settings.hasThreadsKey && <span style={{ color: '#33cc66' }}>[Задан]</span>}
                    </label>
                    <input 
                      type="password" 
                      className="swiss-input" 
                      placeholder={settings.hasThreadsKey ? 'Оставьте пустым, чтобы не менять' : 'THQ... (Threads User Token)'}
                      value={formData.threadsAccessToken}
                      onChange={e => setFormData({ ...formData, threadsAccessToken: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: TikTok, Pinterest, LinkedIn & X */}
            <div style={{ marginBottom: '24px', border: '1px solid var(--border-medium)', padding: '16px', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                  05 // TIKTOK, PINTEREST, LINKEDIN & X (TWITTER)
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* 05.A: TikTok */}
                <div style={{ border: '1px solid var(--border-subtle)', padding: '12px', backgroundColor: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>
                      05.A // TIKTOK CREATOR API
                    </span>
                    <button
                      type="button"
                      className="swiss-btn swiss-btn-sm"
                      style={{ fontSize: '10px', padding: '4px 8px' }}
                      onClick={() => handleTestSocial('tiktok', {
                        tiktokAccessToken: formData.tiktokAccessToken || ''
                      })}
                      disabled={testingSocial['tiktok']}
                    >
                      {testingSocial['tiktok'] ? <Loader2 size={10} className="spin" /> : <RefreshCw size={10} />}
                      ПРОВЕРИТЬ TIKTOK
                    </button>
                  </div>

                  {socialTestResults['tiktok'] && (
                    <div style={{
                      marginBottom: '10px',
                      padding: '8px 10px',
                      backgroundColor: socialTestResults['tiktok'].success ? '#0d1f12' : '#260e0e',
                      border: `1px solid ${socialTestResults['tiktok'].success ? '#33cc66' : '#ff4444'}`,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px'
                    }}>
                      <div style={{ fontWeight: 800, color: socialTestResults['tiktok'].success ? '#33cc66' : '#ff4444' }}>
                        {socialTestResults['tiktok'].success ? `✓ ПОДКЛЮЧЕНО (${socialTestResults['tiktok'].latencyMs}мс)` : '✕ ОШИБКА TIKTOK'}
                      </div>
                      <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>{socialTestResults['tiktok'].message}</div>
                    </div>
                  )}

                  <div className="swiss-form-group" style={{ marginBottom: 0 }}>
                    <label className="swiss-label" style={{ fontSize: '11px' }}>
                      TikTok Creator Token {settings.hasTikTokKey && <span style={{ color: '#33cc66' }}>[Задан]</span>}
                    </label>
                    <input 
                      type="password" 
                      className="swiss-input" 
                      placeholder={settings.hasTikTokKey ? 'Оставьте пустым, чтобы не менять' : 'act.example...'}
                      value={formData.tiktokAccessToken}
                      onChange={e => setFormData({ ...formData, tiktokAccessToken: e.target.value })}
                    />
                  </div>
                </div>

                {/* 05.B: Pinterest */}
                <div style={{ border: '1px solid var(--border-subtle)', padding: '12px', backgroundColor: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>
                      05.B // PINTEREST API
                    </span>
                    <button
                      type="button"
                      className="swiss-btn swiss-btn-sm"
                      style={{ fontSize: '10px', padding: '4px 8px' }}
                      onClick={() => handleTestSocial('pinterest', {
                        pinterestAccessToken: formData.pinterestAccessToken || ''
                      })}
                      disabled={testingSocial['pinterest']}
                    >
                      {testingSocial['pinterest'] ? <Loader2 size={10} className="spin" /> : <RefreshCw size={10} />}
                      ПРОВЕРИТЬ PINTEREST
                    </button>
                  </div>

                  {socialTestResults['pinterest'] && (
                    <div style={{
                      marginBottom: '10px',
                      padding: '8px 10px',
                      backgroundColor: socialTestResults['pinterest'].success ? '#0d1f12' : '#260e0e',
                      border: `1px solid ${socialTestResults['pinterest'].success ? '#33cc66' : '#ff4444'}`,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px'
                    }}>
                      <div style={{ fontWeight: 800, color: socialTestResults['pinterest'].success ? '#33cc66' : '#ff4444' }}>
                        {socialTestResults['pinterest'].success ? `✓ ПОДКЛЮЧЕНО (${socialTestResults['pinterest'].latencyMs}мс)` : '✕ ОШИБКА PINTEREST'}
                      </div>
                      <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>{socialTestResults['pinterest'].message}</div>
                    </div>
                  )}

                  <div className="swiss-form-group" style={{ marginBottom: 0 }}>
                    <label className="swiss-label" style={{ fontSize: '11px' }}>
                      Pinterest Token {settings.hasPinterestKey && <span style={{ color: '#33cc66' }}>[Задан]</span>}
                    </label>
                    <input 
                      type="password" 
                      className="swiss-input" 
                      placeholder={settings.hasPinterestKey ? 'Оставьте пустым, чтобы не менять' : 'pina_...'}
                      value={formData.pinterestAccessToken}
                      onChange={e => setFormData({ ...formData, pinterestAccessToken: e.target.value })}
                    />
                  </div>
                </div>

                {/* 05.C: LinkedIn */}
                <div style={{ border: '1px solid var(--border-subtle)', padding: '12px', backgroundColor: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>
                      05.C // LINKEDIN MARKETING API
                    </span>
                    <button
                      type="button"
                      className="swiss-btn swiss-btn-sm"
                      style={{ fontSize: '10px', padding: '4px 8px' }}
                      onClick={() => handleTestSocial('linkedin', {
                        linkedinAccessToken: formData.linkedinAccessToken || ''
                      })}
                      disabled={testingSocial['linkedin']}
                    >
                      {testingSocial['linkedin'] ? <Loader2 size={10} className="spin" /> : <RefreshCw size={10} />}
                      ПРОВЕРИТЬ LINKEDIN
                    </button>
                  </div>

                  {socialTestResults['linkedin'] && (
                    <div style={{
                      marginBottom: '10px',
                      padding: '8px 10px',
                      backgroundColor: socialTestResults['linkedin'].success ? '#0d1f12' : '#260e0e',
                      border: `1px solid ${socialTestResults['linkedin'].success ? '#33cc66' : '#ff4444'}`,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px'
                    }}>
                      <div style={{ fontWeight: 800, color: socialTestResults['linkedin'].success ? '#33cc66' : '#ff4444' }}>
                        {socialTestResults['linkedin'].success ? `✓ ПОДКЛЮЧЕНО (${socialTestResults['linkedin'].latencyMs}мс)` : '✕ ОШИБКА LINKEDIN'}
                      </div>
                      <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>{socialTestResults['linkedin'].message}</div>
                    </div>
                  )}

                  <div className="swiss-form-group" style={{ marginBottom: 0 }}>
                    <label className="swiss-label" style={{ fontSize: '11px' }}>
                      LinkedIn Token {settings.hasLinkedInKey && <span style={{ color: '#33cc66' }}>[Задан]</span>}
                    </label>
                    <input 
                      type="password" 
                      className="swiss-input" 
                      placeholder={settings.hasLinkedInKey ? 'Оставьте пустым, чтобы не менять' : 'AQV...'}
                      value={formData.linkedinAccessToken}
                      onChange={e => setFormData({ ...formData, linkedinAccessToken: e.target.value })}
                    />
                  </div>
                </div>

                {/* 05.D: X (Twitter) */}
                <div style={{ border: '1px solid var(--border-subtle)', padding: '12px', backgroundColor: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>
                      05.D // X (TWITTER) API
                    </span>
                    <button
                      type="button"
                      className="swiss-btn swiss-btn-sm"
                      style={{ fontSize: '10px', padding: '4px 8px' }}
                      onClick={() => handleTestSocial('twitter', {
                        xApiKey: formData.xApiKey || formData.xAccessToken || ''
                      })}
                      disabled={testingSocial['twitter']}
                    >
                      {testingSocial['twitter'] ? <Loader2 size={10} className="spin" /> : <RefreshCw size={10} />}
                      ПРОВЕРИТЬ X
                    </button>
                  </div>

                  {socialTestResults['twitter'] && (
                    <div style={{
                      marginBottom: '10px',
                      padding: '8px 10px',
                      backgroundColor: socialTestResults['twitter'].success ? '#0d1f12' : '#260e0e',
                      border: `1px solid ${socialTestResults['twitter'].success ? '#33cc66' : '#ff4444'}`,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px'
                    }}>
                      <div style={{ fontWeight: 800, color: socialTestResults['twitter'].success ? '#33cc66' : '#ff4444' }}>
                        {socialTestResults['twitter'].success ? `✓ ПОДКЛЮЧЕНО (${socialTestResults['twitter'].latencyMs}мс)` : '✕ ОШИБКА X'}
                      </div>
                      <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>{socialTestResults['twitter'].message}</div>
                    </div>
                  )}

                  <div className="swiss-form-group" style={{ marginBottom: 0 }}>
                    <label className="swiss-label" style={{ fontSize: '11px' }}>
                      X API Key / Bearer Token {settings.hasXKey && <span style={{ color: '#33cc66' }}>[Задан]</span>}
                    </label>
                    <input 
                      type="password" 
                      className="swiss-input" 
                      placeholder={settings.hasXKey ? 'Оставьте пустым, чтобы не менять' : 'AAAAAAAAAAAA...'}
                      value={formData.xApiKey}
                      onChange={e => setFormData({ ...formData, xApiKey: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="swiss-modal-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {feedback && (
                <span style={{ color: '#33cc66', fontFamily: 'var(--font-mono)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} /> {feedback}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="swiss-btn" onClick={onClose}>
                ЗАКРЫТЬ
              </button>
              <button type="submit" className="swiss-btn swiss-btn-primary" disabled={isSaving}>
                {isSaving ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ НАСТРОЙКИ'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
