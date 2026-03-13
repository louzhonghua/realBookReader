import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Hook to render a PDF file into an array of page images.
 * @returns {{ pages, pageSize, totalPages, loading, progress, error, renderPdf }}
 */
export function usePdfRenderer() {
  const [pages, setPages] = useState([]);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const renderPdf = useCallback(async (file) => {
    setLoading(true);
    setProgress(0);
    setError(null);
    setPages([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const total = pdf.numPages;
      setTotalPages(total);

      const renderedPages = [];
      const scale = 2; // High-res rendering

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        // Store the original page size (from the first page)
        if (i === 1) {
          setPageSize({
            width: viewport.width / scale,
            height: viewport.height / scale,
          });
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        // Convert canvas to blob URL for better memory efficiency
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/png')
        );
        const url = URL.createObjectURL(blob);
        renderedPages.push(url);

        setProgress(Math.round((i / total) * 100));
      }

      setPages(renderedPages);
    } catch (err) {
      console.error('PDF render error:', err);
      setError(err.message || '无法解析 PDF 文件');
    } finally {
      setLoading(false);
    }
  }, []);

  return { pages, pageSize, totalPages, loading, progress, error, renderPdf };
}
