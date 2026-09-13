import React, { useState, useEffect } from 'react';
import { Post, Trend, AppSettings, Platform, Stage } from './types/index.ts';
import { 
  getPosts, 
  getTrends, 
  getSettings, 
  createPost, 
  updatePost, 
  deletePost 
} from './services/api.ts';
import { Header, ViewType } from './components/Header.tsx';
import { TrendRadar } from './components/TrendRadar/TrendRadar.tsx';
import { CalendarView } from './components/Calendar/CalendarView.tsx';
import { KanbanBoard } from './components/Kanban/KanbanBoard.tsx';
import { PostListView } from './components/ListView/PostListView.tsx';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard.tsx';
import { PostModal } from './components/PostEditor/PostModal.tsx';
import { SettingsModal } from './components/Settings/SettingsModal.tsx';
import './styles/swiss.css';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('calendar');
  const [selectedChannel, setSelectedChannel] = useState<Platform | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [posts, setPosts] = useState<Post[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    defaultModel: 'anthropic/claude-3.5-sonnet',
    availableModels: [],
    simulationMode: true
  });

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [fetchedPosts, fetchedTrends, fetchedSettings] = await Promise.all([
        getPosts(),
        getTrends(),
        getSettings()
      ]);
      setPosts(fetchedPosts);
      setTrends(fetchedTrends);
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Failed to load initial data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter posts by search query and channel
  const filteredPosts = posts.filter(p => {
    const matchesSearch = !searchQuery.trim() || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.hook && p.hook.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.caption && p.caption.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesChannel = selectedChannel === 'all' || p.channels.includes(selectedChannel);

    return matchesSearch && matchesChannel;
  });

  // Handle stage change (e.g. from Kanban or List)
  const handleUpdateStage = async (postId: string, newStage: Stage) => {
    try {
      const updated = await updatePost(postId, { status: newStage });
      setPosts(prev => prev.map(p => p.id === postId ? updated : p));
    } catch (err) {
      console.error(err);
      alert('Ошибка при обновлении статуса');
    }
  };

  // Handle creating new post
  const handleNewPost = (scheduledDateStr?: string) => {
    const newDraft: Post = {
      id: '',
      title: 'Новый дизайн-проект',
      status: 'idea',
      channels: ['instagram', 'telegram'],
      category: 'typography',
      scheduledDate: scheduledDateStr 
        ? `${scheduledDateStr}T14:00:00.000Z` 
        : new Date(Date.now() + 86400000).toISOString(),
      format: 'carousel',
      hook: '',
      caption: '',
      slides: [],
      videoScript: [],
      threadPosts: [],
      telegramPost: '',
      mediaUrls: []
    };
    setEditingPost(newDraft);
    setIsPostModalOpen(true);
  };

  // Convert trend into content plan draft
  const handleCreatePostFromTrend = (trend: Trend) => {
    // Deduplication check: if card already exists, open existing instead of creating duplicate
    const existing = posts.find(p => p.title.trim().toLowerCase() === trend.title.trim().toLowerCase());
    if (existing) {
      setEditingPost(existing);
      setIsPostModalOpen(true);
      return;
    }

    const trendPost: Post = {
      id: '',
      title: trend.title,
      status: 'idea',
      channels: ['instagram', 'twitter', 'bluesky', 'telegram'],
      category: trend.category,
      scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      format: trend.suggestedFormat,
      hook: trend.keyTakeaway,
      caption: `${trend.title}\n\n${trend.description}\n\n${trend.keyTakeaway}\n\n#${trend.tags.join(' #')}`,
      slides: [
        {
          slideNumber: 1,
          title: 'COVER // 01',
          text: trend.title.toUpperCase(),
          visualPrompt: `Стиль: ${trend.categoryLabel}. ${trend.description}`
        }
      ],
      mediaUrls: []
    };
    setEditingPost(trendPost);
    setIsPostModalOpen(true);
  };

  // Handle saving post (with deduplication support)
  const handleSavePost = async (postToSave: Post, forceDuplicate = false) => {
    try {
      if (postToSave.id) {
        const updated = await updatePost(postToSave.id, postToSave);
        setPosts(prev => prev.map(p => p.id === postToSave.id ? updated : p));
      } else {
        const res = await createPost(postToSave, forceDuplicate);
        if (res.duplicatePrevented) {
          setPosts(prev => {
            const exists = prev.some(p => p.id === res.id);
            return exists ? prev.map(p => p.id === res.id ? res : p) : [res, ...prev];
          });
          setEditingPost(res);
        } else {
          setPosts(prev => [res, ...prev]);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении публикации');
    }
  };

  // Handle delete post
  const handleDeletePost = async (id: string) => {
    try {
      await deletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Ошибка при удалении');
    }
  };

  return (
    <div className="swiss-app-container">
      {/* Swiss Header */}
      <Header 
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedChannel={selectedChannel}
        onChannelChange={setSelectedChannel}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewPost={() => handleNewPost()}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isSimulated={settings.simulationMode}
        totalPosts={posts.length}
      />

      {/* Main Viewport */}
      <main className="swiss-main-content">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'var(--font-mono)' }}>
            [ INITIALIZING SWISS CONTENT ENGINE... ]
          </div>
        ) : (
          <>
            {currentView === 'trends' && (
              <TrendRadar 
                trends={trends}
                posts={posts}
                settings={settings}
                onRefreshTrends={loadData}
                onCreatePostFromTrend={handleCreatePostFromTrend}
                onOpenExistingPost={(p) => {
                  setEditingPost(p);
                  setIsPostModalOpen(true);
                }}
              />
            )}

            {currentView === 'calendar' && (
              <CalendarView 
                posts={filteredPosts}
                selectedChannel={selectedChannel}
                onSelectPost={(p) => {
                  setEditingPost(p);
                  setIsPostModalOpen(true);
                }}
                onNewPostForDate={(d) => handleNewPost(d)}
              />
            )}

            {currentView === 'kanban' && (
              <KanbanBoard 
                posts={filteredPosts}
                selectedChannel={selectedChannel}
                onSelectPost={(p) => {
                  setEditingPost(p);
                  setIsPostModalOpen(true);
                }}
                onUpdateStage={handleUpdateStage}
              />
            )}

            {currentView === 'list' && (
              <PostListView 
                posts={filteredPosts}
                selectedChannel={selectedChannel}
                onSelectPost={(p) => {
                  setEditingPost(p);
                  setIsPostModalOpen(true);
                }}
                onDeletePost={handleDeletePost}
                onUpdateStage={handleUpdateStage}
              />
            )}

            {currentView === 'analytics' && (
              <AnalyticsDashboard 
                posts={posts}
                selectedChannel={selectedChannel}
                onSelectPost={(p) => {
                  setEditingPost(p);
                  setIsPostModalOpen(true);
                }}
                onDeletePost={handleDeletePost}
                onUpdatePost={async (p) => {
                  if (p.id) {
                    await handleSavePost(p);
                  }
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Post Editor Studio Modal */}
      {isPostModalOpen && editingPost && (
        <PostModal 
          post={editingPost}
          isOpen={isPostModalOpen}
          onClose={() => {
            setIsPostModalOpen(false);
            setEditingPost(null);
          }}
          onSave={handleSavePost}
          onPostUpdated={loadData}
          settings={settings}
          existingPosts={posts}
          onSelectExistingPost={(p) => setEditingPost(p)}
          onDelete={handleDeletePost}
        />
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <SettingsModal 
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          onSettingsSaved={loadData}
        />
      )}
    </div>
  );
};

export default App;
