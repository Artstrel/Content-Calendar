import React, { useState, useEffect } from 'react';
import { 
  Post, 
  Platform, 
  ContentFormat, 
  AppSettings,
  AiTelemetry
} from '../../types/index.ts';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Send, 
  Loader2, 
  Upload, 
  Trash2, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe,
  ExternalLink,
  AlertTriangle,
  Activity,
  Terminal,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Check
} from 'lucide-react';
import { generateScriptAI, uploadMedia, publishPost, testCascadeConnection } from '../../services/api.ts';

interface PostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPost: Post, forceDuplicate?: boolean) => void;
  onPostUpdated: () => void;
  settings: AppSettings;
  existingPosts?: Post[];
  onSelectExistingPost?: (existing: Post) => void;
  onDelete?: (id: string) => void;
}

type ModalTab = 'general' | 'ai-script' | 'media' | 'preview-publish';

export const PostModal: React.FC<PostModalProps> = ({
  post,
  isOpen,
  onClose,
  onSave,
  onPostUpdated,
  settings,
  existingPosts = [],
  onSelectExistingPost,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('general');
  const [formData, setFormData] = useState<Post>({ ...post });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [activePreviewPlatform, setActivePreviewPlatform] = useState<Platform | 'stories'>('instagram');

  // Interactive Player States
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [activeTikTokSceneIndex, setActiveTikTokSceneIndex] = useState<number>(0);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState<number>(0);
  const [pollVotedOption, setPollVotedOption] = useState<number | null>(null);

  // AI Script Generation & Sandbox state
  const [selectedModel, setSelectedModel] = useState<string>(
    settings.defaultModel || 'gemini-3.8-flash'
  );
  const [viralStrategy, setViralStrategy] = useState<string>(
    'Редизайн бренда / До и После (разбор мышления в Figma)'
  );
  const [useWebSearch, setUseWebSearch] = useState<boolean>(true);
  const [referenceUrl, setReferenceUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiTone, setAiTone] = useState<string>('голодный джуниор, открытый к критике, строгий швейцарский стиль');
  const [aiAudience, setAiAudience] = useState<string>('арт-директора студий, лид-дизайнеры, клиенты');

  // Sandbox & API Telemetry state
  const [aiTelemetry, setAiTelemetry] = useState<AiTelemetry | null>(null);
  const [isTestingSandbox, setIsTestingSandbox] = useState<boolean>(false);
  const [showSandboxDetails, setShowSandboxDetails] = useState<boolean>(false);

  // Media upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Publishing state
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishLogs, setPublishLogs] = useState<any[]>([]);
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  // Channel-specific text overrides
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({
    instagram: formData.caption || '',
    stories: formData.storiesChain?.[0]?.textOverlay || formData.hook || '',
    twitter: formData.threadPosts?.[0] || formData.caption?.slice(0, 280) || '',
    bluesky: formData.threadPosts?.[0] || formData.caption?.slice(0, 300) || '',
    telegram: formData.telegramPost || formData.caption || '',
    tiktok: formData.videoScript?.[0]?.textOverlay || formData.caption || '',
    pinterest: formData.caption || '',
    linkedin: formData.caption || '',
    threads: formData.threadPosts?.[0] || formData.caption?.slice(0, 500) || ''
  });

  if (!isOpen) return null;

  const allPlatforms: { id: Platform; label: string }[] = [
    { id: 'instagram', label: 'INSTAGRAM' },
    { id: 'twitter', label: 'X (TWITTER)' },
    { id: 'bluesky', label: 'BLUESKY' },
    { id: 'telegram', label: 'TELEGRAM' },
    { id: 'tiktok', label: 'TIKTOK' },
    { id: 'pinterest', label: 'PINTEREST' },
    { id: 'linkedin', label: 'LINKEDIN' },
    { id: 'threads', label: 'THREADS' }
  ];

  const viralStrategiesList = [
    'Редизайн бренда / До и После (разбор мышления в Figma)',
    'Реалити поиска работы и фидбек от арт-директора',
    'Интерактивный Stories-квест / Опрос по кернингу',
    'Разбор 3 частых ошибок новичков в композиции',
    'Бесплатный Figma-кит модульной сетки 8px'
  ];

  const toggleChannel = (channel: Platform) => {
    const exists = formData.channels.includes(channel);
    const updated = exists 
      ? formData.channels.filter(c => c !== channel)
      : [...formData.channels, channel];
    setFormData({ ...formData, channels: updated });
  };

  // Live Stopwatch logic
  useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  const formatStopwatchTime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const commitStopwatchTime = () => {
    if (stopwatchSeconds <= 0) return;
    const addedMinutes = Math.max(1, Math.round(stopwatchSeconds / 60));
    setFormData(prev => ({
      ...prev,
      timeSpentMinutes: (prev.timeSpentMinutes || 0) + addedMinutes
    }));
    setStopwatchSeconds(0);
    setIsStopwatchRunning(false);
  };

  const addQuickMinutes = (mins: number) => {
    setFormData(prev => ({
      ...prev,
      timeSpentMinutes: Math.max(0, (prev.timeSpentMinutes || 0) + mins)
    }));
  };

  const handleGenerateScript = async () => {
    setIsGenerating(true);
    try {
      const res = await generateScriptAI({
        title: formData.title,
        topic: formData.title,
        format: formData.format,
        targetAudience: aiAudience,
        tone: aiTone,
        channels: formData.channels,
        model: selectedModel,
        viralStrategy,
        useWebSearch,
        sourceUrl: referenceUrl.trim() ? referenceUrl.trim() : undefined
      });

      if (res.telemetry) {
        setAiTelemetry(res.telemetry);
      } else {
        setAiTelemetry({
          status: res.live ? 200 : 500,
          statusText: res.live ? 'OK' : 'Fallback',
          latencyMs: 0,
          generationId: null,
          model: res.modelUsed || selectedModel,
          live: res.live,
          message: res.live ? 'Генерация успешно выполнена' : 'Использован шаблон'
        });
      }

      const result = res.result;
      if (result) {
        const detectedUrl = referenceUrl.trim() || res.webSources?.[0]?.url;
        setFormData(prev => ({
          ...prev,
          destinationUrl: prev.destinationUrl || detectedUrl || prev.destinationUrl,
          hook: result.hook || prev.hook,
          caption: result.caption || prev.caption,
          slides: result.slides || prev.slides,
          videoScript: result.videoScript || prev.videoScript,
          storiesChain: result.storiesChain || prev.storiesChain,
          threadPosts: result.threadPosts || prev.threadPosts,
          telegramPost: result.telegramPost || prev.telegramPost,
          status: prev.status === 'idea' ? 'script' : prev.status
        }));

        setCustomTexts({
          instagram: result.caption || '',
          stories: result.storiesChain?.[0]?.textOverlay || result.hook || '',
          twitter: result.threadPosts?.[0] || '',
          bluesky: result.threadPosts?.[0] || '',
          telegram: result.telegramPost || '',
          tiktok: result.videoScript?.[0]?.textOverlay || result.caption || '',
          pinterest: result.pinterestDescription || result.caption || '',
          linkedin: result.linkedinPost || result.caption || '',
          threads: result.threadPosts?.[0] || result.caption || ''
        });

        // Reset player index
        setActiveStoryIndex(0);
        setActiveTikTokSceneIndex(0);
        setActiveCarouselIndex(0);
        setPollVotedOption(null);
      }
    } catch (err: any) {
      console.error(err);
      setAiTelemetry({
        status: 500,
        statusText: 'Network Error',
        latencyMs: 0,
        generationId: null,
        model: selectedModel,
        live: false,
        error: err.message,
        message: 'Ошибка при обращении к серверу генерации'
      });
      alert('Ошибка при генерации сценария: ' + (err.message || 'Сбой сети'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestSandbox = async () => {
    setIsTestingSandbox(true);
    setShowSandboxDetails(true);
    try {
      const res = await testCascadeConnection();
      if (res.connected) {
        setAiTelemetry({
          status: res.status,
          statusText: res.statusText,
          latencyMs: res.latencyMs || (res.gemini?.latencyMs || 0) + (res.openRouter?.latencyMs || 0),
          generationId: res.openRouter?.generationId || null,
          model: res.provider === 'gemini' ? (res.gemini?.model || 'gemini-3.8-flash') : (res.openRouter?.actualModel || selectedModel),
          provider: res.provider as any,
          live: true,
          tokens: res.tokensUsed,
          cascadeTriggered: false,
          message: res.message
        });
      } else {
        setAiTelemetry({
          status: res.status,
          statusText: res.statusText,
          latencyMs: res.latencyMs,
          generationId: null,
          model: selectedModel,
          provider: 'fallback',
          live: false,
          error: res.error || res.message,
          message: res.message
        });
      }
    } catch (err: any) {
      setAiTelemetry({
        status: 500,
        statusText: 'Network Error',
        latencyMs: 0,
        generationId: null,
        model: selectedModel,
        provider: 'fallback',
        live: false,
        error: err.message,
        message: err.message
      });
    } finally {
      setIsTestingSandbox(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    try {
      const filesArray = Array.from(e.target.files);
      const urls = await uploadMedia(filesArray);
      setFormData(prev => ({
        ...prev,
        mediaUrls: [...prev.mediaUrls, ...urls],
        status: prev.status === 'script' ? 'media' : prev.status
      }));
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки файлов');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveMedia = (urlToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter(u => u !== urlToRemove)
    }));
  };

  const handlePublishNow = async () => {
    setIsPublishing(true);
    setPublishLogs([]);
    setPublishFeedback(null);
    try {
      const res = await publishPost({
        postId: formData.id,
        channels: formData.channels,
        customTexts: customTexts,
        isScheduled: false
      });

      if (res.success) {
        setPublishFeedback('Публикация успешно завершена во все сети!');
        setPublishLogs(res.logs || []);
        setFormData(prev => ({
          ...prev,
          status: 'published',
          publishedAt: res.publishedAt,
          publishResults: res.results
        }));
        onPostUpdated();
      }
    } catch (err: any) {
      console.error(err);
      setPublishFeedback(`Ошибка при публикации: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveAndClose = () => {
    let finalPost = { ...formData };
    if (stopwatchSeconds > 0) {
      const addedMinutes = Math.max(1, Math.round(stopwatchSeconds / 60));
      finalPost.timeSpentMinutes = (finalPost.timeSpentMinutes || 0) + addedMinutes;
    }
    onSave(finalPost);
    onClose();
  };

  // Limit indicators
  const limits: Record<string, number> = {
    twitter: 280,
    bluesky: 300,
    threads: 500,
    pinterest: 500,
    instagram: 2200,
    stories: 200,
    tiktok: 2200,
    linkedin: 3000,
    telegram: 4096
  };

  const currentPreviewText = customTexts[activePreviewPlatform] || '';
  const currentLimit = limits[activePreviewPlatform] || 2200;
  const isOverLimit = currentPreviewText.length > currentLimit;

  // Stories chain helper
  const storiesList = formData.storiesChain && formData.storiesChain.length > 0
    ? formData.storiesChain
    : [
        { screenNumber: 1, title: 'STORY 1 // ХУК-ОПРОС', textOverlay: formData.hook || 'Какой макет выберет клиент?', stickerType: 'poll', stickerContent: 'Старый / Редизайн', visualPrompt: 'Сравнение двух вариантов' },
        { screenNumber: 2, title: 'STORY 2 // ПРОБЛЕМА', textOverlay: 'В старом макете поплыла базовая линия 8px', stickerType: 'none', stickerContent: '', visualPrompt: 'Зум на ошибки верстки' },
        { screenNumber: 3, title: 'STORY 3 // РЕШЕНИЕ', textOverlay: 'Пересобрал по модульной сетке. Оцените результат:', stickerType: 'slider', stickerContent: '🔥 Оцените чистоту', visualPrompt: 'Анимация сетки' },
        { screenNumber: 4, title: 'STORY 4 // ПОРТФОЛИО', textOverlay: 'Ищу стажировку/работу! Ссылка на портфолио:', stickerType: 'link', stickerContent: 'Мое Behance-портфолио', visualPrompt: 'Стикер со стрелкой вверх' }
      ];

  const currentStory = storiesList[activeStoryIndex] || storiesList[0];

  // Video scenes helper
  const videoScenes = formData.videoScript && formData.videoScript.length > 0
    ? formData.videoScript
    : [
        { time: '00:00 - 00:03', visual: 'Показываю пальцем на старый кривой макет', audio: 'Я джуниор-дизайнер, и это не давало мне покоя', textOverlay: 'ПОЧЕМУ ЭТО ПЛОХО?' },
        { time: '00:03 - 00:10', visual: 'Ускоренная работа в Figma с сеткой 8px', audio: 'Смотрите, как модульная сетка преображает макет', textOverlay: 'МАГИЯ СЕТКИ 8PX' },
        { time: '00:10 - 00:18', visual: 'Финальный результат на мокапе', audio: 'Взяли бы меня к себе в студию?', textOverlay: 'ОЦЕНИТЕ РЕЗУЛЬТАТ' }
      ];

  const currentScene = videoScenes[activeTikTokSceneIndex] || videoScenes[0];

  // Carousel slides helper
  const carouselSlides = formData.slides && formData.slides.length > 0
    ? formData.slides
    : [
        { slideNumber: 1, title: 'COVER // BEFORE/AFTER', text: formData.title.toUpperCase(), visualPrompt: 'Контрастное разделение До и После' },
        { slideNumber: 2, title: 'ОШИБКА 1 // ХАОС', text: 'Хаотичные отступы 11px, 23px, 17px', visualPrompt: 'Красные маркеры замеров' },
        { slideNumber: 3, title: 'СЕТКА 8PX', text: 'Все расстояния кратны 8px (16, 24, 32, 64)', visualPrompt: 'Направляющие сетки' },
        { slideNumber: 4, title: 'РЕЗУЛЬТАТ В СРЕДЕ', text: 'Финальный плакат читается с 30 метров', visualPrompt: 'Мокап постера в среде' },
        { slideNumber: 5, title: 'CTA // ИЩУ РАБОТУ', text: 'Исходник Figma в Telegram. Ищу позицию джуниора!', visualPrompt: 'Контакты и ссылка' }
      ];

  const currentSlide = carouselSlides[activeCarouselIndex] || carouselSlides[0];

  const duplicatePost = existingPosts?.find(p => 
    p.id !== formData.id && 
    formData.title.trim() !== '' &&
    p.title.trim().toLowerCase() === formData.title.trim().toLowerCase()
  );

  return (
    <div className="swiss-modal-overlay" onClick={onClose}>
      <div className="swiss-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="swiss-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="swiss-brand-badge">STUDIO // JUNIOR VIRAL</span>
            <span className="swiss-modal-title">{formData.title || 'Новый проект в портфолио'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onDelete && formData.id && (
              <button 
                type="button" 
                className="swiss-btn swiss-btn-danger swiss-btn-sm" 
                onClick={() => setShowDeleteConfirm(true)}
                title="Удалить эту публикацию / идею"
              >
                <Trash2 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                УДАЛИТЬ
              </button>
            )}
            <button className="swiss-btn swiss-btn-sm swiss-btn-primary" onClick={handleSaveAndClose}>
              СОХРАНИТЬ
            </button>
            <button className="swiss-btn swiss-btn-sm" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)',
            padding: '24px'
          }}>
            <div style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#160a0a',
              border: '2px solid #ff3b30',
              padding: '24px',
              boxShadow: '0 16px 50px rgba(255, 59, 48, 0.3)',
              fontFamily: 'var(--font-mono)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff3b30', marginBottom: '14px' }}>
                <AlertTriangle size={22} />
                <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ
                </span>
              </div>
              <p style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.6', marginBottom: '10px' }}>
                Вы действительно хотите удалить публикацию «<strong>{formData.title || 'Без названия'}</strong>»?
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.5', marginBottom: '22px' }}>
                Идея и все связанные сценарии будут безвозвратно удалены из контент-плана и базы данных.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  className="swiss-btn swiss-btn-sm" 
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  ОТМЕНА
                </button>
                <button 
                  type="button" 
                  className="swiss-btn swiss-btn-danger swiss-btn-sm" 
                  style={{ backgroundColor: '#ff3b30', color: '#000', fontWeight: 800, borderColor: '#ff3b30' }}
                  onClick={() => {
                    if (formData.id && onDelete) {
                      onDelete(formData.id);
                    }
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                >
                  ДА, УДАЛИТЬ ИДЕЮ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tabs */}
        <div className="swiss-modal-tabs">
          <button 
            className={`swiss-modal-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            01 // ПАРАМЕТРЫ И СЕТИ ({formData.channels.length})
          </button>
          <button 
            className={`swiss-modal-tab ${activeTab === 'ai-script' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-script')}
          >
            <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
            02 // AI СЦЕНАРИЙ ДЛЯ ДЖУНИОРА
          </button>
          <button 
            className={`swiss-modal-tab ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <ImageIcon size={13} style={{ display: 'inline', marginRight: '4px' }} />
            03 // МЕДИА И ИСХОДНИКИ ({formData.mediaUrls.length})
          </button>
          <button 
            className={`swiss-modal-tab ${activeTab === 'preview-publish' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview-publish')}
          >
            <Send size={13} style={{ display: 'inline', marginRight: '4px' }} />
            04 // ИНТЕРАКТИВНЫЙ LIVE ПЛЕЕР И ПУБЛИКАЦИЯ
          </button>
        </div>

        {/* Modal Body */}
        <div className="swiss-modal-body">
          {/* Deduplication Warning Alert */}
          {duplicatePost && (
            <div style={{
              margin: '0 0 20px 0',
              padding: '14px 18px',
              backgroundColor: '#1f1504',
              border: '1px solid #ffaa00',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              fontFamily: 'var(--font-mono)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={20} color="#ffaa00" />
                <div>
                  <div style={{ color: '#ffaa00', fontWeight: 800, fontSize: '11px', letterSpacing: '0.08em' }}>
                    [СИСТЕМА ДЕДУБЛИКАЦИИ] КАРТОЧКА С ТАКОЙ ТЕМОЙ УЖЕ СУЩЕСТВУЕТ В ПЛАНЕ
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    Найдена существующая публикация «{duplicatePost.title}» (ID: {duplicatePost.id} // Статус: {duplicatePost.status.toUpperCase()}).
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {onSelectExistingPost && (
                  <button 
                    type="button" 
                    className="swiss-btn swiss-btn-sm" 
                    style={{ borderColor: '#ffaa00', color: '#ffaa00', fontWeight: 700 }}
                    onClick={() => onSelectExistingPost(duplicatePost)}
                  >
                    ОТКРЫТЬ СУЩЕСТВУЮЩУЮ
                  </button>
                )}
                <button 
                  type="button" 
                  className="swiss-btn swiss-btn-primary swiss-btn-sm"
                  style={{ fontWeight: 700 }}
                  onClick={() => {
                    onSave(formData, true);
                    onClose();
                  }}
                >
                  СОХРАНИТЬ КАК КОПИЮ
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div>
              <div className="swiss-form-group">
                <label className="swiss-label">Название проекта / Тема кейса для портфолио</label>
                <input 
                  type="text" 
                  className="swiss-input"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Например: Редизайн вывески кофейни по швейцарской сетке 8px"
                />
              </div>

              <div className="swiss-form-group">
                <label className="swiss-label">Виральная стратегия начинающего специалиста</label>
                <select 
                  className="swiss-select"
                  value={viralStrategy}
                  onChange={e => setViralStrategy(e.target.value)}
                >
                  {viralStrategiesList.map(strat => (
                    <option key={strat} value={strat}>{strat}</option>
                  ))}
                </select>
              </div>

              <div className="swiss-form-group">
                <label className="swiss-label">Целевые соцсети для кросс-постинга</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {allPlatforms.map(ch => {
                    const isActive = formData.channels.includes(ch.id);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        className={`swiss-filter-pill ${isActive ? 'active' : ''}`}
                        onClick={() => toggleChannel(ch.id)}
                      >
                        {isActive ? '✓ ' : '+ '}
                        {ch.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="swiss-form-group">
                  <label className="swiss-label">Формат контента</label>
                  <select 
                    className="swiss-select"
                    value={formData.format}
                    onChange={e => setFormData({ ...formData, format: e.target.value as ContentFormat })}
                  >
                    <option value="carousel">Карусель (Slide-by-slide 1:1 / 4:5 До/После)</option>
                    <option value="stories">Instagram Stories (Цепочка 3-5 экранов 9:16 со стикерами)</option>
                    <option value="reels">TikTok / Reels (9:16 видео + войсовер)</option>
                    <option value="thread">Тред (X / Bluesky / Threads #BuildInPublic)</option>
                    <option value="telegram">Telegram лонгрид с разбором Figma-исходника</option>
                  </select>
                </div>

                <div className="swiss-form-group">
                  <label className="swiss-label">Дата и время запланированной публикации</label>
                  <input 
                    type="datetime-local" 
                    className="swiss-input"
                    value={formData.scheduledDate ? formData.scheduledDate.slice(0, 16) : ''}
                    onChange={e => setFormData({ ...formData, scheduledDate: new Date(e.target.value).toISOString() })}
                  />
                </div>
              </div>

              <div className="swiss-form-group">
                <label className="swiss-label">Главный хук (Крючок внимания / Текст первой секунды)</label>
                <input 
                  type="text" 
                  className="swiss-input"
                  placeholder="Я джуниор-дизайнер, и этот макет не давал мне спать..."
                  value={formData.hook || ''}
                  onChange={e => setFormData({ ...formData, hook: e.target.value })}
                />
              </div>

              {/* SWISS TIME TRACKING WIDGET */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                fontFamily: 'var(--font-mono)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="#33cc66" />
                    <span style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                      УЧЕТ ЗАТРАЧЕННОГО ВРЕМЕНИ // TIME TRACKER
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ИТОГО ПОТРАЧЕНО:</span>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 800, 
                      color: '#ffffff', 
                      backgroundColor: '#18241b',
                      border: '1px solid #33cc66',
                      padding: '3px 10px',
                      borderRadius: '2px',
                      letterSpacing: '0.04em'
                    }}>
                      {Math.floor((formData.timeSpentMinutes || 0) / 60)}ч {(formData.timeSpentMinutes || 0) % 60}м
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'center' }}>
                  {/* Live Stopwatch Module */}
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: 'var(--bg-primary)', 
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>ЖИВОЙ СЕКУНДОМЕР:</span>
                      <span style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: '16px', 
                        fontWeight: 800,
                        color: isStopwatchRunning ? '#33cc66' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {isStopwatchRunning && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#33cc66',
                            borderRadius: '50%',
                            display: 'inline-block',
                            boxShadow: '0 0 8px #33cc66'
                          }} />
                        )}
                        {formatStopwatchTime(stopwatchSeconds)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {!isStopwatchRunning ? (
                        <button
                          type="button"
                          className="swiss-btn swiss-btn-sm"
                          style={{ borderColor: '#33cc66', color: '#33cc66', flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          onClick={() => setIsStopwatchRunning(true)}
                        >
                          <Play size={12} />
                          СТАРТ
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="swiss-btn swiss-btn-sm"
                          style={{ borderColor: '#ffbb33', color: '#ffbb33', flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          onClick={() => setIsStopwatchRunning(false)}
                        >
                          <Pause size={12} />
                          ПАУЗА
                        </button>
                      )}

                      {stopwatchSeconds > 0 && (
                        <>
                          <button
                            type="button"
                            className="swiss-btn swiss-btn-primary swiss-btn-sm"
                            style={{ flex: '1.2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '10px' }}
                            onClick={commitStopwatchTime}
                            title="Зафиксировать набежавшее время в карточку"
                          >
                            <Check size={12} />
                            ЗАФИКСИРОВАТЬ
                          </button>
                          <button
                            type="button"
                            className="swiss-btn swiss-btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => {
                              setIsStopwatchRunning(false);
                              setStopwatchSeconds(0);
                            }}
                            title="Сбросить секундомер"
                          >
                            <RotateCcw size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Manual & Quick Add Module */}
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: 'var(--bg-primary)', 
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>РУЧНОЙ ВВОД (МИН):</span>
                      <input 
                        type="number" 
                        min="0"
                        step="5"
                        className="swiss-input" 
                        style={{ width: '90px', padding: '4px 8px', textAlign: 'right', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                        value={formData.timeSpentMinutes ?? ''}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          setFormData({ ...formData, timeSpentMinutes: isNaN(val) ? 0 : val });
                        }}
                        placeholder="0"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="swiss-btn swiss-btn-sm"
                        style={{ fontSize: '10px', padding: '4px 8px', flex: '1' }}
                        onClick={() => addQuickMinutes(15)}
                      >
                        +15М
                      </button>
                      <button
                        type="button"
                        className="swiss-btn swiss-btn-sm"
                        style={{ fontSize: '10px', padding: '4px 8px', flex: '1' }}
                        onClick={() => addQuickMinutes(30)}
                      >
                        +30М
                      </button>
                      <button
                        type="button"
                        className="swiss-btn swiss-btn-sm"
                        style={{ fontSize: '10px', padding: '4px 8px', flex: '1' }}
                        onClick={() => addQuickMinutes(60)}
                      >
                        +1 ЧАС
                      </button>
                      {(formData.timeSpentMinutes || 0) > 0 && (
                        <button
                          type="button"
                          className="swiss-btn swiss-btn-sm"
                          style={{ fontSize: '10px', padding: '4px 6px', color: 'var(--text-muted)' }}
                          onClick={() => setFormData({ ...formData, timeSpentMinutes: 0 })}
                          title="Обнулить затраченное время"
                        >
                          СБРОС
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI SCRIPT ENGINE */}
          {activeTab === 'ai-script' && (
            <div>
              {/* AI Controls Header */}
              <div style={{ 
                backgroundColor: 'var(--bg-surface)', 
                border: '1px solid var(--border-light)', 
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={16} color="var(--text-primary)" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '12px' }}>
                      JUNIOR VIRAL SCRIPT ENGINE (FREE & OPENROUTER)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={useWebSearch} 
                        onChange={e => setUseWebSearch(e.target.checked)}
                        style={{ accentColor: 'var(--text-primary)' }}
                      />
                      <Globe size={12} />
                      ОНЛАЙН-ПОИСК ПРАКТИК (:online)
                    </label>

                    <select 
                      className="swiss-select" 
                      style={{ width: 'auto', padding: '4px 10px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                      value={selectedModel}
                      onChange={e => setSelectedModel(e.target.value)}
                    >
                      {settings.availableModels?.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      )) || (
                        <option value="openrouter/free">⚡️ OpenRouter Free Router (Авто-подбор)</option>
                      )}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
                  <div>
                    <label className="swiss-label">Позиционирование</label>
                    <input 
                      type="text" 
                      className="swiss-input"
                      value={aiTone}
                      onChange={e => setAiTone(e.target.value)}
                      placeholder="Голодный джуниор, открытый к критике..."
                    />
                  </div>

                  <div>
                    <label className="swiss-label">Целевая аудитория</label>
                    <input 
                      type="text" 
                      className="swiss-input"
                      value={aiAudience}
                      onChange={e => setAiAudience(e.target.value)}
                      placeholder="Арт-директора студий, лид-дизайнеры..."
                    />
                  </div>

                  <button 
                    className="swiss-btn swiss-btn-primary" 
                    onClick={handleGenerateScript}
                    disabled={isGenerating}
                    style={{ height: '36px', minWidth: '220px' }}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={14} className="spin" />
                        AI ПОИСК И ГЕНЕРАЦИЯ...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        СГЕНЕРИРОВАТЬ ВИРАЛЬНО
                      </>
                    )}
                  </button>
                </div>

                {/* Reference URL Scraper Input */}
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="swiss-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={12} color="#33cc66" />
                    Ссылка на референс / веб-источник (URL для парсинга и сценария — опционально)
                  </label>
                  <input
                    type="url"
                    className="swiss-input"
                    value={referenceUrl}
                    onChange={e => setReferenceUrl(e.target.value)}
                    placeholder="https://behance.net/gallery/... или ссылка на кейс/статью (ИИ спарсит контент и напишет разбор)"
                    style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                {/* SANDBOX & API TELEMETRY INSPECTOR */}
                <div style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  backgroundColor: aiTelemetry?.live ? '#0d1f12' : (aiTelemetry?.error ? '#260e0e' : '#141414'),
                  border: `1px solid ${aiTelemetry?.live ? '#33cc66' : (aiTelemetry?.error ? '#ff4444' : '#333333')}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Activity size={16} color={aiTelemetry?.live ? '#33cc66' : (aiTelemetry?.error ? '#ff4444' : '#888')} />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {aiTelemetry?.live ? (
                          aiTelemetry.provider === 'gemini' ? (
                            <span style={{ color: '#33cc66' }}>● GOOGLE GEMINI: LIVE (HTTP {aiTelemetry.status || 200} OK)</span>
                          ) : (
                            <span style={{ color: '#ffaa00' }}>
                              ● OPENROUTER: LIVE (HTTP {aiTelemetry.status || 200} OK)
                              {aiTelemetry.cascadeTriggered && <span style={{ color: '#33cc66', marginLeft: '6px' }}>[⚡️ КАСКАД СРАБОТАЛ]</span>}
                            </span>
                          )
                        ) : aiTelemetry?.error ? (
                          <span style={{ color: '#ff4444' }}>● САНДБОКС: ОШИБКА КАСКАДА (HTTP {aiTelemetry.status || 'ERROR'})</span>
                        ) : (
                          <span style={{ color: '#aaa' }}>○ КАСКАДНЫЙ ИНСПЕКТОР // GEMINI & OPENROUTER</span>
                        )}
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>[{selectedModel}]</span>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        {aiTelemetry ? (
                          aiTelemetry.message || (aiTelemetry.live ? '✓ Запрос успешно выполнен' : 'Использован локальный шаблон')
                        ) : (
                          'Система использует каскад: Gemini (Основной) ➔ OpenRouter (Резерв при 429/ошибке). Нажмите «Тест AI каскада» для проверки связи прямо сейчас.'
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {aiTelemetry && (
                      <button
                        type="button"
                        className="swiss-btn swiss-btn-sm"
                        style={{ fontSize: '10px', padding: '4px 8px' }}
                        onClick={() => setShowSandboxDetails(!showSandboxDetails)}
                      >
                        {showSandboxDetails ? 'СКРЫТЬ ТЕЛЕМЕТРИЮ ▲' : 'ДЕТАЛИ ТЕЛЕМЕТРИИ ▼'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="swiss-btn swiss-btn-sm"
                      style={{ fontSize: '11px', padding: '5px 12px', borderColor: '#33cc66', color: '#33cc66' }}
                      onClick={handleTestSandbox}
                      disabled={isTestingSandbox}
                    >
                      {isTestingSandbox ? (
                        <>
                          <Loader2 size={12} className="spin" />
                          ПРОВЕРКА КАСКАДА...
                        </>
                      ) : (
                        <>
                          <Terminal size={12} />
                          ⚡️ ТЕСТ AI КАСКАДА (САНДБОКС-ПИНГ)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Telemetry Details */}
                {showSandboxDetails && aiTelemetry && (
                  <div style={{
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid var(--border-light)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6'
                  }}>
                    <div><strong>Активный провайдер:</strong> {aiTelemetry.provider || 'auto'}</div>
                    <div><strong>HTTP Status:</strong> {aiTelemetry.status} {aiTelemetry.statusText}</div>
                    <div><strong>Задержка (Latency):</strong> {aiTelemetry.latencyMs} ms</div>
                    <div><strong>Generation ID (OpenRouter):</strong> {aiTelemetry.generationId || 'отсутствует'}</div>
                    <div><strong>Модель:</strong> {aiTelemetry.model}</div>
                    <div><strong>Токены:</strong> {aiTelemetry.tokens || '—'}</div>
                    {aiTelemetry.cascadeDetails && (
                      <div style={{ color: '#ffaa00', marginTop: '4px' }}>
                        <strong>Лог каскадного переключения:</strong> {aiTelemetry.cascadeDetails}
                      </div>
                    )}
                    {aiTelemetry.error && <div style={{ color: '#ff5555', marginTop: '4px' }}><strong>Диагностика ошибки:</strong> {aiTelemetry.error}</div>}
                  </div>
                )}
              </div>

              {/* Display Generated Script Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Stories Chain */}
                {(formData.format === 'stories' || (formData.storiesChain && formData.storiesChain.length > 0)) && (
                  <div style={{ border: '1px solid #663344', padding: '16px', backgroundColor: '#120d11' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#ff77aa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        INSTAGRAM STORIES // КВЕСТ-ВОРОНКА ДЛЯ ДЖУНИОРА ({storiesList.length} ЭКРАНА)
                      </h4>
                      <span style={{ fontSize: '10px', color: '#ff77aa', fontFamily: 'var(--font-mono)' }}>9:16 VERTICAL</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                      {storiesList.map((screen, idx) => (
                        <div key={idx} style={{ 
                          backgroundColor: 'var(--bg-primary)', 
                          border: '1px solid var(--border-medium)', 
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-secondary)' }}>
                            <span>{screen.title}</span>
                            <span>#{screen.screenNumber}</span>
                          </div>

                          <div style={{ fontWeight: 700, fontSize: '13px' }}>
                            "{screen.textOverlay}"
                          </div>

                          {screen.stickerType && screen.stickerType !== 'none' && (
                            <div style={{ 
                              fontSize: '11px', 
                              backgroundColor: '#261122', 
                              color: '#ff99cc',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span>СТИКЕР [{screen.stickerType.toUpperCase()}]:</span>
                              <strong>{screen.stickerContent}</strong>
                            </div>
                          )}

                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            <strong>ВИЗУАЛ:</strong> {screen.visualPrompt}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Slide-by-slide Carousel Script */}
                {formData.slides && formData.slides.length > 0 && (
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.08em', marginBottom: '10px', textTransform: 'uppercase' }}>
                      КАРУСЕЛЬ // СЛАЙДЫ КЕЙСА ДЛЯ ПОРТФОЛИО ({formData.slides.length} СЛАЙДОВ)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                      {formData.slides.map((slide, idx) => (
                        <div key={idx} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', padding: '12px' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span>{slide.title}</span>
                            <span>SLIDE #{slide.slideNumber}</span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
                            {slide.text}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface-elevated)', padding: '6px', borderLeft: '2px solid var(--border-medium)' }}>
                            <strong>ВИЗУАЛ:</strong> {slide.visualPrompt}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Video Reels / TikTok Beat-by-beat Script */}
                {formData.videoScript && formData.videoScript.length > 0 && (
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.08em', marginBottom: '10px', textTransform: 'uppercase' }}>
                      TIKTOK / REELS // ПОСЦЕННЫЙ СЦЕНАРИЙ ВИДЕО
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {formData.videoScript.map((scene, idx) => (
                        <div key={idx} style={{ 
                          backgroundColor: 'var(--bg-surface)', 
                          border: '1px solid var(--border-light)', 
                          padding: '10px 14px',
                          display: 'grid',
                          gridTemplateColumns: '120px 1fr 1fr 140px',
                          gap: '12px',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {scene.time}
                          </span>
                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ДЕЙСТВИЕ:</div>
                            <div style={{ fontSize: '12px' }}>{scene.visual}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ВОЙСОВЕР:</div>
                            <div style={{ fontSize: '12px', fontStyle: 'italic' }}>"{scene.audio}"</div>
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', backgroundColor: 'var(--bg-surface-elevated)', padding: '4px', textAlign: 'center' }}>
                            {scene.textOverlay}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Base Caption */}
                <div className="swiss-form-group">
                  <label className="swiss-label">Текст поста для Instagram / Общий лонгрид</label>
                  <textarea 
                    className="swiss-textarea"
                    style={{ minHeight: '120px' }}
                    value={formData.caption || ''}
                    onChange={e => setFormData({ ...formData, caption: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA & ASSETS */}
          {activeTab === 'media' && (
            <div>
              <div style={{ 
                border: '2px dashed var(--border-medium)', 
                padding: '36px', 
                textAlign: 'center',
                backgroundColor: 'var(--bg-surface)',
                marginBottom: '24px'
              }}>
                <Upload size={32} color="var(--text-secondary)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '6px' }}>
                  ЗАГРУЗИТЕ МАКЕТЫ ДО/ПОСЛЕ, СТОРИС ИЛИ ВИДЕО
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Точные соотношения сторон: 9:16 (Stories/TikTok/Reels), 2:3 (Pinterest Pin), 1:1 и 4:5 (Instagram).
                </p>

                <label className="swiss-btn swiss-btn-primary" style={{ cursor: 'pointer' }}>
                  {isUploading ? (
                    <>
                      <Loader2 size={14} className="spin" />
                      ЗАГРУЗКА...
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      ВЫБРАТЬ ФАЙЛЫ
                    </>
                  )}
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*,video/*" 
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div>
                <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.08em', marginBottom: '12px', textTransform: 'uppercase' }}>
                  АКТИВНЫЕ МЕДИАФАЙЛЫ ({formData.mediaUrls.length})
                </h4>

                {formData.mediaUrls.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
                    Файлы пока не загружены. Мокапы визуализируются с дефолтным Swiss Grid постером.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                    {formData.mediaUrls.map((url, idx) => (
                      <div key={idx} style={{ border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-surface)', position: 'relative' }}>
                        <div style={{ aspectRatio: '1/1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={url} alt={`Media ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>#{idx + 1}</span>
                          <button 
                            className="swiss-btn swiss-btn-sm swiss-btn-icon swiss-btn-danger"
                            onClick={() => handleRemoveMedia(url)}
                            title="Удалить"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: INTERACTIVE PREVIEW & PUBLISH */}
          {activeTab === 'preview-publish' && (
            <div>
              {/* Platform Selector Tabs */}
              <div className="preview-selector-tabs">
                {[
                  { id: 'stories', label: '⚡️ IG STORIES (9:16 ПЛЕЕР)' },
                  { id: 'tiktok', label: '🎵 TIKTOK (9:16 СЦЕНЫ)' },
                  { id: 'instagram', label: '📷 IG КАРУСЕЛЬ (1:1 / 4:5)' },
                  { id: 'pinterest', label: '📌 PINTEREST (2:3 ПИН)' },
                  { id: 'linkedin', label: '💼 LINKEDIN (B2B КЕЙС)' },
                  { id: 'threads', label: '🧵 THREADS' },
                  { id: 'twitter', label: '𝕏 TWITTER' },
                  { id: 'bluesky', label: '🦋 BLUESKY' },
                  { id: 'telegram', label: '✈️ TELEGRAM' }
                ].map(platform => {
                  const isTarget = platform.id === 'stories' 
                    ? formData.format === 'stories' || formData.channels.includes('instagram')
                    : formData.channels.includes(platform.id as Platform);

                  return (
                    <button
                      key={platform.id}
                      className={`preview-tab-btn ${activePreviewPlatform === platform.id ? 'active' : ''}`}
                      onClick={() => setActivePreviewPlatform(platform.id as any)}
                    >
                      <span>{platform.label}</span>
                      {isTarget && (
                        <span style={{ fontSize: '9px', backgroundColor: 'var(--text-primary)', color: 'var(--text-inverse)', padding: '1px 4px' }}>
                          TARGET
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Two Column Layout: Controls & Mockup */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: '20px' }}>
                {/* Column 1: Specific Text & Parameters */}
                <div>
                  <div className="swiss-form-group">
                    <label className="swiss-label">
                      Текст для {activePreviewPlatform.toUpperCase()}
                    </label>
                    <textarea 
                      className="swiss-textarea"
                      style={{ minHeight: '140px', fontFamily: 'var(--font-sans)', fontSize: '13px' }}
                      value={customTexts[activePreviewPlatform] || ''}
                      onChange={e => setCustomTexts({ ...customTexts, [activePreviewPlatform]: e.target.value })}
                      placeholder={`Адаптированный текст для ${activePreviewPlatform}...`}
                    />
                    <div className={`char-counter ${isOverLimit ? 'invalid' : 'valid'}`}>
                      Символов: {currentPreviewText.length} / {currentLimit}
                      {isOverLimit && ' — ПРЕВЫШЕН ЛИМИТ ПЛАТФОРМЫ!'}
                    </div>
                  </div>

                  {/* Target Channels List */}
                  <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', padding: '12px', marginBottom: '14px' }}>
                    <label className="swiss-label" style={{ marginBottom: '8px' }}>
                      КАНАЛЫ ДЛЯ ОДНОВРЕМЕННОЙ ОТПРАВКИ ({formData.channels.length}):
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {formData.channels.map(ch => (
                        <div key={ch} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                          <span style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                            • {ch}
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {settings.simulationMode ? 'SANDBOX' : 'LIVE'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Publishing Button */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button 
                      className="swiss-btn swiss-btn-primary" 
                      style={{ width: '100%', height: '42px', fontSize: '13px' }}
                      onClick={handlePublishNow}
                      disabled={isPublishing || isOverLimit || formData.channels.length === 0}
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 size={16} className="spin" />
                          ОТПРАВКА ВО ВСЕ СЕТИ...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          ОПУБЛИКОВАТЬ СЕЙЧАС ({formData.channels.length} СЕТЕЙ)
                        </>
                      )}
                    </button>

                    {publishFeedback && (
                      <div style={{ padding: '8px 12px', backgroundColor: '#112211', border: '1px solid #225522', color: '#66ff66', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={14} />
                        {publishFeedback}
                      </div>
                    )}

                    {publishLogs.length > 0 && (
                      <div style={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)', padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '10px', maxHeight: '120px', overflowY: 'auto' }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>LOGS // DISPATCH:</div>
                        {publishLogs.map((log, i) => (
                          <div key={i} style={{ marginBottom: '3px', color: log.status === 'error' ? '#ff6666' : '#cccccc' }}>
                            [{log.channel.toUpperCase()}] {log.detail}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Interactive Aspect-Ratio Mockup Player */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* 1. INSTAGRAM STORIES PLAYER (9:16) */}
                  {activePreviewPlatform === 'stories' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                      <div className="mockup-player-controls">
                        <span>ЭКРАН {activeStoryIndex + 1} ИЗ {storiesList.length}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            className="swiss-btn swiss-btn-sm swiss-btn-icon" 
                            disabled={activeStoryIndex === 0}
                            onClick={() => {
                              setActiveStoryIndex(Math.max(0, activeStoryIndex - 1));
                              setPollVotedOption(null);
                            }}
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button 
                            className="swiss-btn swiss-btn-sm swiss-btn-icon"
                            disabled={activeStoryIndex >= storiesList.length - 1}
                            onClick={() => {
                              setActiveStoryIndex(Math.min(storiesList.length - 1, activeStoryIndex + 1));
                              setPollVotedOption(null);
                            }}
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="mockup-stories">
                        {/* Tap navigation zones */}
                        <div 
                          className="stories-tap-area-left" 
                          onClick={() => {
                            setActiveStoryIndex(prev => Math.max(0, prev - 1));
                            setPollVotedOption(null);
                          }}
                          title="Тап влево: Предыдущий экран"
                        />
                        <div 
                          className="stories-tap-area-right" 
                          onClick={() => {
                            setActiveStoryIndex(prev => Math.min(storiesList.length - 1, prev + 1));
                            setPollVotedOption(null);
                          }}
                          title="Тап вправо: Следующий экран"
                        />

                        {/* Top progress bar */}
                        <div className="stories-progress-bar">
                          {storiesList.map((_, idx) => (
                            <div 
                              key={idx} 
                              className={`stories-progress-segment ${idx === activeStoryIndex ? 'active' : (idx < activeStoryIndex ? 'viewed' : '')}`}
                              onClick={() => {
                                setActiveStoryIndex(idx);
                                setPollVotedOption(null);
                              }}
                            />
                          ))}
                        </div>

                        {/* Stories Header */}
                        <div className="stories-header">
                          <div className="stories-user">
                            <div className="stories-avatar">
                              <div className="stories-avatar-inner">JD</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 800 }}>junior.designer</div>
                              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>{currentStory.title}</div>
                            </div>
                          </div>
                          <span>✕</span>
                        </div>

                        {/* Story Content Layer */}
                        <div className="stories-content-layer">
                          <div className="stories-text-card">
                            {currentStory.textOverlay}
                          </div>

                          {/* Dynamic Interactive Sticker */}
                          {currentStory.stickerType === 'poll' && (
                            <div className="stories-poll-box">
                              <div className="stories-poll-title">
                                {currentStory.stickerContent || 'Какой вариант сильнее?'}
                              </div>
                              <div className="stories-poll-options">
                                <div 
                                  className="stories-poll-btn"
                                  onClick={() => setPollVotedOption(1)}
                                  style={pollVotedOption === 1 ? { background: '#000', color: '#fff' } : {}}
                                >
                                  {pollVotedOption !== null ? '68% ВАРИАНТ А' : 'ВАРИАНТ А'}
                                </div>
                                <div 
                                  className="stories-poll-btn"
                                  onClick={() => setPollVotedOption(2)}
                                  style={pollVotedOption === 2 ? { background: '#000', color: '#fff' } : {}}
                                >
                                  {pollVotedOption !== null ? '32% ВАРИАНТ Б' : 'ВАРИАНТ Б'}
                                </div>
                              </div>
                            </div>
                          )}

                          {currentStory.stickerType === 'slider' && (
                            <div className="stories-slider-box">
                              <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>
                                {currentStory.stickerContent || 'Оцените чистоту'}
                              </span>
                              <span style={{ fontSize: '18px', animation: 'bounce 1s infinite' }}>🔥</span>
                            </div>
                          )}

                          {currentStory.stickerType === 'link' && (
                            <div className="stories-link-box">
                              <ExternalLink size={12} />
                              <span>{currentStory.stickerContent || 'Смотреть кейс'}</span>
                            </div>
                          )}

                          <div style={{ fontSize: '9px', color: '#888', marginTop: '14px', fontFamily: 'var(--font-mono)' }}>
                            [ВИЗУАЛ]: {currentStory.visualPrompt}
                          </div>
                        </div>

                        {/* Footer Reply Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', fontSize: '12px', position: 'relative', zIndex: 10 }}>
                          <span style={{ border: '1px solid rgba(255,255,255,0.4)', borderRadius: '20px', padding: '5px 12px', flex: 1, marginRight: '10px', fontSize: '11px', color: '#ccc' }}>
                            Отправить сообщение...
                          </span>
                          <span>♡</span>
                          <span style={{ marginLeft: '10px' }}>↗</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. TIKTOK SCENE PLAYER (9:16) */}
                  {activePreviewPlatform === 'tiktok' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                      <div className="mockup-player-controls">
                        <span>СЦЕНА: {currentScene.time}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {videoScenes.map((_, idx) => (
                            <button
                              key={idx}
                              className={`swiss-filter-pill ${idx === activeTikTokSceneIndex ? 'active' : ''}`}
                              style={{ padding: '2px 6px', fontSize: '10px' }}
                              onClick={() => setActiveTikTokSceneIndex(idx)}
                            >
                              #{idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mockup-tiktok">
                        <div className="tiktok-scene-badge">
                          SCENE {activeTikTokSceneIndex + 1} // {currentScene.time}
                        </div>

                        <div className="tiktok-overlay-right">
                          <div className="tiktok-action-btn">
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>JD</div>
                          </div>
                          <div className="tiktok-action-btn">
                            <span style={{ fontSize: '18px' }}>❤️</span>
                            <span>48.2K</span>
                          </div>
                          <div className="tiktok-action-btn">
                            <span style={{ fontSize: '18px' }}>💬</span>
                            <span>912</span>
                          </div>
                          <div className="tiktok-action-btn">
                            <span style={{ fontSize: '18px' }}>🔖</span>
                            <span>12K</span>
                          </div>
                          <div className="tiktok-disc" />
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px 10px 10px' }}>
                          <div className="tiktok-onscreen-text">
                            {currentScene.textOverlay}
                          </div>
                          <div style={{ fontSize: '10px', color: '#aaa', fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
                            [КАДР]: {currentScene.visual}
                          </div>
                        </div>

                        <div className="tiktok-bottom-info">
                          <div className="tiktok-voiceover-pill">
                            🎙 ВОЙСОВЕР: "{currentScene.audio}"
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '2px' }}>@junior_designer</div>
                          <div style={{ fontSize: '11px', color: '#ccc' }}>
                            #juniorgraphicdesigner #brandredesign #figma
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. INSTAGRAM CAROUSEL PLAYER (1:1 / 4:5) */}
                  {activePreviewPlatform === 'instagram' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                      <div className="mockup-player-controls">
                        <span>СЛАЙД {activeCarouselIndex + 1} ИЗ {carouselSlides.length}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            className="swiss-btn swiss-btn-sm swiss-btn-icon" 
                            disabled={activeCarouselIndex === 0}
                            onClick={() => setActiveCarouselIndex(Math.max(0, activeCarouselIndex - 1))}
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button 
                            className="swiss-btn swiss-btn-sm swiss-btn-icon"
                            disabled={activeCarouselIndex >= carouselSlides.length - 1}
                            onClick={() => setActiveCarouselIndex(Math.min(carouselSlides.length - 1, activeCarouselIndex + 1))}
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="mockup-instagram">
                        <div className="ig-header">
                          <div className="ig-user-info">
                            <div className="ig-avatar">JD</div>
                            <div>
                              <div className="ig-username">junior.graphic.designer</div>
                              <div style={{ fontSize: '10px', color: '#888' }}>Junior Portfolio Case</div>
                            </div>
                          </div>
                          <span>•••</span>
                        </div>

                        <div className="ig-media-box">
                          <div className="ig-carousel-badge">
                            {activeCarouselIndex + 1}/{carouselSlides.length}
                          </div>

                          <div style={{ padding: '24px', textAlign: 'center', width: '100%' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                              {currentSlide.title}
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '16px', lineHeight: 1.3, marginBottom: '12px' }}>
                              {currentSlide.text}
                            </div>
                            <div style={{ fontSize: '11px', color: '#aaa', backgroundColor: 'rgba(255,255,255,0.08)', padding: '8px', borderLeft: '2px solid #fff' }}>
                              [ДИРЕКТИВА]: {currentSlide.visualPrompt}
                            </div>
                          </div>
                        </div>

                        <div className="ig-actions">
                          <div className="ig-action-icons">
                            <span>♡</span>
                            <span>💬</span>
                            <span>↗</span>
                          </div>
                          <span>⚑</span>
                        </div>

                        <div className="ig-likes">842 likes</div>

                        <div className="ig-caption">
                          <span style={{ fontWeight: 600, marginRight: '6px' }}>junior.graphic.designer</span>
                          {currentPreviewText || formData.caption}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. PINTEREST (2:3) */}
                  {activePreviewPlatform === 'pinterest' && (
                    <div className="mockup-pinterest">
                      <div className="pin-media-box">
                        <img src={formData.mediaUrls[0] || '/demo-assets/swiss-grid-preview.svg'} alt="Pin media" />
                        <button className="pin-save-btn">Сохранить</button>
                      </div>
                      <div className="pin-info-box">
                        <div className="pin-title">{formData.title}</div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', lineHeight: 1.3 }}>
                          {currentPreviewText.slice(0, 140) || formData.caption?.slice(0, 140)}...
                        </div>
                        <div className="pin-author">
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>JD</div>
                          <span>Junior Designer Portfolio</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. LINKEDIN */}
                  {activePreviewPlatform === 'linkedin' && (
                    <div className="mockup-linkedin">
                      <div className="li-header">
                        <div className="li-avatar">JD</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px' }}>Junior Graphic Designer</div>
                          <div style={{ fontSize: '11px', color: '#999' }}>Aspiring Designer & Open to Work</div>
                          <div style={{ fontSize: '10px', color: '#777' }}>1h • 🌐</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '10px' }}>
                        {currentPreviewText || formData.caption}
                      </div>
                      <div className="li-doc-bar">
                        <span>📄 JUNIOR_CASE_REDESIGN_PORTFOLIO.PDF</span>
                        <span>5 СТРАНИЦ</span>
                      </div>
                    </div>
                  )}

                  {/* 6. THREADS */}
                  {activePreviewPlatform === 'threads' && (
                    <div className="mockup-threads">
                      <div className="threads-header">
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>JD</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px' }}>junior_designer</span>
                            <span style={{ color: '#777', fontSize: '12px' }}>3m</span>
                          </div>
                          <div style={{ fontSize: '14px', lineHeight: 1.4, marginTop: '4px', marginBottom: '10px' }}>
                            {currentPreviewText || formData.threadPosts?.[0] || formData.caption}
                          </div>
                          <div style={{ display: 'flex', gap: '16px', color: '#aaa', fontSize: '14px' }}>
                            <span>♡ 240</span>
                            <span>💬 38</span>
                            <span>🔁 52</span>
                            <span>↗</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 7. X (TWITTER) */}
                  {activePreviewPlatform === 'twitter' && (
                    <div className="mockup-twitter">
                      <div className="tw-header">
                        <div className="tw-avatar">JD</div>
                        <div>
                          <div className="tw-name-row">
                            <span className="tw-display-name">Junior Designer</span>
                            <span className="tw-handle">@junior_des • 1m</span>
                          </div>
                          <div className="tw-body-text">
                            {currentPreviewText || formData.threadPosts?.[0] || formData.caption}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 8. BLUESKY */}
                  {activePreviewPlatform === 'bluesky' && (
                    <div className="mockup-bluesky">
                      <div className="bsky-header">
                        <div className="bsky-avatar">🦋</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '14px' }}>Junior Designer</div>
                          <div style={{ color: '#8996a2', fontSize: '12px' }}>@juniordesigner.bsky.social</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', lineHeight: 1.45, marginBottom: '12px' }}>
                        {currentPreviewText || formData.threadPosts?.[0] || formData.caption}
                      </div>
                    </div>
                  )}

                  {/* 9. TELEGRAM */}
                  {activePreviewPlatform === 'telegram' && (
                    <div className="mockup-telegram">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#2aabee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                          TG
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 700 }}>ДНЕВНИК ДЖУНИОР-ДИЗАЙНЕРА // FIGMA ИСХОДНИКИ</div>
                      </div>
                      <div className="tg-bubble">
                        <div className="tg-text-content">
                          {currentPreviewText || formData.telegramPost || formData.caption}
                        </div>
                        <div className="tg-meta-row">
                          <span>👁 1.2K</span>
                          <span>14:02</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="swiss-modal-footer">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
              СТАТУС:
            </span>
            <select 
              className="swiss-select"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="idea">01 // IDEA</option>
              <option value="script">02 // SCRIPT</option>
              <option value="media">03 // MEDIA</option>
              <option value="scheduled">04 // SCHEDULED</option>
              <option value="published">05 // PUBLISHED</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="swiss-btn" onClick={onClose}>
              ОТМЕНА
            </button>
            <button className="swiss-btn swiss-btn-primary" onClick={handleSaveAndClose}>
              СОХРАНИТЬ ИЗМЕНЕНИЯ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
