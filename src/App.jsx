import { useState, useCallback, useRef } from 'react';
import UploadScreen from './components/UploadScreen';
import FlipBook from './components/FlipBook';
import Toolbar from './components/Toolbar';
import { usePdfRenderer } from './hooks/usePdfRenderer';
import './App.css';

function App() {
  const [stage, setStage] = useState('upload'); // 当前阶段：'upload' | 'loading' | 'reading'
  const [currentPage, setCurrentPage] = useState(0);
  const { pages, pageSize, totalPages, loading, progress, error, renderPdf } =
    usePdfRenderer();
  const bookRef = useRef(null);

  const handleFileSelect = useCallback(
    async (file) => {
      setStage('loading');
      await renderPdf(file);
      setStage('reading');
    },
    [renderPdf]
  );

  const handlePageChange = useCallback((pageIndex) => {
    setCurrentPage(pageIndex);
  }, []);

  const handleClose = useCallback(() => {
    setStage('upload');
    setCurrentPage(0);
  }, []);

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
      {stage === 'upload' && <UploadScreen onFileSelect={handleFileSelect} />}

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
              ref={bookRef}
              pages={pages}
              pageSize={pageSize}
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
