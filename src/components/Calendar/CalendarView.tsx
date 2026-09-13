import React, { useState } from 'react';
import { Post, Platform } from '../../types/index.ts';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CalendarViewProps {
  posts: Post[];
  selectedChannel: Platform | 'all';
  onSelectPost: (post: Post) => void;
  onNewPostForDate: (dateString: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  posts,
  selectedChannel,
  onSelectPost,
  onNewPostForDate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ',
    'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ'
  ];

  const daysOfWeek = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

  const prevPeriod = () => {
    if (calendarMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const prev = new Date(currentDate);
      prev.setDate(prev.getDate() - 7);
      setCurrentDate(prev);
    }
  };

  const nextPeriod = () => {
    if (calendarMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 7);
      setCurrentDate(next);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter posts by channel
  const filteredPosts = selectedChannel === 'all'
    ? posts
    : posts.filter(p => p.channels.includes(selectedChannel));

  // --- MONTH VIEW LOGIC ---
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthCells = [];

  // Previous month filler days
  for (let i = startDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateStr = new Date(year, month - 1, day).toISOString().split('T')[0];
    monthCells.push({ day, dateStr, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = new Date(year, month, d).toISOString().split('T')[0];
    monthCells.push({ day: d, dateStr, isCurrentMonth: true });
  }

  // Next month filler days (5 weeks = 35 cells, 6 weeks = 42 cells)
  const totalCellsNeeded = monthCells.length > 35 ? 42 : 35;
  const remaining = totalCellsNeeded - monthCells.length;
  for (let d = 1; d <= remaining; d++) {
    const dateStr = new Date(year, month + 1, d).toISOString().split('T')[0];
    monthCells.push({ day: d, dateStr, isCurrentMonth: false });
  }

  // --- WEEK VIEW LOGIC ---
  const currentDayOfWeek = currentDate.getDay();
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const weekCells = [];
  for (let i = 0; i < 7; i++) {
    const wDay = new Date(currentDate);
    wDay.setDate(currentDate.getDate() + mondayOffset + i);
    const dateStr = wDay.toISOString().split('T')[0];
    weekCells.push({
      day: wDay.getDate(),
      dateStr,
      isCurrentMonth: wDay.getMonth() === month,
      fullDate: wDay
    });
  }

  return (
    <div className="calendar-view-wrapper">
      {/* Calendar Top Navigation Header */}
      <div className="calendar-nav-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="calendar-current-label">
            {calendarMode === 'month' 
              ? `${monthNames[month]} ${year}` 
              : `НЕДЕЛЯ: ${weekCells[0]?.dateStr} — ${weekCells[6]?.dateStr}`}
          </span>
          <button className="swiss-btn swiss-btn-sm" onClick={goToToday}>
            СЕГОДНЯ
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', border: '1px solid var(--border-medium)' }}>
            <button
              className={`swiss-filter-pill ${calendarMode === 'month' ? 'active' : ''}`}
              style={{ borderRadius: 0, border: 'none' }}
              onClick={() => setCalendarMode('month')}
            >
              МЕСЯЦ
            </button>
            <button
              className={`swiss-filter-pill ${calendarMode === 'week' ? 'active' : ''}`}
              style={{ borderRadius: 0, border: 'none' }}
              onClick={() => setCalendarMode('week')}
            >
              НЕДЕЛЯ
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button className="swiss-btn swiss-btn-icon swiss-btn-sm" onClick={prevPeriod} title="Назад">
              <ChevronLeft size={14} />
            </button>
            <button className="swiss-btn swiss-btn-icon swiss-btn-sm" onClick={nextPeriod} title="Вперед">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Weekdays Row */}
      <div className="calendar-weekdays-row">
        {daysOfWeek.map((day, idx) => (
          <div key={idx} className="calendar-weekday-cell">
            {day}
          </div>
        ))}
      </div>

      {/* Grid Content */}
      {calendarMode === 'month' ? (
        <div className={`calendar-grid-month ${totalCellsNeeded === 42 ? 'six-rows' : ''}`}>
          {monthCells.map((cell, idx) => {
            const isToday = cell.dateStr === todayStr;
            const dayPosts = filteredPosts.filter(p => {
              const pDate = p.scheduledDate ? p.scheduledDate.split('T')[0] : '';
              return pDate === cell.dateStr;
            });

            return (
              <div 
                key={idx} 
                className={`calendar-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
              >
                <div className="calendar-day-header">
                  <span className="calendar-day-number">
                    {cell.day < 10 ? `0${cell.day}` : cell.day}
                  </span>
                  <button 
                    className="swiss-btn swiss-btn-sm" 
                    style={{ padding: '1px 3px', fontSize: '9px' }}
                    onClick={() => onNewPostForDate(cell.dateStr)}
                    title="Запланировать на эту дату"
                  >
                    <Plus size={10} />
                  </button>
                </div>

                <div className="calendar-day-posts">
                  {dayPosts.map(post => (
                    <div 
                      key={post.id} 
                      className="calendar-post-chip"
                      onClick={() => onSelectPost(post)}
                      title={`${post.title} (${post.channels.join(', ')})`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        {post.format === 'stories' && (
                          <span style={{ color: '#ff77aa', fontSize: '8px', fontWeight: 800 }}>[STORY]</span>
                        )}
                        {post.channels.slice(0, 3).map(ch => (
                          <span key={ch} style={{ fontSize: '8px', color: '#999', fontFamily: 'var(--font-mono)' }}>
                            {ch === 'instagram' ? 'IG' : ch === 'twitter' ? 'X' : ch === 'bluesky' ? 'BSKY' : ch === 'telegram' ? 'TG' : ch === 'tiktok' ? 'TT' : ch === 'pinterest' ? 'PIN' : ch === 'linkedin' ? 'IN' : 'TH'}
                          </span>
                        ))}
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {post.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Week View Grid */
        <div className="calendar-grid-week">
          {weekCells.map((cell, idx) => {
            const isToday = cell.dateStr === todayStr;
            const dayPosts = filteredPosts.filter(p => {
              const pDate = p.scheduledDate ? p.scheduledDate.split('T')[0] : '';
              return pDate === cell.dateStr;
            });

            return (
              <div 
                key={idx} 
                className={`calendar-day-cell ${isToday ? 'today' : ''}`}
                style={{ padding: '12px' }}
              >
                <div className="calendar-day-header" style={{ marginBottom: '8px' }}>
                  <span className="calendar-day-number" style={{ fontSize: '13px' }}>
                    {cell.day < 10 ? `0${cell.day}` : cell.day} // {cell.dateStr}
                  </span>
                  <button 
                    className="swiss-btn swiss-btn-sm" 
                    style={{ padding: '2px 6px', fontSize: '10px' }}
                    onClick={() => onNewPostForDate(cell.dateStr)}
                  >
                    <Plus size={11} /> +ПОСТ
                  </button>
                </div>

                <div className="calendar-day-posts" style={{ gap: '8px' }}>
                  {dayPosts.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic', padding: '12px 0' }}>
                      Нет публикаций
                    </div>
                  ) : (
                    dayPosts.map(post => (
                      <div 
                        key={post.id} 
                        className="calendar-post-chip"
                        style={{ padding: '8px', whiteSpace: 'normal' }}
                        onClick={() => onSelectPost(post)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                            {post.format}
                          </span>
                          <span style={{ fontSize: '9px', color: '#999' }}>
                            {post.scheduledDate ? post.scheduledDate.slice(11, 16) : ''}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
                          {post.title}
                        </div>
                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                          {post.channels.map(ch => (
                            <span key={ch} className={`channel-badge ${ch}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
                              {ch}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
