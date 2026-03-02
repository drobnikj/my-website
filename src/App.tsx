import { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';

const TravelsPage = lazy(() => import('./pages/TravelsPage'));

const projects = [
  {
    name: 'Apify',
    icon: '🕷️',
    description: 'Web scraping and automation platform. Building tools that help businesses extract data from the web at scale.',
    url: 'https://apify.com',
  },
  {
    name: 'Realitní pes',
    icon: '🐕',
    description: 'Czech real estate watchdog. Monitors property listings and notifies users about new offers matching their criteria.',
    url: 'https://realitni-pes.cz',
  },
];

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
  return (
    <>
      <div className="app">
        <nav className="nav">
          <Link to="/" className="nav-logo">
            <span className="nav-logo-bracket">{'{'}</span>drobnikj<span className="nav-logo-bracket">{'}'}</span>
          </Link>
          <div className="nav-links">
            <a href="/#about">About</a>
            <a href="/#projects">Projects</a>
            <Link to="/travels">Travels</Link>
            <a href="/#contact">Contact</a>
            <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </nav>
      </div>
      {children}
      <div className="app">
        <footer className="footer">
          <p>© {new Date().getFullYear()} Jakub Drobník. Built with React + TypeScript.</p>
        </footer>
      </div>
    </>
  );
}

function HomePage() {
  return (
    <div className="app">
      <section className="hero">
        <HeroParticles />
        <div className="hero-content">
          <p className="hero-greeting">
            <span className="hero-greeting-code">{'>'}</span> Hi, I'm
          </p>
          <h1 className="hero-name">Jakub Drobník</h1>
          <h2 className="hero-title">Software Engineer @ Apify</h2>
          <p className="hero-desc">
            Building web scraping tools, integrations, and developer platforms.
            Passionate about clean code, open source, and exploring the world with a drone.
          </p>
          <Link to="/travels" className="hero-cta">See my travels →</Link>
        </div>
      </section>

      <section id="about" className="section fade-in">
        <h2 className="section-title">About</h2>
        <div className="about-content">
          <p>
            I'm a software engineer at <a href="https://apify.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Apify</a>,
            where I work on integrations, platform features, and developer tooling.
            I enjoy building things that make developers' lives easier.
          </p>
          <p>
            When I'm not coding, you'll find me traveling with my drone, capturing aerial
            perspectives of the places I visit. I've been to 13 regions across 4 continents
            — from the glaciers of Iceland to the rainforests of Costa Rica.
          </p>
        </div>
      </section>

      <section id="projects" className="section fade-in">
        <h2 className="section-title">Projects</h2>
        <div className="projects-grid">
          {projects.map((project) => (
            <a
              key={project.name}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="project-card"
            >
              <span className="project-icon">{project.icon}</span>
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
          <span className="travels-teaser-emoji">🌍</span>
          <h3 className="travels-teaser-title">I also travel with a drone</h3>
          <p className="travels-teaser-desc">
            13 destinations, 4 continents, 70 drone photos. Check out my interactive travel map.
          </p>
          <Link to="/travels" className="travels-teaser-cta">
            Explore my travels →
          </Link>
        </div>
      </section>

      <section id="contact" className="section fade-in">
        <h2 className="section-title">Contact</h2>
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

function App() {
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

export default App;
