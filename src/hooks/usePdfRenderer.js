import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

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
      const scale = 2; // 高清渲染

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        // 保存原始页面尺寸（取第一页）
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
