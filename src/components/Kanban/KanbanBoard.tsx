import React from 'react';
import { Post, Stage, Platform } from '../../types/index.ts';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Clock, 
  CheckCircle2, 
  Lightbulb, 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';

interface KanbanBoardProps {
  posts: Post[];
  selectedChannel: Platform | 'all';
  onSelectPost: (post: Post) => void;
  onUpdateStage: (postId: string, newStage: Stage) => void;
}

interface ColumnConfig {
  id: Stage;
  label: string;
  icon: React.ReactNode;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  posts,
  selectedChannel,
  onSelectPost,
  onUpdateStage
}) => {
  const columns: ColumnConfig[] = [
    { id: 'idea', label: '01 // IDEAS & BACKLOG', icon: <Lightbulb size={14} /> },
    { id: 'script', label: '02 // SCRIPTING (AI)', icon: <Sparkles size={14} /> },
    { id: 'media', label: '03 // VISUAL & MEDIA', icon: <ImageIcon size={14} /> },
    { id: 'scheduled', label: '04 // SCHEDULED', icon: <Clock size={14} /> },
    { id: 'published', label: '05 // PUBLISHED', icon: <CheckCircle2 size={14} /> }
  ];

  const stageOrder: Stage[] = ['idea', 'script', 'media', 'scheduled', 'published'];

  const filteredPosts = selectedChannel === 'all'
    ? posts
    : posts.filter(p => p.channels.includes(selectedChannel));

  const moveCard = (e: React.MouseEvent, postId: string, direction: 'prev' | 'next', currentStage: Stage) => {
    e.stopPropagation();
    const currentIndex = stageOrder.indexOf(currentStage);
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < stageOrder.length) {
      onUpdateStage(postId, stageOrder[targetIndex]);
    }
  };

  return (
    <div className="kanban-container">
      {columns.map(column => {
        const columnPosts = filteredPosts.filter(p => p.status === column.id);

        return (
          <div key={column.id} className="kanban-column">
            <div className="kanban-column-header">
              <span className="kanban-column-title">
                {column.icon}
                {column.label}
              </span>
              <span className="kanban-column-count">{columnPosts.length}</span>
            </div>

            <div className="kanban-card-list">
              {columnPosts.map(post => {
                const dateFormatted = post.scheduledDate 
                  ? new Date(post.scheduledDate).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
                  : 'Без даты';

                const hasScript = Boolean(post.caption || (post.slides && post.slides.length > 0) || post.telegramPost);
                const hasMedia = Boolean(post.mediaUrls && post.mediaUrls.length > 0);

                return (
                  <div 
                    key={post.id} 
                    className="kanban-card"
                    onClick={() => onSelectPost(post)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: '10px', 
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase'
                      }}>
                        {post.format} // {post.category}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-secondary)' }}>
                        {dateFormatted}
                      </span>
                    </div>

                    <h4 className="kanban-card-title">{post.title}</h4>

                    {post.hook && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{post.hook}"
                      </p>
                    )}

                    <div className="kanban-card-meta">
                      <div className="kanban-card-channels">
                        {post.channels.map(ch => (
                          <span key={ch} className={`channel-badge ${ch}`}>
                            {ch === 'instagram' ? 'IG' : ch === 'twitter' ? 'X' : ch === 'bluesky' ? 'BSKY' : 'TG'}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {hasScript && (
                          <span title="AI Сценарий готов" style={{ color: '#ffbb33', display: 'flex', alignItems: 'center' }}>
                            <Sparkles size={12} />
                          </span>
                        )}
                        {hasMedia && (
                          <span title="Медиа загружено" style={{ color: '#66bbff', display: 'flex', alignItems: 'center' }}>
                            <ImageIcon size={12} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Move Stage Controls */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      borderTop: '1px solid var(--border-light)', 
                      paddingTop: '8px', 
                      marginTop: '4px' 
                    }}>
                      <button 
                        className="swiss-btn swiss-btn-sm" 
                        style={{ padding: '2px 8px', visibility: column.id === 'idea' ? 'hidden' : 'visible' }}
                        onClick={(e) => moveCard(e, post.id, 'prev', post.status)}
                        title="Назад на шаг"
                      >
                        <ArrowLeft size={12} />
                      </button>

                      <button 
                        className="swiss-btn swiss-btn-sm" 
                        style={{ padding: '2px 8px', visibility: column.id === 'published' ? 'hidden' : 'visible' }}
                        onClick={(e) => moveCard(e, post.id, 'next', post.status)}
                        title="Вперед на шаг"
                      >
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
