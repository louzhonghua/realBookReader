import { useEffect, useRef, useCallback, useState } from 'react';
import { PageFlip } from 'page-flip';
import './FlipBook.css';

export default function FlipBook({ pages, pageSize, onPageChange }) {
  const bookRef = useRef(null);
  const pageFlipRef = useRef(null);

  // 根据视口计算展示尺寸
  const getDisplaySize = useCallback(() => {
    if (!pageSize.width || !pageSize.height) return { width: 500, height: 700 };

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const isFullscreen = !!document.fullscreenElement;

    // 为工具栏与留白预留空间
    const paddingWidth = isFullscreen ? 20 : 80;
    const paddingHeight = isFullscreen ? 80 : 140;

    const availableWidth = viewportWidth - paddingWidth;
    const availableHeight = viewportHeight - paddingHeight;

    // 按比例计算单页尺寸
    const pageAspect = pageSize.width / pageSize.height;

    // 双页并排展示，每页使用一半可用宽度
    let pageWidth = availableWidth / 2;
    let pageHeight = pageWidth / pageAspect;

    // 若高度超出，则按高度约束
    if (pageHeight > availableHeight) {
      pageHeight = availableHeight;
      pageWidth = pageHeight * pageAspect;
    }

    return {
      width: Math.floor(pageWidth),
      height: Math.floor(pageHeight),
    };
  }, [pageSize]);

  useEffect(() => {
    if (!bookRef.current || pages.length === 0) return;

    const container = bookRef.current;
    const size = getDisplaySize();

    // 清理旧实例
    if (pageFlipRef.current) {
      pageFlipRef.current.destroy();
      pageFlipRef.current = null;
    }

    // 清空容器
    container.innerHTML = '';

    // 创建页面元素
    const imageReadyPromises = [];
    pages.forEach((src, index) => {
      const pageDiv = document.createElement('div');
      pageDiv.className = `page-item ${index % 2 === 0 ? 'page-right' : 'page-left'}`;
      pageDiv.setAttribute('data-density', index === 0 || index === pages.length - 1 ? 'hard' : 'soft');

      const img = document.createElement('img');
      img.src = src;
      img.alt = `Page ${index + 1}`;
      img.draggable = false;

      if (typeof img.decode === 'function') {
        imageReadyPromises.push(img.decode().catch(() => null));
      } else {
        imageReadyPromises.push(
          new Promise((resolve) => {
            img.onload = () => resolve(null);
            img.onerror = () => resolve(null);
          })
        );
      }

      pageDiv.appendChild(img);
      container.appendChild(pageDiv);
    });

    // 处理尺寸变化
    const handleResize = () => {
      const newSize = getDisplaySize();
      container.style.width = `${newSize.width * 2}px`;
      container.style.height = `${newSize.height}px`;

      pageFlipRef.current?.updateFromHtml(container.querySelectorAll('.page-item'));
      
      if (typeof pageFlipRef.current?.update === 'function') {
        pageFlipRef.current.update();
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleResize);

    let cancelled = false;
    (async () => {
      await Promise.allSettled(imageReadyPromises);
      if (cancelled || !container.isConnected) return;

      const pageFlip = new PageFlip(container, {
        width: size.width,
        height: size.height,
        size: 'stretch',
        minWidth: 10,
        maxWidth: 5000,
        minHeight: 10,
        maxHeight: 5000,
        showCover: true,
        flippingTime: 800,
        useMouseEvents: true,
        swipeDistance: 30,
        showPageCorners: true,
        maxShadowOpacity: 0.3,
        mobileScrollSupport: false,
        clickEventForward: false,
        usePortrait: false,
        startZIndex: 10,
        autoSize: true,
        drawShadow: true,
        startPage: 0,
      });

      pageFlip.loadFromHTML(container.querySelectorAll('.page-item'));

      pageFlip.on('flip', (e) => {
        onPageChange?.(e.data);
      });

      pageFlipRef.current = pageFlip;
    })();

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleResize);
      if (pageFlipRef.current) {
        pageFlipRef.current.destroy();
        pageFlipRef.current = null;
      }
    };
  }, [pages, pageSize, getDisplaySize, onPageChange]);

  // 暴露翻页方法供外部调用
  const flipNext = useCallback(() => {
    pageFlipRef.current?.flipNext();
  }, []);

  const flipPrev = useCallback(() => {
    pageFlipRef.current?.flipPrev();
  }, []);

  const flipToPage = useCallback((pageIndex) => {
    pageFlipRef.current?.flip(pageIndex);
  }, []);

  // 将方法挂载到容器上
  useEffect(() => {
    if (bookRef.current) {
      bookRef.current._flipNext = flipNext;
      bookRef.current._flipPrev = flipPrev;
      bookRef.current._flipToPage = flipToPage;
    }
  }, [flipNext, flipPrev, flipToPage]);

  const size = getDisplaySize();

  return (
    <div className="flipbook-wrapper">
      {/* 书页容器 */}
      <div
        className="flipbook-container"
        ref={bookRef}
        style={{
          width: size.width * 2,
          height: size.height,
        }}
      />

      {/* 翻页箭头 */}
      <button
        className="nav-arrow nav-arrow-left"
        onClick={flipPrev}
        aria-label="上一页"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        className="nav-arrow nav-arrow-right"
        onClick={flipNext}
        aria-label="下一页"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
