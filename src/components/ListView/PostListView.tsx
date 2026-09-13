import React from 'react';
import { Post, Stage, Platform } from '../../types/index.ts';
import { Trash2, Edit3 } from 'lucide-react';

interface PostListViewProps {
  posts: Post[];
  selectedChannel: Platform | 'all';
  onSelectPost: (post: Post) => void;
  onDeletePost: (id: string) => void;
  onUpdateStage: (postId: string, newStage: Stage) => void;
}

export const PostListView: React.FC<PostListViewProps> = ({
  posts,
  selectedChannel,
  onSelectPost,
  onDeletePost,
  onUpdateStage
}) => {
  const filteredPosts = selectedChannel === 'all'
    ? posts
    : posts.filter(p => p.channels.includes(selectedChannel));

  return (
    <div className="swiss-table-container">
      <table className="swiss-table">
        <thead>
          <tr>
            <th style={{ width: '80px' }}>INDEX</th>
            <th>PROJECT // TITLE & HOOK</th>
            <th style={{ width: '140px' }}>FORMAT</th>
            <th style={{ width: '180px' }}>CHANNELS</th>
            <th style={{ width: '160px' }}>SCHEDULED</th>
            <th style={{ width: '150px' }}>STATUS</th>
            <th style={{ width: '120px', textAlign: 'right' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {filteredPosts.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                НЕТ ПОСТОВ ПО ЗАДАННЫМ ФИЛЬТРАМ
              </td>
            </tr>
          ) : (
            filteredPosts.map((post, idx) => {
              const dateStr = post.scheduledDate 
                ? new Date(post.scheduledDate).toLocaleString('ru-RU', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '—';

              return (
                <tr key={post.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    #{String(idx + 1).padStart(2, '0')}
                  </td>

                  <td>
                    <div 
                      style={{ fontWeight: 700, cursor: 'pointer', marginBottom: '4px' }}
                      onClick={() => onSelectPost(post)}
                    >
                      {post.title}
                    </div>
                    {post.hook && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        "{post.hook}"
                      </div>
                    )}
                  </td>

                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase' }}>
                      {post.format} // {post.category}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {post.channels.map(ch => (
                        <span key={ch} className={`channel-badge ${ch}`}>
                          {ch === 'instagram' ? 'IG' : ch === 'twitter' ? 'X' : ch === 'bluesky' ? 'BSKY' : 'TG'}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {dateStr}
                  </td>

                  <td>
                    <select 
                      className="swiss-select"
                      style={{ padding: '4px 8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                      value={post.status}
                      onChange={(e) => onUpdateStage(post.id, e.target.value as Stage)}
                    >
                      <option value="idea">01 // IDEA</option>
                      <option value="script">02 // SCRIPT</option>
                      <option value="media">03 // MEDIA</option>
                      <option value="scheduled">04 // SCHEDULED</option>
                      <option value="published">05 // PUBLISHED</option>
                    </select>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button 
                        className="swiss-btn swiss-btn-sm swiss-btn-icon" 
                        onClick={() => onSelectPost(post)}
                        title="Открыть студию контента"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button 
                        className="swiss-btn swiss-btn-sm swiss-btn-icon swiss-btn-danger" 
                        onClick={() => {
                          if (confirm(`Удалить пост "${post.title}"?`)) {
                            onDeletePost(post.id);
                          }
                        }}
                        title="Удалить пост"
                      >
                        <Trash2 size={13} />
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
  );
};
