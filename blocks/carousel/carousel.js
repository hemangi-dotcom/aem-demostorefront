import { fetchPlaceholders } from '../../scripts/commerce.js';

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');

  slides.forEach((aSlide, idx) => {
    const active = idx === slideIndex;
    aSlide.setAttribute('aria-hidden', active ? 'false' : 'true');
    aSlide.querySelectorAll('a, button').forEach((control) => {
      if (active) control.removeAttribute('tabindex');
      else control.setAttribute('tabindex', '-1');
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

export function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide
    .querySelectorAll('a')
    .forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const buttons = block.querySelectorAll('.carousel-slide-indicator button');
  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  const slideObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) updateActiveSlide(entry.target);
      });
    },
    { threshold: 0.5 },
  );
  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function startAutoplay(block, interval = 6000) {
  const slides = block.querySelectorAll('.carousel-slide');
  if (slides.length < 2) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let timer = 0;
  const play = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => {
      const currentIndex = parseInt(block.dataset.activeSlide || '0', 10);
      showSlide(block, currentIndex + 1);
    }, interval);
  };
  const pause = () => window.clearInterval(timer);

  play();
  block.addEventListener('mouseenter', pause);
  block.addEventListener('mouseleave', play);
  block.addEventListener('focusin', pause);
  block.addEventListener('focusout', (event) => {
    if (!block.contains(event.relatedTarget)) play();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else play();
  });
}

/**
 * Turns a <button> or <a> written as text into a real control.
 * @param {HTMLElement} column
 * @returns {HTMLElement|null}
 */
function createCta(column) {
  const pre = column.querySelector('pre');
  const raw = pre?.textContent?.trim() || '';
  const authoredLink = column.querySelector('a[href]');
  const tag = raw.match(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/i);
  let label = authoredLink?.textContent.trim() || '';
  let href = authoredLink?.getAttribute('href') || '';

  if (tag) {
    label = tag[3].replace(/<[^>]+>/g, '').trim() || label;
    const hrefMatch = tag[2].match(/href=["']([^"']+)["']/i);
    if (hrefMatch) [, href] = hrefMatch;
  }

  if (pre) pre.remove();
  if (authoredLink) authoredLink.remove();
  if (!label) return null;

  const cta = href ? document.createElement('a') : document.createElement('button');
  cta.className = 'banner-cta';
  cta.textContent = label;
  if (href) cta.href = href;
  else cta.type = 'button';
  return cta;
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(
      `carousel-slide-${colIdx === 0 ? 'image' : 'content'}`,
    );
    slide.append(column);
  });

  const content = slide.querySelector('.carousel-slide-content');
  const cta = content && createCta(content);
  if (cta) content.append(cta);

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);
  const rows = Array.from(block.querySelectorAll(':scope > div'));
  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders();

  block.setAttribute('role', 'region');
  block.setAttribute(
    'aria-roledescription',
    placeholders.carousel || 'Carousel',
  );

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  block.prepend(slidesWrapper);

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    const content = slide.querySelector('.carousel-slide-content');
    if (content) {
      const dots = document.createElement('ol');
      dots.classList.add('carousel-slide-indicators');
      dots.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
      rows.forEach((_, dotIndex) => {
        const indicator = document.createElement('li');
        indicator.classList.add('carousel-slide-indicator');
        indicator.dataset.targetSlide = dotIndex;
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', `${placeholders.showSlide || 'Show Slide'} ${dotIndex + 1} ${placeholders.of || 'of'} ${rows.length}`);
        indicator.append(button);
        dots.append(indicator);
      });
      content.append(dots);
    }
    slidesWrapper.append(slide);
    row.remove();
  });

  const firstImage = slidesWrapper.querySelector('.carousel-slide-image img');
  if (firstImage) {
    firstImage.loading = 'eager';
    firstImage.setAttribute('fetchpriority', 'high');
  }

  container.append(slidesWrapper);
  block.prepend(container);
  const firstSlide = slidesWrapper.querySelector('.carousel-slide');
  if (firstSlide) updateActiveSlide(firstSlide);
  bindEvents(block);
  if (!isSingleSlide) startAutoplay(block);

  block.addEventListener('keydown', (event) => {
    const currentIndex = parseInt(block.dataset.activeSlide || '0', 10);
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showSlide(block, currentIndex + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showSlide(block, currentIndex - 1);
    }
  });
}
