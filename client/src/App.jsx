import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Loader2, Sparkles, TrendingUp, Star, Flame } from 'lucide-react';
import MovieCard from './components/MovieCard';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:5000/api/movies';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [best2024Movies, setBest2024Movies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedsLoading, setFeedsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discovery');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMovieDetails, setSelectedMovieDetails] = useState(null);
  const dropdownRef = useRef(null);

  // Initial data fetch for home feeds
  useEffect(() => {
    const fetchFeeds = async () => {
      const endpoints = [
        { key: 'trending', url: `${API_BASE}/home?category=trending`, setter: setTrendingMovies },
        { key: 'popular', url: `${API_BASE}/home?category=popular`, setter: setPopularMovies },
        { key: 'top_rated', url: `${API_BASE}/home?category=top_rated`, setter: setTopRatedMovies },
        { key: 'upcoming', url: `${API_BASE}/home?category=upcoming`, setter: setUpcomingMovies },
        { key: 'now_playing', url: `${API_BASE}/home?category=now_playing`, setter: setNowPlayingMovies },
        { key: 'best_2024', url: `${API_BASE}/home?category=best_2024`, setter: setBest2024Movies },
      ];

      try {
        await Promise.allSettled(endpoints.map(async (ep) => {
          try {
            const res = await axios.get(ep.url);
            ep.setter(res.data);
          } catch (err) {
            console.error(`Error fetching ${ep.key}:`, err.message);
          }
        }));
      } finally {
        setFeedsLoading(false);
      }
    };
    fetchFeeds();
  }, []);

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/search`, { params: { query } });
      setSuggestions(res.data.results.slice(0, 8));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery && !selectedMovie) {
        fetchSuggestions(searchQuery);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectMovie = (movie) => {
    setSearchQuery(movie.title);
    setSelectedMovie(movie);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleRecommend = async (idOrTitle) => {
    setLoading(true);
    setRecommendations([]);
    try {
      let res;
      let detailsRes;
      if (typeof idOrTitle === 'number') {
        res = await axios.get(`${API_BASE}/${idOrTitle}/recommendations`);
        detailsRes = await axios.get(`${API_BASE}/${idOrTitle}`);
      } else {
        const title = selectedMovie ? selectedMovie.title : searchQuery;
        res = await axios.get(`${API_BASE}/recommend-by-title`, { params: { title } });

        // If we have recommendations, fetch details for the first one as a fallback Hero
        if (selectedMovie?.id) {
          detailsRes = await axios.get(`${API_BASE}/${selectedMovie.id}`);
        } else if (res.data.length > 0) {
          detailsRes = await axios.get(`${API_BASE}/${res.data[0].tmdb_id}`);
        }
      }
      setRecommendations(res.data);
      if (detailsRes) {
        setSelectedMovieDetails(detailsRes.data);
      }
      if (res.data.length > 0) {
        setTimeout(() => {
          document.getElementById('recommendations-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedItemClick = (id, title) => {
    setSearchQuery(title);
    handleRecommend(id);
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Search Tool - Centered at Top (GitHub Style) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', margin: '4rem 0', width: '100%', maxWidth: '800px' }}
      >
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.05em' }}>
          🎬 Movie<span style={{ color: 'var(--primary)' }}>Buddy</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Discover your next favorite movie using AI-powered recommendations
        </p>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
            <input
              type="text"
              className="glass-input"
              placeholder="What kind of movie are you looking for?"
              style={{ padding: '0.8rem 1rem 0.8rem 3.5rem', fontSize: '1rem' }}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedMovie(null);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleRecommend()}
            />

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#151c2c',
                    borderRadius: '0.5rem',
                    marginTop: '0.5rem',
                    zIndex: 100,
                    overflow: 'hidden',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7)'
                  }}
                >
                  {suggestions.map(m => (
                    <div
                      key={m.id}
                      style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}
                      className="suggestion-item"
                      onClick={() => handleSelectMovie(m)}
                    >
                      <img src={m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : 'https://via.placeholder.com/92x138?text=No+Img'} style={{ width: '30px', borderRadius: '4px' }} alt="" />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{m.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.release_date?.split('-')[0]}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={() => handleRecommend()}
            disabled={loading || (!selectedMovie && !searchQuery)}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
            Get Recommendations
          </button>
        </div>
      </motion.div>

      {/* Modern Navigation Bar (Tabs) */}
      <nav className="glass-card" style={{
        width: '100%',
        maxWidth: '1000px',
        padding: '0.5rem',
        marginBottom: '2.5rem',
        display: 'flex',
        justifyContent: 'space-around',
        gap: '0.5rem',
        position: 'sticky',
        top: '1rem',
        zIndex: 50
      }}>
        {[
          { id: 'discovery', label: 'Dashboard', icon: <Sparkles size={16} /> },
          { id: 'trending', label: 'Trending', icon: <Flame size={16} /> },
          { id: 'top_rated', label: 'Masterpieces', icon: <Star size={16} /> },
          { id: 'upcoming', label: 'Upcoming', icon: <TrendingUp size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id !== 'discovery') {
                setRecommendations([]);
              }
            }}
            className={activeTab === tab.id ? 'nav-tab active' : 'nav-tab'}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.8rem',
              borderRadius: '0.6rem',
              fontSize: '0.95rem',
              fontWeight: '600',
              transition: 'all 0.2s',
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {tab.icon}
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <div style={{ width: '100%' }}>

        {/* Selected Movie Hero Section (The "Homepage" for the movie) */}
        <AnimatePresence>
          {selectedMovieDetails && recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: '1000px',
                background: `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.95)), url(${selectedMovieDetails.backdrop_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '1.5rem',
                border: '1px solid var(--glass-border)',
                padding: '3rem',
                marginBottom: '4rem',
                display: 'flex',
                gap: '2.5rem',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >
              <img
                src={selectedMovieDetails.poster_url}
                alt={selectedMovieDetails.title}
                style={{ width: '240px', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
              />
              <div style={{ flex: 1, minWidth: '300px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1.1 }}>{selectedMovieDetails.title}</h2>
                  <div style={{ padding: '0.2rem 0.6rem', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {selectedMovieDetails.vote_average?.toFixed(1)} ★
                  </div>
                </div>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '600px', lineHeight: 1.6 }}>
                  {selectedMovieDetails.overview}
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Released: {selectedMovieDetails.release_date}
                  </div>
                  {selectedMovieDetails.homepage && (
                    <a
                      href={selectedMovieDetails.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{ padding: '0.5rem 1rem', textDecoration: 'none', fontSize: '0.9rem' }}
                    >
                      Official Website ↗
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setRecommendations([]);
                      setSelectedMovieDetails(null);
                      setSearchQuery('');
                      setSelectedMovie(null);
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Clear Results
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recommendations Result */}
        <AnimatePresence>
          {recommendations.length > 0 && (
            <motion.div
              id="recommendations-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: '4rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)', paddingLeft: '1rem' }}>
                <Sparkles size={24} color="var(--primary)" />
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>AI Recommendations</h2>
              </div>
              <div className="movie-grid">
                {recommendations.map((movie, idx) => (
                  <MovieCard key={movie.tmdb_id || idx} movie={movie} onClick={() => handleFeedItemClick(movie.tmdb_id, movie.title)} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && recommendations.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Analyzing content...</p>
          </div>
        )}

        {/* Tab Content */}
        {!loading && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {feedsLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <Loader2 className="animate-spin" size={32} color="var(--primary)" />
              </div>
            )}

            {activeTab === 'discovery' && (
              <>
                {trendingMovies.length > 0 && (
                  <section style={{ marginBottom: '4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderLeft: '4px solid #f43f5e', paddingLeft: '1rem' }}>
                      <Flame size={24} color="#f43f5e" />
                      <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Trending Now</h2>
                    </div>
                    <div className="movie-grid">
                      {trendingMovies.slice(0, 5).map(movie => (
                        <MovieCard key={movie.tmdb_id} movie={movie} onClick={() => handleFeedItemClick(movie.tmdb_id, movie.title)} />
                      ))}
                    </div>
                  </section>
                )}
                {topRatedMovies.length > 0 && (
                  <section style={{ marginBottom: '4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderLeft: '4px solid #8b5cf6', paddingLeft: '1rem' }}>
                      <Star size={24} color="#8b5cf6" />
                      <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Masterpieces</h2>
                    </div>
                    <div className="movie-grid">
                      {topRatedMovies.slice(0, 5).map(movie => (
                        <MovieCard key={movie.tmdb_id} movie={movie} onClick={() => handleFeedItemClick(movie.tmdb_id, movie.title)} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {activeTab === 'trending' && (
              <section style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderLeft: '4px solid #f43f5e', paddingLeft: '1rem' }}>
                  <Flame size={24} color="#f43f5e" />
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Trending Now</h2>
                </div>
                <div className="movie-grid">
                  {trendingMovies.map(movie => (
                    <MovieCard key={movie.tmdb_id} movie={movie} onClick={() => handleFeedItemClick(movie.tmdb_id, movie.title)} />
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'top_rated' && (
              <section style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderLeft: '4px solid #8b5cf6', paddingLeft: '1rem' }}>
                  <Star size={24} color="#8b5cf6" />
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Top Rated Masterpieces</h2>
                </div>
                <div className="movie-grid">
                  {topRatedMovies.map(movie => (
                    <MovieCard key={movie.tmdb_id} movie={movie} onClick={() => handleFeedItemClick(movie.tmdb_id, movie.title)} />
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'upcoming' && (
              <section style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderLeft: '4px solid #10b981', paddingLeft: '1rem' }}>
                  <TrendingUp size={24} color="#10b981" />
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Upcoming Releases</h2>
                </div>
                <div className="movie-grid">
                  {upcomingMovies.map(movie => (
                    <MovieCard key={movie.tmdb_id} movie={movie} onClick={() => handleFeedItemClick(movie.tmdb_id, movie.title)} />
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}
      </div>

      <footer style={{ marginTop: 'auto', padding: '4rem 0 2rem', textAlign: 'center', color: 'var(--text-muted)', width: '100%', borderTop: '1px solid var(--glass-border)' }}>
        <p style={{ fontSize: '0.9rem' }}>© 2026 MovieBuddy • AI Content Filtering • API by TMDB</p>
      </footer>
    </div>
  );
}

export default App;
