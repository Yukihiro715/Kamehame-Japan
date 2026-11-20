import { useEffect, useRef } from 'react';

/** Progressive enhancement: content is visible without the observer or with reduced motion. */
export function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | undefined;
    const configure = () => {
      observer?.disconnect();
      root.classList.remove('sp-motion-ready');
      if (preference.matches) return;
      const nodes = root.querySelectorAll<HTMLElement>('[data-reveal]');
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      nodes.forEach(node => {
        if (node.getBoundingClientRect().top < window.innerHeight) node.classList.add('is-revealed');
        else observer?.observe(node);
      });
      root.classList.add('sp-motion-ready');
    };
    configure();
    preference.addEventListener('change', configure);
    return () => { observer?.disconnect(); preference.removeEventListener('change', configure); root.classList.remove('sp-motion-ready'); };
  }, []);
  return ref;
}
