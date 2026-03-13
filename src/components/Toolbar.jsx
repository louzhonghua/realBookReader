import { useState, useMemo } from 'react';
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

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-inner">
          {/* 左侧区域 */}
          <div className="toolbar-section toolbar-left">
            <button className="toolbar-btn" onClick={onClose} title="返回">
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
            <button
              className={`toolbar-btn ${showThumbnails ? 'active' : ''}`}
              onClick={() => setShowThumbnails(!showThumbnails)}
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

      {/* 缩略图网格遮罩 */}
      {showThumbnails && (
        <div className="thumbnail-overlay" onClick={() => setShowThumbnails(false)}>
          <div className="thumbnail-grid" onClick={(e) => e.stopPropagation()}>
            <div className="thumbnail-header">
              <h3>页面导航</h3>
              <button className="thumbnail-close" onClick={() => setShowThumbnails(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="thumbnail-list">
              {pages.map((src, index) => (
                <div
                  key={index}
                  className={`thumbnail-item ${index === currentPage ? 'active' : ''}`}
                  onClick={() => {
                    onFlipToPage(index);
                    setShowThumbnails(false);
                  }}
                >
                  <img src={src} alt={`Page ${index + 1}`} />
                  <span className="thumbnail-label">{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
