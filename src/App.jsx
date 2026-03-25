import { useState, useCallback, useEffect, useRef } from 'react';
import Bookshelf from './components/Bookshelf';
import FlipBook from './components/FlipBook';
import Toolbar from './components/Toolbar';
import { usePdfRenderer } from './hooks/usePdfRenderer';
import {
  saveBook,
  listBooks,
  getBookBlob,
  updateBookProgress,
} from './services/bookshelfStore';
import './App.css';

function App() {
  const [stage, setStage] = useState('bookshelf'); // 当前阶段：'bookshelf' | 'loading' | 'reading'
  const [books, setBooks] = useState([]);
  const [activeBookId, setActiveBookId] = useState(null);
  const [readerStartPage, setReaderStartPage] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [shelfLoading, setShelfLoading] = useState(true);
  const {
    pages,
    pageSize,
    totalPages,
    progress,
    error,
    renderPdf,
    setRenderedPdf,
    createCoverFromPdf,
  } = usePdfRenderer();
  const renderedCacheRef = useRef(new Map());

  const loadShelf = useCallback(async () => {
    setShelfLoading(true);
    try {
      const storedBooks = await listBooks();
      setBooks(storedBooks);
    } finally {
      setShelfLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShelf();
  }, [loadShelf]);

  const createUniqueBookName = useCallback((fileName, existingBooks) => {
    const dotIndex = fileName.lastIndexOf('.');
    const hasExt = dotIndex > 0;
    const base = hasExt ? fileName.slice(0, dotIndex) : fileName;
    const ext = hasExt ? fileName.slice(dotIndex) : '';

    const existingNames = new Set(existingBooks.map((book) => book.name));
    if (!existingNames.has(fileName)) return fileName;

    let suffix = 2;
    while (existingNames.has(`${base} (${suffix})${ext}`)) {
      suffix += 1;
    }
    return `${base} (${suffix})${ext}`;
  }, []);

  const handleImportBooks = useCallback(
    async (files) => {
      setStage('loading');
      try {
        const nextBooks = [...books];
        let failedCount = 0;
        for (const file of files) {
          try {
            const { coverDataUrl, pageCount } = await createCoverFromPdf(file);
            const uniqueName = createUniqueBookName(file.name, nextBooks);
            const saved = await saveBook({
              name: uniqueName,
              pdfBlob: file,
              coverDataUrl,
              pageCount,
              recentPage: 0,
            });
            nextBooks.unshift(saved);
          } catch (singleError) {
            failedCount += 1;
            console.error(`导入失败: ${file.name}`, singleError);
          }
        }
        setBooks(nextBooks);
        if (failedCount > 0) {
          alert(`${failedCount} 本书导入失败，请确认文件有效后重试`);
        }
      } catch (importError) {
        console.error('导入书籍失败:', importError);
        alert(importError.message || '导入书籍失败');
      } finally {
        setStage('bookshelf');
      }
    },
    [books, createCoverFromPdf, createUniqueBookName]
  );

  const handleOpenBook = useCallback(async (book) => {
    setActiveBookId(book.id);
    setReaderStartPage(book.recentPage || 0);
    setCurrentPage(book.recentPage || 0);
    const cachedRender = renderedCacheRef.current.get(book.id);
    if (cachedRender) {
      setRenderedPdf(cachedRender);
      setStage('reading');
      return;
    }

    setStage('loading');

    try {
      const pdfBlob = await getBookBlob(book.id);
      if (!pdfBlob) {
        throw new Error('未找到该书籍的 PDF 数据，请重新导入');
      }
      const rendered = await renderPdf(pdfBlob);
      if (rendered) {
        // renderPdf 会清理上一轮 objectURL，因此这里仅保留最新一次可复用缓存。
        renderedCacheRef.current.clear();
        renderedCacheRef.current.set(book.id, rendered);
        setStage('reading');
      } else {
        throw new Error('PDF 解析失败，请稍后重试');
      }
    } catch (openError) {
      console.error('打开书籍失败:', openError);
      alert(openError.message || '打开书籍失败');
      setActiveBookId(null);
      setReaderStartPage(0);
      setStage('bookshelf');
    }
  }, [renderPdf, setRenderedPdf]);

  const syncReadingProgress = useCallback(async (bookId, pageIndex) => {
    if (!bookId) return;
    const updated = await updateBookProgress(bookId, pageIndex);
    if (!updated) return;
    setBooks((prevBooks) =>
      prevBooks.map((book) => (book.id === bookId ? { ...book, ...updated } : book))
    );
  }, []);

  const handlePageChange = useCallback((pageIndex) => {
    setCurrentPage(pageIndex);
  }, []);

  const handleClose = useCallback(async () => {
    const closingBookId = activeBookId;
    const closingPage = currentPage;
    await syncReadingProgress(closingBookId, closingPage);
    setStage('bookshelf');
    setCurrentPage(0);
    setReaderStartPage(0);
    setActiveBookId(null);
  }, [activeBookId, currentPage, syncReadingProgress]);

  // FlipBook 翻页辅助
  const flipNext = useCallback(() => {
    const container = document.querySelector('.flipbook-container');
    container?._flipNext?.();
  }, []);

  const flipPrev = useCallback(() => {
    const container = document.querySelector('.flipbook-container');
    container?._flipPrev?.();
  }, []);

  const flipToPage = useCallback((pageIndex) => {
    const container = document.querySelector('.flipbook-container');
    container?._flipToPage?.(pageIndex);
  }, []);

  return (
    <div className="app">
      {stage === 'bookshelf' && (
        <Bookshelf
          books={books}
          onImport={handleImportBooks}
          onOpenBook={handleOpenBook}
        />
      )}

      {shelfLoading && stage === 'bookshelf' && (
        <div className="loading-screen">
          <div className="loading-content">
            <div className="loading-spinner" />
            <h2 className="loading-title">正在加载书架</h2>
          </div>
        </div>
      )}

      {stage === 'loading' && (
        <div className="loading-screen">
          <div className="loading-content">
            <div className="loading-spinner" />
            <h2 className="loading-title">正在解析 PDF</h2>
            <p className="loading-text">渲染页面中... {progress}%</p>
            <div className="loading-bar-track">
              <div
                className="loading-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            {error && <p className="loading-error">{error}</p>}
          </div>
        </div>
      )}

      {stage === 'reading' && pages.length > 0 && (
        <>
          <div className="reader-container">
            <FlipBook
              pages={pages}
              pageSize={pageSize}
              initialPage={readerStartPage}
              onPageChange={handlePageChange}
            />
          </div>
          <Toolbar
            currentPage={currentPage}
            totalPages={totalPages}
            pages={pages}
            onFlipNext={flipNext}
            onFlipPrev={flipPrev}
            onFlipToPage={flipToPage}
            onClose={handleClose}
          />
        </>
      )}
    </div>
  );
}

export default App;
