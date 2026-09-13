import React, { useState, useMemo } from 'react';
import { Post, Platform, ContentFormat, Stage } from '../../types/index.ts';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Hourglass, 
  TrendingUp, 
  Trash2, 
  Edit3, 
  Search, 
  Layers, 
  Share2, 
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';

interface AnalyticsDashboardProps {
  posts: Post[];
  selectedChannel: Platform | 'all';
  onSelectPost: (post: Post) => void;
  onDeletePost: (id: string) => void;
  onUpdatePost: (post: Post) => void;
}

type TableFilter = 'all' | 'completed' | 'overdue' | 'in_progress';
type SortOption = 'time-desc' | 'time-asc' | 'date-asc' | 'date-desc';

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  posts,
  selectedChannel,
  onSelectPost,
  onDeletePost,
  onUpdatePost
}) => {
  const [tableFilter, setTableFilter] = useState<TableFilter>('all');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('time-desc');
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // Filter posts by selected channel from Header if any
  const channelPosts = useMemo(() => {
    if (selectedChannel === 'all') return posts;
    return posts.filter(p => p.channels.includes(selectedChannel));
  }, [posts, selectedChannel]);

  const now = Date.now();

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalPlans = channelPosts.length;
    
    // Completed: status is published
    const completedPosts = channelPosts.filter(p => p.status === 'published');
    
    // Overdue: not published and scheduled date is in the past
    const overduePosts = channelPosts.filter(p => {
      if (p.status === 'published') return false;
      if (!p.scheduledDate) return false;
      const scheduledMs = new Date(p.scheduledDate).getTime();
      return !isNaN(scheduledMs) && scheduledMs < now;
    });

    // In Progress: not published and scheduled date is future or unset
    const inProgressPosts = channelPosts.filter(p => {
      if (p.status === 'published') return false;
      if (!p.scheduledDate) return true;
      const scheduledMs = new Date(p.scheduledDate).getTime();
      return isNaN(scheduledMs) || scheduledMs >= now;
    });

    // Time calculations
    const totalMinutes = channelPosts.reduce((sum, p) => sum + (p.timeSpentMinutes || 0), 0);
    const completedMinutes = completedPosts.reduce((sum, p) => sum + (p.timeSpentMinutes || 0), 0);

    const completionRate = totalPlans > 0 ? Math.round((completedPosts.length / totalPlans) * 100) : 0;
    const overdueRate = totalPlans > 0 ? Math.round((overduePosts.length / totalPlans) * 100) : 0;
    const inProgressRate = totalPlans > 0 ? Math.round((inProgressPosts.length / totalPlans) * 100) : 0;

    const avgMinutesPerCompleted = completedPosts.length > 0 
      ? Math.round(completedMinutes / completedPosts.length) 
      : (totalPlans > 0 ? Math.round(totalMinutes / totalPlans) : 0);

    return {
      totalPlans,
      completedPosts,
      overduePosts,
      inProgressPosts,
      totalMinutes,
      completionRate,
      overdueRate,
      inProgressRate,
      avgMinutesPerCompleted
    };
  }, [channelPosts, now]);

  // Platform Distribution
  const platformStats = useMemo(() => {
    const platforms: Platform[] = [
      'instagram', 'telegram', 'tiktok', 'twitter', 'bluesky', 'threads', 'linkedin', 'pinterest'
    ];

    const platformLabels: Record<Platform, string> = {
      instagram: 'Instagram',
      telegram: 'Telegram',
      tiktok: 'TikTok',
      twitter: 'X (Twitter)',
      bluesky: 'Bluesky',
      threads: 'Threads',
      linkedin: 'LinkedIn',
      pinterest: 'Pinterest'
    };

    return platforms.map(plat => {
      const platPosts = channelPosts.filter(p => p.channels.includes(plat));
      const minutes = platPosts.reduce((acc, p) => acc + (p.timeSpentMinutes || 0), 0);
      const completed = platPosts.filter(p => p.status === 'published').length;
      return {
        id: plat,
        label: platformLabels[plat],
        count: platPosts.length,
        completed,
        minutes,
        percentage: metrics.totalMinutes > 0 ? Math.round((minutes / metrics.totalMinutes) * 100) : 0
      };
    }).filter(p => p.count > 0 || selectedChannel === p.id)
      .sort((a, b) => b.minutes - a.minutes);
  }, [channelPosts, metrics.totalMinutes, selectedChannel]);

  // Format Distribution
  const formatStats = useMemo(() => {
    const formats: { id: ContentFormat; label: string }[] = [
      { id: 'carousel', label: 'Карусели (Carousel)' },
      { id: 'stories', label: 'Instagram Stories' },
      { id: 'reels', label: 'TikTok & Reels' },
      { id: 'thread', label: 'Тред / Потоки' },
      { id: 'telegram', label: 'Telegram Лонгрид' }
    ];

    return formats.map(fmt => {
      const fmtPosts = channelPosts.filter(p => p.format === fmt.id);
      const minutes = fmtPosts.reduce((acc, p) => acc + (p.timeSpentMinutes || 0), 0);
      return {
        id: fmt.id,
        label: fmt.label,
        count: fmtPosts.length,
        minutes,
        percentage: metrics.totalMinutes > 0 ? Math.round((minutes / metrics.totalMinutes) * 100) : 0
      };
    }).filter(f => f.count > 0);
  }, [channelPosts, metrics.totalMinutes]);

  // Filter and sort the table
  const filteredTablePosts = useMemo(() => {
    let list = channelPosts.filter(p => {
      // Status filter
      if (tableFilter === 'completed' && p.status !== 'published') return false;
      if (tableFilter === 'overdue') {
        if (p.status === 'published') return false;
        const scheduledMs = new Date(p.scheduledDate).getTime();
        if (isNaN(scheduledMs) || scheduledMs >= now) return false;
      }
      if (tableFilter === 'in_progress') {
        if (p.status === 'published') return false;
        const scheduledMs = new Date(p.scheduledDate).getTime();
        if (!isNaN(scheduledMs) && scheduledMs < now) return false;
      }

      // Search filter
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchCategory = p.category.toLowerCase().includes(q);
        const matchHook = (p.hook || '').toLowerCase().includes(q);
        return matchTitle || matchCategory || matchHook;
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'time-desc') return (b.timeSpentMinutes || 0) - (a.timeSpentMinutes || 0);
      if (sortBy === 'time-asc') return (a.timeSpentMinutes || 0) - (b.timeSpentMinutes || 0);
      if (sortBy === 'date-asc') return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      if (sortBy === 'date-desc') return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
      return 0;
    });

    return list;
  }, [channelPosts, tableFilter, tableSearch, sortBy, now]);

  // Helper formatting
  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}м`;
    if (m === 0) return `${h}ч`;
    return `${h}ч ${m}м`;
  };

  const getPostDeadlineStatus = (post: Post) => {
    if (post.status === 'published') {
      return { label: 'ВЫПОЛНЕНО', color: '#33cc66', bg: '#0d2414', border: '#33cc66' };
    }
    const scheduledMs = new Date(post.scheduledDate).getTime();
    if (!isNaN(scheduledMs) && scheduledMs < now) {
      return { label: 'ПРОСРОЧЕНО', color: '#ff4444', bg: '#290f0f', border: '#ff4444' };
    }
    return { label: 'В РАБОТЕ', color: '#ffbb33', bg: '#29200f', border: '#ffbb33' };
  };

  const stageLabels: Record<Stage, string> = {
    idea: '01 ИДЕЯ',
    script: '02 СЦЕНАРИЙ',
    media: '03 МЕДИА',
    scheduled: '04 В ПЛАНЕ',
    published: '05 ОПУБЛИКОВАНО'
  };

  // Quick add 15 minutes to post directly from table
  const handleQuickAddTime = (e: React.MouseEvent, post: Post, additionalMins: number) => {
    e.stopPropagation();
    const updated: Post = {
      ...post,
      timeSpentMinutes: (post.timeSpentMinutes || 0) + additionalMins
    };
    onUpdatePost(updated);
  };

  return (
    <div className="swiss-analytics-container" style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Top Section Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '2px solid var(--border-light)',
        paddingBottom: '20px',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="swiss-brand-badge" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
              SECTION 05 // INTELLIGENCE
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
              SWISS TYPOGRAPHIC TIME & EXECUTION ENGINE
            </span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)'
          }}>
            ТРЕКИНГ ВРЕМЕНИ И СТАТИСТИКА ПЛАНОВ
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Аналитика продуктивности джуниор-дизайнера: хронометраж работы над кейсами и контроль выполнения дедлайнов.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            padding: '8px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <SlidersHorizontal size={14} color="var(--text-secondary)" />
            <span>ФИЛЬТР СЕТИ: <strong>{selectedChannel.toUpperCase()}</strong></span>
          </div>
        </div>
      </div>

      {/* Top 5 Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {/* KPI 1: Total Time Spent */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
              01 // ВСЕГО ВРЕМЕНИ
            </span>
            <Clock size={16} color="#33cc66" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatMinutes(metrics.totalMinutes)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              {metrics.totalMinutes} минут чистого фокуса
            </div>
          </div>
        </div>

        {/* KPI 2: Completed Plans */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid #23472b',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderLeft: '4px solid #33cc66'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#33cc66', letterSpacing: '0.06em' }}>
              02 // ВЫПОЛНЕНО ПЛАНОВ
            </span>
            <CheckCircle2 size={16} color="#33cc66" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 800, color: '#33cc66' }}>
                {metrics.completedPosts.length}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                / {metrics.totalPlans} ({metrics.completionRate}%)
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              Успешно опубликовано в соцсети
            </div>
          </div>
        </div>

        {/* KPI 3: Overdue Plans */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid #4a1f1f',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderLeft: '4px solid #ff4444'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ff4444', letterSpacing: '0.06em' }}>
              03 // ПРОСРОЧЕНО (НЕ ВЫПОЛНЕНО)
            </span>
            <AlertTriangle size={16} color="#ff4444" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 800, color: '#ff4444' }}>
                {metrics.overduePosts.length}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                / {metrics.totalPlans} ({metrics.overdueRate}%)
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              Дедлайн истек, публикация не вышла
            </div>
          </div>
        </div>

        {/* KPI 4: In Progress Plans */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderLeft: '4px solid #ffbb33'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ffbb33', letterSpacing: '0.06em' }}>
              04 // АКТИВНО В РАБОТЕ
            </span>
            <Hourglass size={16} color="#ffbb33" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 800, color: '#ffbb33' }}>
                {metrics.inProgressPosts.length}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                ({metrics.inProgressRate}%)
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              Идеи, сценарии и макеты в процессе
            </div>
          </div>
        </div>

        {/* KPI 5: Avg Time Per Post */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
              05 // СРЕДНЕЕ ВРЕМЯ НА КЕЙС
            </span>
            <TrendingUp size={16} color="var(--text-primary)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatMinutes(metrics.avgMinutesPerCompleted)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              Средняя выработка на 1 единицу контента
            </div>
          </div>
        </div>
      </div>

      {/* Swiss Visual Progress & Breakdown Modules */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '24px',
        marginBottom: '36px'
      }}>
        {/* Module A: Distribution by Platforms */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={16} color="var(--text-primary)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                ВРЕМЯ ПО ЦЕЛЕВЫМ ПЛАТФОРМАМ
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
              {platformStats.length} СЕТЕЙ
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {platformStats.map(plat => (
              <div key={plat.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  <span>
                    <strong>{plat.label}</strong>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({plat.count} публ. // {plat.completed} вып.)</span>
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    {formatMinutes(plat.minutes)}
                    <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>[{plat.percentage}%]</span>
                  </span>
                </div>
                {/* Proportional Swiss Bar */}
                <div style={{
                  height: '6px',
                  backgroundColor: 'var(--border-light)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${plat.percentage}%`,
                    backgroundColor: 'var(--text-primary)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module B: Distribution by Content Format */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="var(--text-primary)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                ВРЕМЯ ПО ФОРМАТАМ КОНТЕНТА
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
              {formatStats.length} ФОРМАТА
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {formatStats.map(fmt => (
              <div key={fmt.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  <span>
                    <strong>{fmt.label}</strong>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({fmt.count} постов)</span>
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    {formatMinutes(fmt.minutes)}
                    <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>[{fmt.percentage}%]</span>
                  </span>
                </div>
                <div style={{
                  height: '6px',
                  backgroundColor: 'var(--border-light)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${fmt.percentage}%`,
                    backgroundColor: '#33cc66',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Timesheet Table Section */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        padding: '20px'
      }}>
        {/* Table Controls Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              className={`swiss-btn swiss-btn-sm ${tableFilter === 'all' ? 'swiss-btn-primary' : ''}`}
              onClick={() => setTableFilter('all')}
            >
              ВСЕ ЗАДАЧИ ({channelPosts.length})
            </button>
            <button
              className={`swiss-btn swiss-btn-sm ${tableFilter === 'completed' ? 'swiss-btn-primary' : ''}`}
              style={tableFilter === 'completed' ? { backgroundColor: '#33cc66', color: '#000', borderColor: '#33cc66' } : {}}
              onClick={() => setTableFilter('completed')}
            >
              ВЫПОЛНЕНО ({metrics.completedPosts.length})
            </button>
            <button
              className={`swiss-btn swiss-btn-sm ${tableFilter === 'overdue' ? 'swiss-btn-primary' : ''}`}
              style={tableFilter === 'overdue' ? { backgroundColor: '#ff4444', color: '#000', borderColor: '#ff4444' } : {}}
              onClick={() => setTableFilter('overdue')}
            >
              ПРОСРОЧЕНО ({metrics.overduePosts.length})
            </button>
            <button
              className={`swiss-btn swiss-btn-sm ${tableFilter === 'in_progress' ? 'swiss-btn-primary' : ''}`}
              style={tableFilter === 'in_progress' ? { backgroundColor: '#ffbb33', color: '#000', borderColor: '#ffbb33' } : {}}
              onClick={() => setTableFilter('in_progress')}
            >
              В РАБОТЕ ({metrics.inProgressPosts.length})
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpDown size={14} color="var(--text-secondary)" />
              <select
                className="swiss-select"
                style={{ padding: '4px 10px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
              >
                <option value="time-desc">По затраченному времени (Сначала больше)</option>
                <option value="time-asc">По затраченному времени (Сначала меньше)</option>
                <option value="date-asc">По дедлайну (Сначала ближайшие)</option>
                <option value="date-desc">По дедлайну (Сначала поздние)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                className="swiss-input"
                style={{ width: '200px', padding: '4px 10px', fontSize: '12px' }}
                placeholder="Фильтр по названию..."
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Timesheet Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px'
          }}>
            <thead>
              <tr style={{
                backgroundColor: 'var(--bg-primary)',
                borderBottom: '2px solid var(--border-medium)',
                textAlign: 'left'
              }}>
                <th style={{ padding: '12px', width: '120px' }}>СТАТУС ДЕДЛАЙНА</th>
                <th style={{ padding: '12px', width: '110px' }}>ЭТАП ВОРОНКИ</th>
                <th style={{ padding: '12px' }}>НАЗВАНИЕ КЕЙСА / ИДЕИ</th>
                <th style={{ padding: '12px', width: '140px' }}>СОЦСЕТИ</th>
                <th style={{ padding: '12px', width: '130px' }}>ДАТА ПЛАНА</th>
                <th style={{ padding: '12px', width: '150px' }}>ВРЕМЯ РАБОТЫ</th>
                <th style={{ padding: '12px', width: '140px', textAlign: 'right' }}>ДЕЙСТВИЯ</th>
              </tr>
            </thead>
            <tbody>
              {filteredTablePosts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    [ ЗАДАЧИ В ВЫБРАННОЙ КАТЕГОРИИ НЕ НАЙДЕНЫ ]
                  </td>
                </tr>
              ) : (
                filteredTablePosts.map(post => {
                  const deadlineStatus = getPostDeadlineStatus(post);
                  const scheduledFormatted = post.scheduledDate 
                    ? new Date(post.scheduledDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : '—';

                  return (
                    <tr 
                      key={post.id}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background-color 0.15s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => onSelectPost(post)}
                    >
                      {/* Deadline Status Badge */}
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 7px',
                          fontSize: '10px',
                          fontWeight: 800,
                          backgroundColor: deadlineStatus.bg,
                          color: deadlineStatus.color,
                          border: `1px solid ${deadlineStatus.border}`,
                          letterSpacing: '0.04em'
                        }}>
                          {deadlineStatus.label}
                        </span>
                      </td>

                      {/* Stage Badge */}
                      <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '11px' }}>
                        {stageLabels[post.status] || post.status.toUpperCase()}
                      </td>

                      {/* Title & Hook */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                          {post.title}
                        </div>
                        {post.hook && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                            «{post.hook}»
                          </div>
                        )}
                      </td>

                      {/* Platforms */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {post.channels.slice(0, 3).map(ch => (
                            <span key={ch} style={{ fontSize: '9px', padding: '2px 5px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}>
                              {ch.slice(0, 2).toUpperCase()}
                            </span>
                          ))}
                          {post.channels.length > 3 && (
                            <span style={{ fontSize: '9px', padding: '2px 5px', color: 'var(--text-muted)' }}>
                              +{post.channels.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Scheduled Date */}
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        {scheduledFormatted}
                      </td>

                      {/* Time Spent */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontWeight: 800,
                            color: (post.timeSpentMinutes || 0) > 0 ? '#33cc66' : 'var(--text-muted)',
                            backgroundColor: (post.timeSpentMinutes || 0) > 0 ? '#112215' : 'transparent',
                            padding: '2px 6px',
                            border: (post.timeSpentMinutes || 0) > 0 ? '1px solid #23472b' : 'none'
                          }}>
                            {formatMinutes(post.timeSpentMinutes || 0)}
                          </span>

                          <button
                            type="button"
                            className="swiss-btn swiss-btn-sm"
                            style={{ padding: '2px 6px', fontSize: '9px' }}
                            onClick={(e) => handleQuickAddTime(e, post, 15)}
                            title="Быстро добавить +15 минут работы"
                          >
                            +15м
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }} onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            className="swiss-btn swiss-btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => onSelectPost(post)}
                            title="Открыть редактор кейса"
                          >
                            <Edit3 size={12} />
                          </button>

                          <button
                            type="button"
                            className="swiss-btn swiss-btn-danger swiss-btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => setDeletingPostId(post.id)}
                            title="Удалить карточку"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog from Analytics Table */}
      {deletingPostId && (
        <div 
          className="swiss-modal-overlay" 
          onClick={() => setDeletingPostId(null)}
          style={{ zIndex: 110 }}
        >
          <div 
            className="swiss-modal" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '460px', backgroundColor: '#160a0a', border: '2px solid #ff3b30' }}
          >
            <div style={{ padding: '24px', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff3b30', marginBottom: '14px' }}>
                <AlertTriangle size={22} />
                <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  УДАЛИТЬ КЕЙС / ИДЕЮ?
                </span>
              </div>
              <p style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.6', marginBottom: '10px' }}>
                Вы собираетесь безвозвратно удалить выбранную публикацию и все связанные с ней тайм-логи.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="swiss-btn swiss-btn-sm"
                  onClick={() => setDeletingPostId(null)}
                >
                  ОТМЕНА
                </button>
                <button
                  type="button"
                  className="swiss-btn swiss-btn-danger swiss-btn-sm"
                  style={{ backgroundColor: '#ff3b30', color: '#000', fontWeight: 800, borderColor: '#ff3b30' }}
                  onClick={() => {
                    if (deletingPostId) {
                      onDeletePost(deletingPostId);
                      setDeletingPostId(null);
                    }
                  }}
                >
                  ДА, УДАЛИТЬ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
