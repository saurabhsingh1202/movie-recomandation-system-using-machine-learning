const express = require('express');
const router = express.Router();
const axios = require('axios');
const Movie = require('../models/Movie');
const { getRecommendations } = require('../utils/recommendationEngine');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Helper for TMDB requests with retry logic
const tmdbGet = async (path, params = {}, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}${path}`, {
                params: { ...params, api_key: TMDB_API_KEY },
                timeout: 10000 // 10 second timeout
            });
            return response.data;
        } catch (error) {
            console.error(`TMDB Attempt ${i + 1} Failed (${path}):`, error.message);
            if (i === retries - 1) throw error;
            // Wait 1s before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};

// --- STATIC ROUTES FIRST ---

// Home Feed (Trending/Popular/Top Rated/Upcoming)
router.get('/home', async (req, res) => {
    try {
        const category = req.query.category || 'popular';
        let data;

        try {
            if (category === 'trending') {
                data = await tmdbGet('/trending/movie/day');
            } else if (category === 'top_rated') {
                data = await tmdbGet('/movie/top_rated');
            } else if (category === 'upcoming') {
                data = await tmdbGet('/movie/upcoming');
            } else if (category === 'now_playing') {
                data = await tmdbGet('/movie/now_playing');
            } else if (category === 'best_2024') {
                data = await tmdbGet('/discover/movie', {
                    primary_release_year: 2024,
                    sort_by: 'vote_average.desc',
                    'vote_count.gte': 100
                });
            } else {
                data = await tmdbGet(`/movie/${category}`);
            }
        } catch (tmdbErr) {
            console.error(`Section fetch failed for ${category}:`, tmdbErr.message);
            return res.json([]); // Return empty rather than 500
        }

        res.json(data.results.map(m => ({
            tmdb_id: m.id,
            title: m.title,
            poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
            release_date: m.release_date,
            vote_average: m.vote_average
        })));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch home feed' });
    }
});

// Search Movies
router.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    try {
        const data = await tmdbGet('/search/movie', { query });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Dedicated Recommendation Endpoint (Search -> Select -> Recommend)
router.get('/recommend-by-title', async (req, res) => {
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    try {
        const localMovie = await Movie.findOne({ title: new RegExp(`^${title}$`, 'i') });
        if (!localMovie) {
            try {
                // If not in local DB, search TMDB first to get ID
                const searchData = await tmdbGet('/search/movie', { query: title });
                if (!searchData || searchData.results.length === 0) return res.json([]);

                const tmdbId = searchData.results[0].id;
                const simData = await tmdbGet(`/movie/${tmdbId}/similar`);
                return res.json(simData.results.slice(0, 12).map(m => ({
                    tmdb_id: m.id,
                    title: m.title,
                    poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
                    release_date: m.release_date,
                    vote_average: m.vote_average
                })));
            } catch (tmdbErr) {
                console.error('TMDB Search/Sim Failure:', tmdbErr.message);
                return res.json([]); // Return empty rather than 500
            }
        }

        const recommendations = await getRecommendations(localMovie);
        res.json(recommendations);
    } catch (error) {
        console.error('Recommendation Logic Failure:', error.message);
        res.status(500).json({ error: 'Recommendation failed' });
    }
});

// --- PARAMETERIZED ROUTES LAST ---

// Movie Details
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const data = await tmdbGet(`/movie/${id}`);
        res.json({
            tmdb_id: data.id,
            title: data.title,
            overview: data.overview,
            release_date: data.release_date,
            vote_average: data.vote_average,
            poster_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
            backdrop_url: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null,
            genres: data.genres,
            homepage: data.homepage
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch movie details' });
    }
});

// Recommendations by ID
router.get('/:id/recommendations', async (req, res) => {
    const { id } = req.params;
    try {
        const localMovie = await Movie.findOne({ tmdbId: id });
        let recommendations = [];

        if (localMovie) {
            recommendations = await getRecommendations(localMovie);
        } else {
            const simData = await tmdbGet(`/movie/${id}/similar`);
            recommendations = simData.results.slice(0, 12).map(m => ({
                tmdb_id: m.id,
                title: m.title,
                poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
                release_date: m.release_date,
                vote_average: m.vote_average
            }));
        }

        res.json(recommendations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

module.exports = router;
