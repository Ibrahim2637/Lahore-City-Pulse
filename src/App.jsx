import React, { useState, useEffect, useRef } from 'react';
import {
  Menu, X, Sun, Moon, ChevronRight, ArrowRight, ArrowLeft,
  ShieldAlert, CloudSun, CloudRain, BookOpen, HeartPulse, Activity,
  Thermometer, Droplets, Wind, SunDim, Coins, DollarSign,
  TrendingUp, TrendingDown, Flame, Users, LineChart, Wallet,
  Shield, Smartphone, Power, HelpCircle
} from 'lucide-react';
import { fetchCivicData } from './utils/sheetFetcher';
import CanvasRain from './components/CanvasRain';
import CanvasStethoscope from './components/CanvasStethoscope';
import ChatBot from './components/ChatBot';

// Icon lookup map for dynamic metric icons (defined outside App to avoid per-render recreation)
const iconMap = {
  Menu, X, Sun, Moon, ChevronRight, ArrowRight, ArrowLeft,
  ShieldAlert, CloudSun, CloudRain, BookOpen, HeartPulse, Activity,
  Thermometer, Droplets, Wind, SunDim, Coins, DollarSign,
  TrendingUp, TrendingDown, Flame, Users, LineChart, Wallet,
  Shield, Smartphone, Power, HelpCircle
};

const MetricIcon = ({ name, size = 20, className = "" }) => {
  const IconComp = iconMap[name] || HelpCircle;
  return <IconComp size={size} className={className} />;
};

export default function App() {
  const [civicData, setCivicData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize theme based on session storage or system preference
  const [theme, setTheme] = useState(() => {
    const sessionTheme = sessionStorage.getItem('lahore-theme');
    if (sessionTheme) return sessionTheme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });
  
  // Navigation states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState(null); // which topic's subtopics are shown in menu
  const [activeCategory, setActiveCategory] = useState(null); // open detail drawer for this category
  const [activeSubtopic, setActiveSubtopic] = useState(null); // subtopic to scroll to
  
  // Parallax scroll state for landing page
  const [scrollY, setScrollY] = useState(0);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  // Scroll progress within active category drawer
  const [drawerScrollProgress, setDrawerScrollProgress] = useState(0);
  const drawerBodyRef = useRef(null);

  // Clear legacy localStorage theme that might block system preference detection
  useEffect(() => {
    localStorage.removeItem('lahore-theme');
  }, []);

  // Sync theme changes to HTML attribute in real-time
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load civic data on mount and poll for updates every 20 seconds in the background
  useEffect(() => {
    async function loadData() {
      const data = await fetchCivicData();
      setCivicData(data);
      setLoading(false);
    }
    loadData();

    const interval = setInterval(loadData, 20000); // 20-second polling interval
    return () => clearInterval(interval);
  }, []);

  // Parallax and Header scroll effect (throttled with rAF)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          setHeaderScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Block main body scrolling when detailed drawer is open
  useEffect(() => {
    if (activeCategory) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [activeCategory]);

  // Close drawers/sidebar on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeCategory) setActiveCategory(null);
        else if (isSidebarOpen) setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCategory, isSidebarOpen]);

  // Scroll entrance observer animation
  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // trigger once
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [loading]);

  // Scroll to active subtopic when drawer opens
  useEffect(() => {
    if (activeCategory && activeSubtopic) {
      const timer = setTimeout(() => {
        const element = document.getElementById(activeSubtopic);
        if (element && drawerBodyRef.current) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeCategory, activeSubtopic]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    sessionStorage.setItem('lahore-theme', nextTheme);
  };

  const handleTopicClick = (catKey) => {
    setActiveCategory(catKey);
    setActiveSubtopic(null); // reset subtopic scroll
    setIsSidebarOpen(false);
  };

  const handleSubtopicClick = (catKey, subtopicId) => {
    setActiveCategory(catKey);
    setActiveSubtopic(subtopicId);
    setIsSidebarOpen(false);
  };

  const handleDrawerScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const progress = scrollTop / (scrollHeight - clientHeight);
    setDrawerScrollProgress(isNaN(progress) ? 0 : progress);
  };

  // Render loading page with animated skeleton placeholders
  if (loading) {
    return (
      <div className="app-container">
        {/* Active Header during loading for premium experience */}
        <header className="app-header">
          <div className="header-left">
            <button className="menu-trigger" aria-label="Open Sidebar Navigation Menu" disabled>
              <Menu size={18} />
            </button>
            <div className="header-logo-pill">
              <span>Lahore</span> Nervous System
            </div>
          </div>
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme Day/Night">
            <div className="theme-icon-container">
              <Sun 
                className="theme-icon sun-icon" 
                size={22} 
                style={{
                  transform: theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
                  opacity: theme === 'light' ? 1 : 0
                }} 
              />
              <Moon 
                className="theme-icon moon-icon" 
                size={22} 
                style={{
                  transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)',
                  opacity: theme === 'dark' ? 1 : 0
                }} 
              />
            </div>
          </button>
        </header>

        {/* Skeleton Shimmer Layout */}
        <div className="skeleton-page">
          <div className="skeleton-hero">
            <div className="skeleton-line skeleton-pill-placeholder"></div>
            <div className="skeleton-line skeleton-title-placeholder"></div>
            <div className="skeleton-line skeleton-title-placeholder-short"></div>
            <div className="skeleton-line skeleton-desc-placeholder"></div>
            <div className="skeleton-buttons">
              <div className="skeleton-btn"></div>
              <div className="skeleton-btn"></div>
            </div>
          </div>
          <div className="skeleton-ticker"></div>
          <div className="skeleton-section">
            <div className="skeleton-section-title"></div>
            <div className="skeleton-grid-pulse">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton-card-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Subtopic definitions to map menu items to elements
  const subtopicMapping = {
    environment: [
      { id: "aqi-section", label: "Air Quality (AQI)", icon: "ShieldAlert" },
      { id: "weather-section", label: "Weather Conditions", icon: "CloudSun" },
      { id: "rain-section", label: "Rain & Forecast (3D)", icon: "CloudRain" }
    ],
    fuel: [
      { id: "petrol-section", label: "Petroleum Rates", icon: "Flame" },
      { id: "lpg-section", label: "Gas & CNG Rates", icon: "Flame" }
    ],
    markets: [
      { id: "gold-section", label: "Gold & Silver Bullion", icon: "Coins" },
      { id: "currency-section", label: "Currency (USD/PKR)", icon: "DollarSign" },
      { id: "crypto-section", label: "Cryptocurrencies", icon: "TrendingUp" }
    ],
    economy: [
      { id: "gdp-section", label: "GDP & Unemployment", icon: "BarChart3" },
      { id: "income-section", label: "Household Income", icon: "Percent" }
    ],
    demographics: [
      { id: "education-section", label: "Literacy & Schooling", icon: "BookOpen" },
      { id: "health-section", label: "Immunization & Health (3D)", icon: "HeartPulse" },
      { id: "utilities-section", label: "Gas & Electricity", icon: "Activity" }
    ]
  };

  const getMetricIconName = (id) => {
    if (id.includes("aqi")) return "ShieldAlert";
    if (id.includes("temp")) return "Thermometer";
    if (id.includes("weather")) return "CloudSun";
    if (id.includes("humidity")) return "Droplets";
    if (id.includes("wind")) return "Wind";
    if (id.includes("rain") || id.includes("precipitation")) return "CloudRain";
    if (id.includes("sunrise") || id.includes("sunset")) return "SunDim";
    if (id.includes("uv")) return "Sun";
    if (id.includes("gold") || id.includes("silver")) return "Coins";
    if (id.includes("dollar") || id.includes("usd") || id.includes("pkr")) return "DollarSign";
    if (id.includes("bitcoin") || id.includes("ethereum")) return "TrendingUp";
    if (id.includes("petrol") || id.includes("diesel") || id.includes("octane") || id.includes("kerosene") || id.includes("lpg") || id.includes("cng")) return "Flame";
    if (id.includes("population")) return "Users";
    if (id.includes("gdp") || id.includes("manufacturing")) return "LineChart";
    if (id.includes("unemployment")) return "TrendingDown";
    if (id.includes("wage") || id.includes("income") || id.includes("consumption")) return "Wallet";
    if (id.includes("school") || id.includes("literacy")) return "BookOpen";
    if (id.includes("immunized")) return "Shield";
    if (id.includes("smartphone") || id.includes("internet")) return "Smartphone";
    if (id.includes("gas") || id.includes("electricity")) return "Power";
    return "HelpCircle";
  };

  const getMetricCardColor = (catKey) => {
    if (catKey === "environment") return "var(--lahore-green)";
    if (catKey === "fuel") return "var(--lahore-terracotta)";
    if (catKey === "markets") return "var(--lahore-gold)";
    if (catKey === "economy") return "var(--lahore-sky)";
    return "var(--lahore-lime)";
  };

  const getRawValue = (valStr) => {
    if (!valStr) return "";
    return valStr.split(/[°\s]/)[0];
  };

  const getTickerText = () => {
    if (!civicData) return "";
    const items = [];
    Object.keys(civicData.categories).forEach(catKey => {
      civicData.categories[catKey].items.forEach(item => {
        if (item.value && item.value !== "N/A") {
          items.push(`${item.label}: ${item.value}`);
        }
      });
    });
    return items.join("   •   ");
  };

  const getPulseCardsData = () => {
    if (!civicData) return [];
    const envItems = civicData.categories.environment.items;
    const marketItems = civicData.categories.markets.items;
    const fuelItems = civicData.categories.fuel.items;

    const calculateTrend = (id, currentValueStr) => {
      const cleanStr = currentValueStr.replace(/,/g, '');
      const current = parseFloat(cleanStr);
      if (isNaN(current)) return { symbol: '—', direction: 'neutral' };

      const baselines = {
        aqi: 140,
        temperature_c: 28,
        petrol_per_litre: 260,
        gold_24K_per_tola: 240000,
        dollar_rate_pkr: 278,
        bitcoin_usd: 60000
      };

      const base = baselines[id];
      if (base === undefined) return { symbol: '—', direction: 'neutral' };

      if (current > base) {
        const isNegative = ['aqi', 'petrol_per_litre', 'dollar_rate_pkr'].includes(id);
        return { symbol: '▲', direction: isNegative ? 'down' : 'up' };
      } else if (current < base) {
        const isNegative = ['aqi', 'petrol_per_litre', 'dollar_rate_pkr'].includes(id);
        return { symbol: '▼', direction: isNegative ? 'up' : 'down' };
      }
      return { symbol: '—', direction: 'neutral' };
    };

    return [
      {
        title: "AIR QUALITY INDEX",
        value: envItems.find(i => i.id === "aqi")?.value || "140",
        unit: "",
        category: "Air Quality (Lahore)",
        date: civicData.lastUpdated,
        color: "var(--lahore-terracotta)",
        trend: calculateTrend("aqi", envItems.find(i => i.id === "aqi")?.value || "140")
      },
      {
        title: "TEMPERATURE",
        value: getRawValue(envItems.find(i => i.id === "temperature_c")?.value || "26.2"),
        unit: "°C",
        category: "Weather (Lahore)",
        date: civicData.lastUpdated,
        color: "var(--lahore-sky)",
        trend: calculateTrend("temperature_c", envItems.find(i => i.id === "temperature_c")?.value || "26.2")
      },
      {
        title: "PETROL",
        value: getRawValue(fuelItems.find(i => i.id === "petrol_per_litre")?.value || "325"),
        unit: "PKR/L",
        category: "Fuel Prices",
        date: civicData.lastUpdated,
        color: "var(--lahore-terracotta)",
        trend: calculateTrend("petrol_per_litre", fuelItems.find(i => i.id === "petrol_per_litre")?.value || "325")
      },
      {
        title: "GOLD 24K",
        value: getRawValue(marketItems.find(i => i.id === "gold_24K_per_tola")?.value || "450,150"),
        unit: "PKR/tola",
        category: "Gold & Rates",
        date: civicData.lastUpdated,
        color: "var(--lahore-gold)",
        trend: calculateTrend("gold_24K_per_tola", marketItems.find(i => i.id === "gold_24K_per_tola")?.value || "450150")
      },
      {
        title: "US DOLLAR",
        value: getRawValue(marketItems.find(i => i.id === "dollar_rate_pkr")?.value || "279"),
        unit: "PKR",
        category: "Gold & Rates",
        date: civicData.lastUpdated,
        color: "var(--lahore-green)",
        trend: calculateTrend("dollar_rate_pkr", marketItems.find(i => i.id === "dollar_rate_pkr")?.value || "279")
      },
      {
        title: "BITCOIN",
        value: getRawValue(marketItems.find(i => i.id === "bitcoin_usd")?.value || "63,228.85"),
        unit: "USD",
        category: "Crypto",
        date: civicData.lastUpdated,
        color: "#9C27B0",
        trend: calculateTrend("bitcoin_usd", marketItems.find(i => i.id === "bitcoin_usd")?.value || "63228")
      }
    ];
  };

  const getExploreSectionsData = () => {
    if (!civicData) return [];
    
    return [
      {
        key: "environment",
        title: "Environment & Weather",
        caption: "The air Lahore breathes and the sky above it.",
        color: "var(--lahore-green)",
        glowColor: "rgba(20, 90, 50, 0.25)",
        cards: [
          { id: "aqi-section", title: "Air Quality", desc: "Lahore's smog index, read straight from the city's monitors." },
          { id: "weather-section", title: "Live Weather", desc: "What it actually feels like outside right now." },
          { id: "weather-section", title: "Today's Forecast", desc: "The full arc of the day — highs, lows, and the chance of monsoon." },
          { id: "weather-section", title: "Sun & UV", desc: "First light, last light, and how hard the sun is hitting." }
        ]
      },
      {
        key: "fuel",
        title: "Fuel & Energy Rates",
        caption: "What it costs to move and to cook in this city.",
        color: "var(--lahore-terracotta)",
        glowColor: "rgba(192, 57, 43, 0.25)",
        cards: [
          { id: "petrol-section", title: "Petrol & Diesel", desc: "Regulated petroleum rates, high-speed diesel, and octane pricing." },
          { id: "lpg-section", title: "LPG & CNG", desc: "Liquefied petroleum gas per kg and region-based compressed natural gas." }
        ]
      },
      {
        key: "markets",
        title: "Markets & Crypto",
        caption: "Financial markets, gold bullion rates, and digital assets.",
        color: "var(--lahore-gold)",
        glowColor: "rgba(212, 175, 55, 0.25)",
        cards: [
          { id: "gold-section", title: "Gold & Silver", desc: "24K, 22K, 21K gold pricing per tola and silver rates." },
          { id: "currency-section", title: "Currency (USD/PKR)", desc: "Interbank US Dollar exchange rates against the Pakistani Rupee." },
          { id: "crypto-section", title: "Cryptocurrencies", desc: "Live prices of Bitcoin and Ethereum in PKR and USD." }
        ]
      },
      {
        key: "economy",
        title: "Macro-Economy",
        caption: "Lahore's economic output, unemployment, and income statistics.",
        color: "var(--lahore-sky)",
        glowColor: "rgba(41, 128, 185, 0.25)",
        cards: [
          { id: "gdp-section", title: "GDP & LSM", desc: "Annual growth indexes and large scale manufacturing growth rates." },
          { id: "gdp-section", title: "Unemployment & Wages", desc: "Unemployment rates and average monthly salaries." },
          { id: "income-section", title: "Household Tiers", desc: "Average monthly household income and consumption indices." }
        ]
      },
      {
        key: "demographics",
        title: "Demographics & Civic Health",
        caption: "Census demographics, education, health coverage, and utilities.",
        color: "var(--lahore-lime)",
        glowColor: "rgba(39, 174, 96, 0.25)",
        cards: [
          { id: "education-section", title: "Literacy & Education", desc: "Literacy rates and ratio of out-of-school children." },
          { id: "health-section", title: "Immunization & Health", desc: "Fully immunized child ratios and active stethoscope scroll drawing." },
          { id: "utilities-section", title: "Utilities & Connectivity", desc: "Sui gas connections, grid electricity, mobile ownership, and internet access." }
        ]
      }
    ];
  };

  return (
    <div className="app-container">
      {/* Fixed Background Pattern Layers to avoid layout zoom/shift */}
      <div className="bg-container">
        <div className="bg-layer bg-light-pattern" style={{ opacity: theme === 'light' ? 0.15 : 0 }} />
        <div className="bg-layer bg-dark-pattern" style={{ opacity: theme === 'dark' ? 0.15 : 0 }} />
      </div>

      {/* Top Header */}
      <header className={`app-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="header-left">
          <button 
            className="menu-trigger" 
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open Sidebar Navigation Menu"
          >
            <Menu size={18} />
          </button>
          
          <div className="header-logo-pill">
            <span>Lahore</span> Nervous System
          </div>
        </div>

        {/* Day/Night Theme Toggler with animated Sun/Moon transitions */}
        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme} 
          aria-label="Toggle Theme Day/Night"
        >
          <div className="theme-icon-container">
            <Sun 
              className="theme-icon sun-icon" 
              size={22} 
              style={{
                transform: theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
                opacity: theme === 'light' ? 1 : 0
              }} 
            />
            <Moon 
              className="theme-icon moon-icon" 
              size={22} 
              style={{
                transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)',
                opacity: theme === 'dark' ? 1 : 0
              }} 
            />
          </div>
        </button>
      </header>

      {/* Live Civic Alerts Banner */}
      {civicData?.alerts && civicData.alerts.toLowerCase() !== 'none' && (
        <div className="civic-alerts-banner">
          <span className="alerts-badge">ALERT</span>
          <div className="alerts-text">{civicData.alerts}</div>
        </div>
      )}

      {/* Hamburger Sidebar navigation */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      >
        <div className="sidebar" onClick={(e) => e.stopPropagation()}>
          <div className="sidebar-header">
            <h3 style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>Nervous Topics</h3>
            <button className="sidebar-close" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="sidebar-content">
            <h4 className="sidebar-heading">Lahore Pulse Directory</h4>
            <ul className="topic-list">
              {Object.keys(civicData.categories).map((catKey) => {
                const category = civicData.categories[catKey];
                const isExpanded = expandedTopic === catKey;
                
                return (
                  <li key={catKey} className="topic-item-container">
                    <div className="topic-row" onClick={() => setExpandedTopic(isExpanded ? null : catKey)}>
                      <div className="topic-title-area-left">
                        <ChevronRight 
                          size={16} 
                          className={`arrow-icon ${isExpanded ? 'expanded' : ''}`} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTopic(isExpanded ? null : catKey);
                          }}
                        />
                        <div className="topic-link-button" onClick={(e) => {
                          e.stopPropagation();
                          handleTopicClick(catKey);
                        }}>
                          <MetricIcon name={category.icon} className="card-header-icon" style={{ margin: 0 }} />
                          <span>{category.title}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expandable subtopics - keep in DOM for smooth transition */}
                    <div className={`subtopics-area ${isExpanded ? 'expanded' : ''}`}>
                      {subtopicMapping[catKey]?.map((sub) => (
                        <div 
                          key={sub.id} 
                          className="subtopic-item"
                          onClick={() => handleSubtopicClick(catKey, sub.id)}
                        >
                          {sub.label}
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="sidebar-footer">
            <p>Lahore Pulse MVP • Live Ingestion</p>
            <p style={{ fontSize: '0.7rem', marginTop: '4px' }}>Last Google Sheet Refresh: {civicData.lastUpdated}</p>
          </div>
        </div>
      </div>

      {/* Main Page Landing Section */}
      <section className="landing-hero" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
        <div className="hero-glow hero-glow-1"></div>
        <div className="hero-glow hero-glow-2"></div>
        <div className="hero-content" style={{ opacity: Math.max(1 - scrollY / 500, 0) }}>
          <div className="hero-pill">
            <span className="live-dot"></span>
            <span>LIVE • UPDATED {civicData.lastUpdated}</span>
          </div>

          <h1 className="hero-title">
            The nervous system of <span>Lahore</span>.
          </h1>
          <p className="hero-desc">
            Every pulse of the city — its air, its prices, its people — gathered in one place and refreshed every 24 hours.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => handleSubtopicClick("environment", "aqi-section")}>
              Start with the air <ArrowRight size={18} />
            </button>
            <a href="#pulse" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              See today's pulse
            </a>
          </div>
        </div>

        {/* Lower background pattern has been toggled in global App wrapper */}
        {/* Upper background landmarks layer */}
        <div className="hero-landscape-layer" style={{ transform: `translateY(${scrollY * 0.15}px)` }}></div>
        <div className="hero-gradient-overlay"></div>
      </section>

      {/* SECTION 2: Today's Pulse */}
      <section id="pulse" className="landing-section-pulse animate-on-scroll">
        {/* Ticker marquee display */}
        <div className="pulse-ticker-container">
          <div className="pulse-ticker-track">
            <div className="pulse-ticker-content">
              {getTickerText()}
            </div>
            <div className="pulse-ticker-content" aria-hidden="true">
              {getTickerText()}
            </div>
          </div>
        </div>

        <div className="pulse-inner-container">
          <h2 className="section-title">Today's pulse</h2>
          <p className="section-subtitle">The six numbers Lahoris check first, straight from the live sheet.</p>

          <div className="pulse-grid">
            {getPulseCardsData().map((card, idx) => (
              <div key={idx} className="pulse-card">
                <div className="pulse-card-label">{card.title}</div>
                <div className="pulse-card-value-container">
                  <span className="pulse-card-value">{card.value}</span>
                  {card.unit && (
                    <span className="pulse-card-unit-badge" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                      {card.unit}
                    </span>
                  )}
                  {card.trend && card.trend.symbol !== '—' && (
                    <span className="pulse-card-trend-icon" style={{
                      color: card.trend.direction === 'up' ? '#27ae60' : '#c0392b',
                      fontSize: '0.9rem',
                      marginLeft: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontWeight: '800'
                    }}>
                      {card.trend.symbol}
                    </span>
                  )}
                </div>
                <div className="pulse-card-footer">
                  {card.category} • {card.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Explore the City */}
      <section className="landing-section-explore animate-on-scroll">
        <div className="explore-inner-container">
          <h2 className="section-title">Explore the city</h2>
          <p className="section-subtitle" style={{ marginBottom: '60px' }}>Select any subtopic below to examine detailed statistics, live rates, and interactive visualizers.</p>

          {getExploreSectionsData().map((section) => (
            <div 
              key={section.key} 
              className="explore-category-block"
              style={{
                '--accent-glow': section.color,
                '--accent-glow-glow': section.glowColor
              }}
            >
              <div className="explore-category-header">
                <span className="explore-category-tag" style={{ color: section.color }}>{section.title}</span>
                <h3 className="explore-category-caption">{section.caption}</h3>
              </div>

              <div className="explore-grid">
                {section.cards.map((card, cIdx) => (
                  <div 
                    key={cIdx} 
                    className="explore-subtopic-card"
                    onClick={() => handleSubtopicClick(section.key, card.id)}
                  >
                    <div>
                      <h4 className="explore-subtopic-title">{card.title}</h4>
                      <p className="explore-subtopic-desc">{card.desc}</p>
                    </div>
                    <div className="explore-subtopic-footer" style={{ color: section.color }}>
                      Open <ArrowRight size={14} className="explore-subtopic-arrow" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Detail slide drawer views for topic folders */}
      {Object.keys(civicData.categories).map((catKey) => {
        const category = civicData.categories[catKey];
        const isOpen = activeCategory === catKey;

        return (
          <div 
            key={catKey} 
            className={`detail-drawer-overlay ${isOpen ? 'open' : ''}`}
          >
            {/* Drawer Header */}
            <div className="drawer-header">
              <button className="drawer-back-btn" onClick={() => setActiveCategory(null)}>
                <ArrowLeft size={18} /> Back to Lahore
              </button>
              
              <div className="drawer-title-area">
                <h2>{category.title}</h2>
                <p>Lahore City Pulse • Refreshed Daily</p>
              </div>

              <div style={{ width: '100px' }}></div> {/* Spacer */}
            </div>

            {/* Scrollable Drawer Body */}
            <div 
              className="drawer-scroll-body"
              ref={drawerBodyRef}
              onScroll={handleDrawerScroll}
            >
              {/* Category Environment Customizations (Immersive rain effect) */}
              {catKey === "environment" && (
                <>
                  {/* Air Quality Index Section */}
                  <div id="aqi-section" className="drawer-section-anchor">
                    <h3 className="subtopic-title-header">
                      <ShieldAlert size={26} color="var(--lahore-terracotta)" /> Air Quality Index (AQI)
                    </h3>
                    <div className="metrics-grid">
                      {category.items.filter(item => item.id === "aqi").map(item => (
                        <div key={item.id} className="metric-card" style={{ gridColumn: '1 / -1' }}>
                          <div>
                            <div className="card-header-icon"><ShieldAlert size={28} /></div>
                            <div className="metric-label">{item.label}</div>
                            <div className="metric-value" style={{ color: 'var(--lahore-terracotta)', fontSize: '4.5rem' }}>{item.value}</div>
                          </div>
                          <div className="metric-desc">
                            {(() => {
                              const v = parseInt(item.value);
                              const label = v <= 50 ? 'Good' : v <= 100 ? 'Moderate' : v <= 150 ? 'Sensitive' : v <= 200 ? 'Unhealthy' : v <= 300 ? 'Very Unhealthy' : 'Hazardous';
                              const color = v <= 50 ? '#27ae60' : v <= 100 ? '#f39c12' : v <= 150 ? '#e67e22' : v <= 200 ? '#c0392b' : '#8e44ad';
                              return (
                                <span style={{
                                  background: color + '18',
                                  color: color,
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  marginRight: '10px',
                                  border: `1px solid ${color}`
                                }}>
                                  {label}
                                </span>
                              );
                            })()}
                            {item.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weather Info Section */}
                  <div id="weather-section" className="drawer-section-anchor">
                    <h3 className="subtopic-title-header">
                      <CloudSun size={26} color="var(--lahore-gold)" /> Weather & Climate
                    </h3>
                    <div className="metrics-grid">
                      {category.items.filter(item => !["aqi", "precipitation_mm", "rain_mm", "today_precipitation_sum_mm", "today_precipitation_probability_pct"].includes(item.id)).map(item => (
                        <div key={item.id} className="metric-card">
                          <div>
                            <div className="card-header-icon"><MetricIcon name={getMetricIconName(item.id)} size={24} /></div>
                            <div className="metric-label">{item.label}</div>
                            <div className="metric-value">{item.value}</div>
                          </div>
                          <p className="metric-desc">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rain & Immersive rain effects container */}
                  <div id="rain-section" className="drawer-section-anchor">
                    <h3 className="subtopic-title-header">
                      <CloudRain size={26} color="var(--lahore-sky)" /> Rain & Precipitationsum
                    </h3>
                    <div className="immersive-section-wrapper">
                      {/* Active canvas rain background */}
                      <CanvasRain isActive={isOpen} />
                      
                      <div className="immersive-overlay-content">
                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1.4rem' }}>Immersive Rain Visualizer</h4>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                          This rain effect is scrolling-controlled. Move your mouse cursor near rain particles to deflect them!
                        </p>
                        
                        <div className="metrics-grid" style={{ gridTemplateColumns: '1fr' }}>
                          {category.items.filter(item => ["precipitation_mm", "rain_mm", "today_precipitation_sum_mm", "today_precipitation_probability_pct"].includes(item.id)).map(item => (
                            <div key={item.id} className="metric-card" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
                              <div>
                                <div className="card-header-icon"><MetricIcon name={getMetricIconName(item.id)} size={24} /></div>
                                <div className="metric-label">{item.label}</div>
                                <div className="metric-value" style={{ color: 'var(--lahore-sky)' }}>{item.value}</div>
                              </div>
                              <p className="metric-desc">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Category Demographics & Civic Health Customizations (Stethoscope SVG path tracer) */}
              {catKey === "demographics" && (
                <>
                  {/* Literacy & Schooling Section */}
                  <div id="education-section" className="drawer-section-anchor">
                    <h3 className="subtopic-title-header">
                      <BookOpen size={26} color="var(--lahore-green)" /> Literacy & Schooling
                    </h3>
                    <div className="metrics-grid">
                      {category.items.filter(item => ["literacy_rate", "out_of_school_children"].includes(item.id)).map(item => (
                        <div key={item.id} className="metric-card">
                          <div>
                            <div className="card-header-icon"><MetricIcon name={getMetricIconName(item.id)} size={24} /></div>
                            <div className="metric-label">{item.label}</div>
                            <div className="metric-value" style={{ color: 'var(--lahore-green)' }}>{item.value}</div>
                          </div>
                          <p className="metric-desc">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Immunization & Civic Health Section (contains stethoscope scroll drawing canvas) */}
                  <div id="health-section" className="drawer-section-anchor">
                    <h3 className="subtopic-title-header">
                      <HeartPulse size={26} color="var(--lahore-terracotta)" /> Immunization & Health
                    </h3>
                    <div className="immersive-section-wrapper" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <div className="immersive-overlay-content" style={{ flex: 1 }}>
                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1.4rem' }}>Lahore Civic Heartbeat</h4>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                          Scroll down to trace the stethoscope path and activate the heartbeat pulses below.
                        </p>
                        
                        {category.items.filter(item => ["fully_immunized_children", "total_fertility_rate"].includes(item.id)).map(item => (
                          <div key={item.id} className="metric-card" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', marginBottom: '16px' }}>
                            <div>
                              <div className="card-header-icon"><MetricIcon name={getMetricIconName(item.id)} size={24} /></div>
                              <div className="metric-label">{item.label}</div>
                              <div className="metric-value" style={{ color: 'var(--lahore-terracotta)' }}>{item.value}</div>
                            </div>
                            <p className="metric-desc">{item.description}</p>
                          </div>
                        ))}
                      </div>

                      {/* Stethoscope Tracer Canvas */}
                      <div className="stethoscope-canvas-container">
                        <CanvasStethoscope scrollProgress={drawerScrollProgress} />
                      </div>
                    </div>
                  </div>

                  {/* Utilities Section */}
                  <div id="utilities-section" className="drawer-section-anchor">
                    <h3 className="subtopic-title-header">
                      <Activity size={26} color="var(--lahore-gold)" /> Household Connectivity
                    </h3>
                    <div className="metrics-grid">
                      {category.items.filter(item => ["household_with_gas", "household_with_electricity", "mobile_smartphone_ownership", "internet_usage", "household_internet_usage"].includes(item.id)).map(item => (
                        <div key={item.id} className="metric-card">
                          <div>
                            <div className="card-header-icon"><MetricIcon name={getMetricIconName(item.id)} size={24} /></div>
                            <div className="metric-label">{item.label}</div>
                            <div className="metric-value">{item.value}</div>
                          </div>
                          <p className="metric-desc">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Standard Layout for other categories (Fuel, Markets, Economy) */}
              {catKey !== "environment" && catKey !== "demographics" && (
                <>
                  {subtopicMapping[catKey]?.map((sub) => {
                    // Filter items matching this subtopic section
                    let sectionItems = [];
                    if (sub.id === "petrol-section") {
                      sectionItems = category.items.filter(item => ["petrol_per_litre", "high_speed_diesel_per_litre", "high_octane_per_litre", "light_diesel_per_litre", "kerosene_per_litre", "effective_date"].includes(item.id));
                    } else if (sub.id === "lpg-section") {
                      sectionItems = category.items.filter(item => ["lpg_per_kg", "cng_region1_per_kg", "cng_region2_per_kg"].includes(item.id));
                    } else if (sub.id === "gold-section") {
                      sectionItems = category.items.filter(item => item.id.includes("gold") || item.id === "silver_per_tola");
                    } else if (sub.id === "currency-section") {
                      sectionItems = category.items.filter(item => item.id === "dollar_rate_pkr");
                    } else if (sub.id === "crypto-section") {
                      sectionItems = category.items.filter(item => item.id.includes("bitcoin") || item.id.includes("ethereum"));
                    } else if (sub.id === "gdp-section") {
                      sectionItems = category.items.filter(item => ["total_population", "annual_gdp_growth_rate", "large_scale_manufacturing_growth", "unemployment_rate"].includes(item.id));
                    } else if (sub.id === "income-section") {
                      sectionItems = category.items.filter(item => ["average_monthly_wage", "per_capita_income", "average_monthly_household_income", "average_monthly_household_consumption"].includes(item.id));
                    }

                    return (
                      <div key={sub.id} id={sub.id} className="drawer-section-anchor">
                        <h3 className="subtopic-title-header">
                          <MetricIcon name={sub.icon} size={26} style={{ color: getMetricCardColor(catKey) }} /> {sub.label}
                        </h3>
                        <div className="metrics-grid">
                          {sectionItems.map((item) => (
                            <div key={item.id} className="metric-card">
                              <div>
                                <div className="card-header-icon"><MetricIcon name={getMetricIconName(item.id)} size={24} /></div>
                                <div className="metric-label">{item.label}</div>
                                <div className="metric-value" style={{ color: getMetricCardColor(catKey) }}>{item.value}</div>
                              </div>
                              <p className="metric-desc">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Help Assistant ChatBot in bottom-right corner */}
      <ChatBot civicData={civicData} />
    </div>
  );
}
