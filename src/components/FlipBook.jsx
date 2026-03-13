import { useEffect, useRef, useCallback, useState } from 'react';
import { PageFlip } from 'page-flip';
import './FlipBook.css';

export default function FlipBook({ pages, pageSize, onPageChange }) {
  const bookRef = useRef(null);
  const pageFlipRef = useRef(null);

  // Calculate display dimensions to fit viewport
  const getDisplaySize = useCallback(() => {
    if (!pageSize.width || !pageSize.height) return { width: 500, height: 700 };

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const isFullscreen = !!document.fullscreenElement;

    // Reserve space for toolbar (60px) and padding
    const paddingWidth = isFullscreen ? 20 : 80;
    const paddingHeight = isFullscreen ? 80 : 140;

    const availableWidth = viewportWidth - paddingWidth;
    const availableHeight = viewportHeight - paddingHeight;

    // Calculate single page dimensions maintaining aspect ratio
    const pageAspect = pageSize.width / pageSize.height;

    // We show 2 pages side by side, so each page gets half the available width
    let pageWidth = availableWidth / 2;
    let pageHeight = pageWidth / pageAspect;

    // If too tall, constrain by height
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

    // Clean up previous instance
    if (pageFlipRef.current) {
      pageFlipRef.current.destroy();
      pageFlipRef.current = null;
    }

    // Clear the container
    container.innerHTML = '';

    // Create page elements
    const imageReadyPromises = [];
    pages.forEach((src, index) => {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'page-item';
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

    // Handle resize
    const handleResize = () => {
      const newSize = getDisplaySize();
      container.style.width = `${newSize.width * 2}px`;
      container.style.height = `${newSize.height}px`;

      const spine = container.parentElement?.querySelector('.book-spine');
      if (spine) {
        spine.style.height = `${newSize.height}px`;
      }

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
        maxShadowOpacity: 0.5,
        mobileScrollSupport: false,
        clickEventForward: false,
        usePortrait: false,
        startZIndex: 0,
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

  // Expose methods via imperative handle pattern
  const flipNext = useCallback(() => {
    pageFlipRef.current?.flipNext();
  }, []);

  const flipPrev = useCallback(() => {
    pageFlipRef.current?.flipPrev();
  }, []);

  const flipToPage = useCallback((pageIndex) => {
    pageFlipRef.current?.flip(pageIndex);
  }, []);

  // Attach methods to ref for parent access
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
      {/* Book spine shadow */}
      <div
        className="book-spine"
        style={{ height: size.height }}
      />

      {/* Book pages container */}
      <div
        className="flipbook-container"
        ref={bookRef}
        style={{
          width: size.width * 2,
          height: size.height,
        }}
      />

      {/* Navigation arrows */}
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
