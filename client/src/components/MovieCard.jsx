import React from 'react';
import { Sparkles } from 'lucide-react';

const MovieCard = ({ movie, onClick }) => {
    let posterUrl = movie.poster_url || movie.posterPath || 'https://via.placeholder.com/342x513?text=No+Poster';

    // Ensure relative paths are prefixed with TMDB base URL
    if (posterUrl && typeof posterUrl === 'string' && posterUrl.startsWith('/')) {
        posterUrl = `https://image.tmdb.org/t/p/w500${posterUrl}`;
    }

    return (
        <div className="movie-card" onClick={() => onClick(movie.tmdb_id, movie.title)}>
            <div className="poster-container">
                <img
                    src={posterUrl}
                    alt={movie.title}
                    className="movie-poster"
                    style={{ transition: 'opacity 0.3s' }}
                    loading="lazy"
                    onLoad={(e) => { e.target.style.opacity = 1; }}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
                <div style={{
                    display: 'none',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    textAlign: 'center',
                    height: '100%',
                    width: '100%',
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)'
                }}>
                    <Sparkles size={32} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'white' }}>{movie.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>No Poster Available</div>
                </div>
            </div>
            <div className="movie-overlay">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div className="movie-title">{movie.title}</div>
                    {movie.vote_average > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 'bold' }}>
                            {movie.vote_average.toFixed(1)}★
                        </div>
                    )}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {movie.release_date?.split('-')[0] || movie.releaseDate?.split('-')[0]}
                </div>
            </div>
        </div>
    );
};

export default MovieCard;
