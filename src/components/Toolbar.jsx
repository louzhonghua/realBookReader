import { useState, useMemo, useEffect, useRef } from 'react';
import LazyThumbnail from './LazyThumbnail';
import './Toolbar.css';

export default function Toolbar({
  currentPage,
  totalPages,
  pages,
  onFlipNext,
  onFlipPrev,
  onFlipToPage,
  onClose,
}) {
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showJumpPanel, setShowJumpPanel] = useState(false);
  const [jumpValue, setJumpValue] = useState('');
  const thumbnailListRef = useRef(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // 生成页码显示信息（书本双页展示）
  const pageDisplay = useMemo(() => {
    if (currentPage === 0) return '封面';
    if (currentPage >= totalPages - 1) return '封底';
    return `${currentPage} - ${Math.min(currentPage + 1, totalPages)} / ${totalPages}`;
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!showThumbnails || !thumbnailListRef.current) return;

    const rafId = window.requestAnimationFrame(() => {
      const activeItem = thumbnailListRef.current?.querySelector('.thumbnail-item.active');
      activeItem?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [showThumbnails, currentPage]);

  const toggleJumpPanel = () => {
    setShowJumpPanel((visible) => {
      if (!visible) {
        const currentDisplayPage = Math.min(totalPages, Math.max(1, currentPage + 1));
        setJumpValue(String(currentDisplayPage));
      }
      return !visible;
    });
  };

  const handleJumpSubmit = (event) => {
    event.preventDefault();
    const pageNumber = Math.floor(Number(jumpValue));
    if (!Number.isFinite(pageNumber)) return;
    if (pageNumber < 1 || pageNumber > totalPages) {
      alert(`请输入 1 - ${totalPages} 之间的页码`);
      return;
    }
    onFlipToPage(pageNumber - 1);
    setShowJumpPanel(false);
  };

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-inner">
          {/* 左侧区域 */}
          <div className="toolbar-section toolbar-left">
            <button className="toolbar-btn" onClick={onClose} title="返回书架">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* 中间区域 */}
          <div className="toolbar-section toolbar-center">
            <button className="toolbar-btn" onClick={onFlipPrev} title="上一页">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <span className="page-indicator">{pageDisplay}</span>

            <button className="toolbar-btn" onClick={onFlipNext} title="下一页">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* 右侧区域 */}
          <div className="toolbar-section toolbar-right">
            <div className="jump-wrapper">
              <button
                className={`toolbar-btn ${showJumpPanel ? 'active' : ''}`}
                onClick={toggleJumpPanel}
                title="跳转页码"
                aria-label="跳转页码"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7h9M4 12h9M4 17h9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M14 12h6M17 9l3 3-3 3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {showJumpPanel && (
                <form className="jump-panel" onSubmit={handleJumpSubmit}>
                  <input
                    className="jump-input"
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpValue}
                    onChange={(event) => setJumpValue(event.target.value)}
                    placeholder={`1-${totalPages}`}
                  />
                  <button className="jump-confirm-btn" type="submit">
                    跳转
                  </button>
                </form>
              )}
            </div>

            <button
              className={`toolbar-btn ${showThumbnails ? 'active' : ''}`}
              onClick={() => {
                setShowJumpPanel(false);
                setShowThumbnails(!showThumbnails);
              }}
              title="缩略图"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>

            <button className="toolbar-btn" onClick={toggleFullscreen} title="全屏">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 缩略图侧边栏 */}
      {showThumbnails && (
        <>
          <div className="thumbnail-backdrop" onClick={() => setShowThumbnails(false)} />
          <div className="thumbnail-sidebar">
            <div className="thumbnail-header">
              <h3>页面导航</h3>
              <button className="thumbnail-close" onClick={() => setShowThumbnails(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="thumbnail-list" ref={thumbnailListRef}>
              {pages.map((src, index) => (
                <LazyThumbnail
                  key={index}
                  src={src}
                  index={index}
                  currentPage={currentPage}
                  onClick={() => {
                    onFlipToPage(index);
                    if (window.innerWidth <= 768) {
                      setShowThumbnails(false);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
