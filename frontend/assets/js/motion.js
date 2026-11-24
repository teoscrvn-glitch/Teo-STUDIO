/* motion.js — 1 file, ~70 dòng, không phụ thuộc. Nạp defer ở MỌI trang.
   Làm 4 việc: reveal khi cuộn · đếm số · tạm dừng animation ngoài màn hình · chuyển panel mượt. */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Reveal + stagger: chỉ 1 IntersectionObserver, không scroll listener */
  const revealIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  function initReveal(scope = document) {
    scope.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => {
      // chỉ số trong nhóm anh em → độ trễ nối tiếp
      if (!el.style.getPropertyValue('--i')) {
        const sibs = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
        el.style.setProperty('--i', sibs.indexOf(el));
      }
      reduce ? el.classList.add('is-in') : revealIO.observe(el);
    });
    scope.querySelectorAll('.bar, .draw, .fade-area').forEach((el) => !el.closest('[data-reveal]') && revealIO.observe(el));
  }

  /* 2. Đếm số: <b data-count="1250000" data-format="vnd"> */
  const fmt = (v, kind) => kind === 'vnd' ? Math.round(v).toLocaleString('vi-VN') + 'đ' : Math.round(v).toLocaleString('vi-VN');
  const countIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      countIO.unobserve(e.target);
      const el = e.target, to = Number(el.dataset.count), kind = el.dataset.format;
      if (reduce) { el.textContent = fmt(to, kind); continue; }
      const t0 = performance.now(), dur = 900;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(to * eased, kind);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.4 });
  const initCount = (scope = document) => scope.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el));

  /* 3. Chỉ chạy animation vô hạn khi đang thấy + tab đang mở */
  const liveIO = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('is-live', e.isIntersecting && !document.hidden);
  });
  const initLive = (scope = document) => scope.querySelectorAll('[data-live]').forEach((el) => liveIO.observe(el));
  document.addEventListener('visibilitychange', () => {
    document.querySelectorAll('[data-live]').forEach((el) => { if (document.hidden) el.classList.remove('is-live'); });
    if (!document.hidden) initLive();
  });

  /* 4. Chuyển panel mượt (View Transitions nếu có, không thì fade) */
  window.teoSwitchPanel = (show, hideAll) => {
    const apply = () => { hideAll(); show.hidden = false; show.classList.add('is-entering'); };
    if (!reduce && document.startViewTransition) document.startViewTransition(apply);
    else apply();
    setTimeout(() => show.classList.remove('is-entering'), 400);
  };

  window.teoMotion = { init(scope) { initReveal(scope); initCount(scope); initLive(scope); } };
  document.addEventListener('DOMContentLoaded', () => window.teoMotion.init());
})();
