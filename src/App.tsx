import { lazy, Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const TravelsPage = lazy(() => import('./pages/TravelsPage'));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'dark';
  });

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  return { theme, toggle };
}

function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    const count = 60;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = accent;
            ctx.globalAlpha = (1 - dist / 120) * 0.15;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-particles" />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Layout({ children, theme, toggle }: { children: React.ReactNode; theme: string; toggle: () => void }) {
  const { language, setLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="app">
        <nav className="nav">
          <Link to="/" className="nav-logo">
            <span className="nav-logo-bracket">{'{'}</span>drobnikj<span className="nav-logo-bracket">{'}'}</span>
          </Link>
          <button 
            className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <a href="/#about" onClick={() => setMenuOpen(false)}>{t('nav.about')}</a>
            <a href="/#projects" onClick={() => setMenuOpen(false)}>{t('nav.projects')}</a>
            <Link to="/travels" onClick={() => setMenuOpen(false)}>{t('nav.travels')}</Link>
            <a href="/#contact" onClick={() => setMenuOpen(false)}>{t('nav.contact')}</a>
            <button 
              className="lang-toggle" 
              onClick={() => setLanguage(language === 'en' ? 'cs' : 'en')}
              aria-label="Toggle language"
            >
              {language === 'en' ? 'CS' : 'EN'}
            </button>
            <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </nav>
      </div>
      {children}
      <div className="app">
        <footer className="footer">
          <p>© {new Date().getFullYear()} Jakub Drobník. {t('footer.text')}</p>
        </footer>
      </div>
    </>
  );
}

function HomePage() {
  const { t } = useLanguage();

  const projects = useMemo(() => [
    {
      name: t('projects.apify.name'),
      logo: `${import.meta.env.BASE_URL}logos/apify-icon.svg`,
      description: t('projects.apify.description'),
      url: 'https://apify.com',
    },
    {
      name: t('projects.realitni-pes.name'),
      logo: `${import.meta.env.BASE_URL}logos/realitni-pes.svg`,
      description: t('projects.realitni-pes.description'),
      url: 'https://realitni-pes.cz',
    },
  ], [t]);

  return (
    <div className="app">
      <section className="hero">
        <HeroParticles />
        <div className="hero-content">
          <p className="hero-greeting">
            <span className="hero-greeting-code">{'>'}</span> {t('hero.greeting')}
          </p>
          <h1 className="hero-name">{t('hero.name')}</h1>
          <h2 className="hero-title">{t('hero.title')}</h2>
          <p className="hero-desc">
            {t('hero.description')}
          </p>
          <Link to="/travels" className="hero-cta">{t('hero.cta')}</Link>
        </div>
      </section>

      <section id="about" className="section fade-in">
        <h2 className="section-title">{t('about.title')}</h2>
        <div className="about-content">
          <p>
            {t('about.p1.before')}
            <a href="https://apify.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Apify</a>
            {t('about.p1.after')}
          </p>
          <p>
            {t('about.p2')}
          </p>
        </div>
      </section>

      <section id="projects" className="section fade-in">
        <h2 className="section-title">{t('projects.title')}</h2>
        <div className="projects-grid">
          {projects.map((project) => (
            <a
              key={project.name}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="project-card"
            >
              <img src={project.logo} alt={`${project.name} logo`} className="project-logo" />
              <div className="project-info">
                <span className="project-name">{project.name}</span>
                <p className="project-desc">{project.description}</p>
              </div>
              <span className="project-link">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="section fade-in">
        <div className="travels-teaser">
          <span className="travels-teaser-emoji">{t('travels-teaser.emoji')}</span>
          <h3 className="travels-teaser-title">{t('travels-teaser.title')}</h3>
          <p className="travels-teaser-desc">
            {t('travels-teaser.description')}
          </p>
          <Link to="/travels" className="travels-teaser-cta">
            {t('travels-teaser.cta')}
          </Link>
        </div>
      </section>

      <section id="contact" className="section fade-in">
        <h2 className="section-title">{t('contact.title')}</h2>
        <div className="contact-links">
          <a
            href="https://github.com/drobnikj"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card"
          >
            <span className="contact-icon">⌨️</span>
            <span>GitHub</span>
          </a>
          <a
            href="https://linkedin.com/in/jakubdrobnik"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card"
          >
            <span className="contact-icon">💼</span>
            <span>LinkedIn</span>
          </a>
          <a
            href="https://instagram.com/jakub_drobnik"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card"
          >
            <span className="contact-icon">📸</span>
            <span>Instagram</span>
          </a>
        </div>
      </section>
    </div>
  );
}

function AppContent() {
  const { theme, toggle } = useTheme();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout theme={theme} toggle={toggle}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/travels"
            element={
              <Suspense fallback={<div className="app"><div className="travel-map-loading">Loading…</div></div>}>
                <TravelsPage />
              </Suspense>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
