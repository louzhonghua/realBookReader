import { useState, useEffect, useRef } from 'react';

export default function LazyThumbnail({ src, index, currentPage, onClick }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`thumbnail-item ${index === currentPage ? 'active' : ''}`}
      onClick={onClick}
    >
      {isVisible && <img src={src} alt={`Page ${index + 1}`} loading="lazy" />}
      <span className="thumbnail-label">{index + 1}</span>
    </div>
  );
}
