import { useState, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// pdfjs-dist@5 在部分运行时会依赖提案期 Map/WeakMap 扩展方法，这里做兼容兜底。
function installPdfJsCompatPolyfills() {
  if (typeof Map !== 'undefined' && !Map.prototype.getOrInsertComputed) {
    Object.defineProperty(Map.prototype, 'getOrInsertComputed', {
      value(key, compute) {
        if (this.has(key)) return this.get(key);
        const value = compute(key);
        this.set(key, value);
        return value;
      },
      configurable: true,
      writable: true,
    });
  }

  if (typeof Map !== 'undefined' && !Map.prototype.getOrInsert) {
    Object.defineProperty(Map.prototype, 'getOrInsert', {
      value(key, value) {
        if (this.has(key)) return this.get(key);
        this.set(key, value);
        return value;
      },
      configurable: true,
      writable: true,
    });
  }

  if (typeof WeakMap !== 'undefined' && !WeakMap.prototype.getOrInsertComputed) {
    Object.defineProperty(WeakMap.prototype, 'getOrInsertComputed', {
      value(key, compute) {
        if (this.has(key)) return this.get(key);
        const value = compute(key);
        this.set(key, value);
        return value;
      },
      configurable: true,
      writable: true,
    });
  }
}

installPdfJsCompatPolyfills();

// 设置 worker 源
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * 将 PDF 渲染为页面图片数组的 Hook
 * @returns {{ pages, pageSize, totalPages, loading, progress, error, renderPdf }}
 */
export function usePdfRenderer() {
  const [pages, setPages] = useState([]);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const pageUrlsRef = useRef([]);

  const cleanupPageUrls = useCallback(() => {
    pageUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    pageUrlsRef.current = [];
  }, []);

  const renderPdf = useCallback(async (pdfSource) => {
    setLoading(true);
    setProgress(0);
    setError(null);
    cleanupPageUrls();
    setPages([]);

    try {
      const arrayBuffer = await pdfSource.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const total = pdf.numPages;
      setTotalPages(total);

      const renderedPages = [];
      const scale = 2; // 高清渲染
      let firstPageSize = { width: 0, height: 0 };

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        // 保存原始页面尺寸（取第一页）
        if (i === 1) {
          firstPageSize = {
            width: viewport.width / scale,
            height: viewport.height / scale,
          };
          setPageSize(firstPageSize);
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // 绘制白色背景，防止生成带透明通道的PNG图片
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        // 将 canvas 转为 blob URL 以提升内存效率 (此处可以直接用 jpeg 进一步去透明通道，并缩小体积)
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', 0.9)
        );
        const url = URL.createObjectURL(blob);
        renderedPages.push(url);
        pageUrlsRef.current.push(url);

        setProgress(Math.round((i / total) * 100));
      }

      const renderResult = {
        pages: renderedPages,
        pageSize: firstPageSize,
        totalPages: total,
      };
      setPages(renderedPages);
      return renderResult;
    } catch (err) {
      console.error('PDF render error:', err);
      setError(err.message || '无法解析 PDF 文件');
      return null;
    } finally {
      setLoading(false);
    }
  }, [cleanupPageUrls]);

  const setRenderedPdf = useCallback((rendered) => {
    if (!rendered) return;
    setError(null);
    setLoading(false);
    setProgress(100);
    setPages(rendered.pages || []);
    setPageSize(rendered.pageSize || { width: 0, height: 0 });
    setTotalPages(rendered.totalPages || 0);
  }, []);

  const createCoverFromPdf = useCallback(async (pdfSource) => {
    const arrayBuffer = await pdfSource.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    try {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.4 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      return {
        pageCount: pdf.numPages,
        coverDataUrl: canvas.toDataURL('image/jpeg', 0.82),
      };
    } catch (error) {
      console.warn('封面渲染失败，已回退为无封面卡片:', error);
      return {
        pageCount: pdf.numPages,
        coverDataUrl: '',
      };
    }
  }, []);

  return {
    pages,
    pageSize,
    totalPages,
    loading,
    progress,
    error,
    renderPdf,
    setRenderedPdf,
    createCoverFromPdf,
    cleanupPageUrls,
  };
}
