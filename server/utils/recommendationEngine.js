const Movie = require('../models/Movie');
const natural = require('natural');
const TfIdf = natural.TfIdf;

/**
 * Higher-level recommendation logic.
 * In a production app, similarity would be precomputed.
 * Here we'll search by genre and then sort by a simple overlap score.
 */
const getRecommendations = async (targetMovie) => {
    try {
        // 1. Find candidates using MongoDB's text index
        // Including Title in the search helps find sequels and direct matches
        const candidates = await Movie.find(
            { $text: { $search: `${targetMovie.title} ${targetMovie.tags}` } },
            { score: { $meta: "textScore" } }
        )
            .sort({ score: { $meta: "textScore" } })
            .limit(500);

        // 2. Build TF-IDF model
        const tfidf = new TfIdf();

        // Add target document first
        tfidf.addDocument(targetMovie.tags || "");

        // Add all others
        candidates.forEach(c => {
            tfidf.addDocument(c.tags || "");
        });

        const results = [];
        const targetDocIndex = 0;
        const targetTerms = tfidf.listTerms(targetDocIndex);

        // Pre-calculate target vector norm for cosine similarity
        let targetNorm = 0;
        targetTerms.forEach(term => {
            targetNorm += Math.pow(term.tfidf, 2);
        });
        targetNorm = Math.sqrt(targetNorm);

        // 3. Compute similarity for each candidate
        for (let i = 0; i < candidates.length; i++) {
            if (candidates[i].tmdbId === targetMovie.tmdbId) continue;

            let dotProduct = 0;
            let candidateNorm = 0;

            // We need the full term list for the candidate to calculate its norm
            // natural doesn't easily give norms, so we'll approximate or calculate
            const candidateTerms = tfidf.listTerms(i + 1);
            candidateTerms.forEach(ct => {
                candidateNorm += Math.pow(ct.tfidf, 2);
                // If this term is also in target, add to dot product
                const matchingTargetTerm = targetTerms.find(tt => tt.term === ct.term);
                if (matchingTargetTerm) {
                    dotProduct += matchingTargetTerm.tfidf * ct.tfidf;
                }
            });

            candidateNorm = Math.sqrt(candidateNorm);

            const score = (targetNorm > 0 && candidateNorm > 0)
                ? (dotProduct / (targetNorm * candidateNorm))
                : 0;

            if (score > 0) {
                results.push({
                    tmdb_id: candidates[i].tmdbId,
                    title: candidates[i].title,
                    poster_url: candidates[i].posterPath ? (candidates[i].posterPath.startsWith('http') ? candidates[i].posterPath : `https://image.tmdb.org/t/p/w500${candidates[i].posterPath.startsWith('/') ? '' : '/'}${candidates[i].posterPath}`) : 'https://via.placeholder.com/500x750?text=No+Poster',
                    release_date: candidates[i].releaseDate,
                    vote_average: candidates[i].voteAverage,
                    score: score
                });
            }
        }

        // Sort by score and return top N
        return results.sort((a, b) => b.score - a.score).slice(0, 15);
    } catch (error) {
        console.error('Recommendation Engine Error:', error);
        return [];
    }
};

module.exports = { getRecommendations };
