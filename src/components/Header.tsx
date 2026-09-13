import React from 'react';
import { 
  Compass, 
  Calendar as CalendarIcon, 
  Kanban, 
  ListOrdered, 
  Plus, 
  Settings as SettingsIcon,
  Search,
  BarChart3
} from 'lucide-react';
import { Platform } from '../types/index.ts';

export type ViewType = 'trends' | 'calendar' | 'kanban' | 'list' | 'analytics';

interface HeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  selectedChannel: Platform | 'all';
  onChannelChange: (channel: Platform | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewPost: () => void;
  onOpenSettings: () => void;
  isSimulated: boolean;
  totalPosts: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  selectedChannel,
  onChannelChange,
  searchQuery,
  onSearchChange,
  onNewPost,
  onOpenSettings,
  isSimulated,
  totalPosts
}) => {
  const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '.');

  const channelButtons: { id: Platform | 'all'; label: string }[] = [
    { id: 'all', label: 'ALL' },
    { id: 'instagram', label: '[IG] INSTAGRAM' },
    { id: 'twitter', label: '[X] TWITTER' },
    { id: 'bluesky', label: '[BSKY] BLUESKY' },
    { id: 'telegram', label: '[TG] TELEGRAM' },
    { id: 'tiktok', label: '[TT] TIKTOK' },
    { id: 'pinterest', label: '[PIN] PINTEREST' },
    { id: 'linkedin', label: '[IN] LINKEDIN' },
    { id: 'threads', label: '[TH] THREADS' }
  ];

  return (
    <header className="swiss-header">
      {/* Top Meta Bar */}
      <div className="swiss-header-top">
        <div className="swiss-brand">
          <span className="swiss-brand-badge">GRID 8PX</span>
          <h1 className="swiss-brand-title">KRAFTWERK // CONTENT ENGINE</h1>
        </div>

        <div className="swiss-header-meta">
          <span>SYS.DATE: {currentDate}</span>
          <span>ENTRIES: {totalPosts}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span 
              style={{ 
                width: '8px', 
                height: '8px', 
                backgroundColor: isSimulated ? '#ffbb33' : '#33cc66',
                borderRadius: '50%',
                display: 'inline-block'
              }} 
            />
            {isSimulated ? 'MODE: SANDBOX SIMULATION' : 'MODE: LIVE API'}
          </span>
        </div>

        <div className="swiss-header-actions">
          <button 
            className="swiss-btn swiss-btn-sm" 
            onClick={onOpenSettings}
            title="Настройки API и подключений"
          >
            <SettingsIcon size={14} />
            SETTINGS
          </button>
          <button 
            className="swiss-btn swiss-btn-primary swiss-btn-sm" 
            onClick={onNewPost}
          >
            <Plus size={14} />
            + NEW POST
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="swiss-nav-bar">
        <div className="swiss-view-tabs">
          <button 
            className={`swiss-view-tab ${currentView === 'trends' ? 'active' : ''}`}
            onClick={() => onViewChange('trends')}
          >
            <Compass size={15} />
            01 // TREND RADAR
          </button>
          <button 
            className={`swiss-view-tab ${currentView === 'calendar' ? 'active' : ''}`}
            onClick={() => onViewChange('calendar')}
          >
            <CalendarIcon size={15} />
            02 // CALENDAR GRID
          </button>
          <button 
            className={`swiss-view-tab ${currentView === 'kanban' ? 'active' : ''}`}
            onClick={() => onViewChange('kanban')}
          >
            <Kanban size={15} />
            03 // KANBAN PIPELINE
          </button>
          <button 
            className={`swiss-view-tab ${currentView === 'list' ? 'active' : ''}`}
            onClick={() => onViewChange('list')}
          >
            <ListOrdered size={15} />
            04 // EDITORIAL LIST
          </button>
          <button 
            className={`swiss-view-tab ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => onViewChange('analytics')}
          >
            <BarChart3 size={15} />
            05 // ТРЕКИНГ И СТАТИСТИКА
          </button>
        </div>
      </div>

      {/* Sub-bar: Filters & Fast Search */}
      <div className="swiss-sub-bar">
        <div className="swiss-filter-group">
          <span className="swiss-filter-label">CHANNELS:</span>
          {channelButtons.map(btn => (
            <button 
              key={btn.id}
              className={`swiss-filter-pill ${selectedChannel === btn.id ? 'active' : ''}`}
              onClick={() => onChannelChange(btn.id)}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={14} color="var(--text-muted)" />
          <input 
            type="text" 
            className="swiss-search-input" 
            placeholder="Поиск по темам, хукам, сетям..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
};
