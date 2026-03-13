import { useRef, useCallback, useState } from 'react';
import './UploadScreen.css';

export default function UploadScreen({ onFileSelect }) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    (file) => {
      if (file && file.type === 'application/pdf') {
        onFileSelect(file);
      } else {
        alert('请选择 PDF 文件');
      }
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="upload-screen">
      {/* Animated background */}
      <div className="upload-bg">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="upload-content">
        <div className="upload-header">
          <div className="upload-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path
                d="M8 6C8 4.89543 8.89543 4 10 4H30L40 14V42C40 43.1046 39.1046 44 38 44H10C8.89543 44 8 43.1046 8 42V6Z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path d="M30 4V14H40" stroke="currentColor" strokeWidth="2" />
              <path
                d="M24 22V34M24 22L18 28M24 22L30 28"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="upload-title">Real Book Reader</h1>
          <p className="upload-subtitle">导入 PDF，享受仿真翻页的沉浸式阅读体验</p>
        </div>

        <div
          className={`upload-dropzone ${isDragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className="dropzone-inner">
            <div className="dropzone-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="dropzone-text">
              拖拽 PDF 文件到此处，或<span className="dropzone-link">点击选择</span>
            </p>
            <p className="dropzone-hint">支持 .pdf 格式</p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleInputChange}
            className="upload-input"
          />
        </div>

        <div className="upload-features">
          <div className="feature">
            <span className="feature-icon">📖</span>
            <span>仿真翻页</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🖱️</span>
            <span>拖拽翻页</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📱</span>
            <span>触摸支持</span>
          </div>
        </div>
      </div>
    </div>
  );
}
