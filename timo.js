// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});
document.addEventListener('DOMContentLoaded', function () {
  const heroSlides = document.querySelectorAll('.hero-slide');
  if (heroSlides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let activeHeroSlide = Array.from(heroSlides).findIndex(slide => slide.classList.contains('is-active'));
    const heroSlideLoads = new WeakMap();

    function loadHeroSlide(slide) {
      if (heroSlideLoads.has(slide)) {
        return heroSlideLoads.get(slide);
      }

      if (!slide.dataset.src) {
        return Promise.resolve(slide.complete && slide.naturalWidth > 0);
      }

      const source = slide.dataset.src;
      delete slide.dataset.src;
      const loadPromise = new Promise(resolve => {
        slide.addEventListener('load', () => resolve(true), { once: true });
        slide.addEventListener('error', () => {
          console.error(`Hero image failed to load: ${slide.src}`);
          resolve(false);
        }, { once: true });
        slide.src = source;
      });
      heroSlideLoads.set(slide, loadPromise);
      return loadPromise;
    }

    async function advanceHeroSlide() {
      for (let offset = 1; offset < heroSlides.length; offset += 1) {
        const nextIndex = (activeHeroSlide + offset) % heroSlides.length;
        if (await loadHeroSlide(heroSlides[nextIndex])) {
          heroSlides[activeHeroSlide].classList.remove('is-active');
          activeHeroSlide = nextIndex;
          heroSlides[activeHeroSlide].classList.add('is-active');
          break;
        }
      }
      window.setTimeout(advanceHeroSlide, 6500);
    }

    const firstNextSlide = heroSlides[(activeHeroSlide + 1) % heroSlides.length];
    loadHeroSlide(firstNextSlide);
    window.setTimeout(advanceHeroSlide, 6500);
  }

  const slides = document.querySelector('.slides');
  const images = document.querySelectorAll('.slides img');
  let currentIndex = 0;
  const total = images.length;

  function showSlide(index) {
    slides.style.transform = `translateX(-${index * 100}%)`;
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % total;
    showSlide(currentIndex);
  }

  setInterval(nextSlide, 3000); // Change slide every 3 seconds
  showSlide(currentIndex);
});
