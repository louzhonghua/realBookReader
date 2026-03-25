import { useRef } from 'react';
import './Bookshelf.css';

function formatImportTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Bookshelf({ books, onImport, onOpenBook }) {
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const pdfFiles = selectedFiles.filter((file) => file.type === 'application/pdf');

    if (pdfFiles.length !== selectedFiles.length) {
      alert('仅支持导入 PDF 文件');
    }

    if (pdfFiles.length > 0) {
      onImport?.(pdfFiles);
    }

    // 重置 input，允许重复选择同一文件
    event.target.value = '';
  };

  return (
    <section className="bookshelf">
      <header className="bookshelf-header">
        <div className="bookshelf-title-wrap">
          <h1 className="bookshelf-title">书架</h1>
          <p className="bookshelf-subtitle">你的 PDF 将安全保存在本地，仅你可见</p>
        </div>
        <button className="bookshelf-import-btn" onClick={handleImportClick}>
          导入书籍
        </button>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="bookshelf-file-input"
        onChange={handleInputChange}
      />

      {books.length === 0 ? (
        <div className="bookshelf-empty">
          <div className="bookshelf-empty-icon" aria-hidden>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 5a2 2 0 012-2h10a2 2 0 012 2v14a1 1 0 01-1.6.8L12 16.5l-4.4 3.3A1 1 0 016 19V5z"
                stroke="currentColor"
                strokeWidth="1.6"
                fill="none"
              />
            </svg>
          </div>
          <h2>书架还是空的</h2>
          <p>导入第一本 PDF，开始沉浸式翻页阅读</p>
          <button className="bookshelf-import-btn primary" onClick={handleImportClick}>
            导入第一本书
          </button>
        </div>
      ) : (
        <div className="bookshelf-grid">
          {books.map((book) => (
            <button
              key={book.id}
              className="book-card"
              onClick={() => onOpenBook?.(book)}
              title={book.name}
            >
              <div className="book-cover-shell">
                {book.coverDataUrl ? (
                  <img className="book-cover" src={book.coverDataUrl} alt={book.name} />
                ) : (
                  <div className="book-cover-fallback">
                    <span>PDF</span>
                  </div>
                )}
              </div>
              <div className="book-meta">
                <h3 className="book-name">{book.name}</h3>
                <p className="book-progress">
                  {book.recentPage > 0
                    ? `上次读到第 ${book.recentPage + 1} 页`
                    : '尚未开始阅读'}
                </p>
                <p className="book-time">{formatImportTime(book.importedAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
