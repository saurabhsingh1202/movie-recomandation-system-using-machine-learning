const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    tmdbId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    overview: { type: String },
    genres: [{ id: Number, name: String }],
    posterPath: { type: String },
    backdropPath: { type: String },
    releaseDate: { type: String },
    voteAverage: { type: Number },
    voteCount: { type: Number },
    tags: { type: String } // Combined string for recommendation logic
});

movieSchema.index({ tags: 'text' });

module.exports = mongoose.model('Movie', movieSchema);
