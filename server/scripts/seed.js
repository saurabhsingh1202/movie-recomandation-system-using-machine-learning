const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
require('dotenv').config();

const CSV_PATH = path.join(__dirname, '../../ml_source/movies_metadata.csv');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-rec');
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data (optional)
        // await Movie.deleteMany({});
        // console.log('Cleared existing movies');

        const movies = [];
        let count = 0;
        const MAX_MOVIES = 50000; // Include all movies for accuracy

        fs.createReadStream(CSV_PATH)
            .pipe(csv())
            .on('data', (row) => {
                if (count < MAX_MOVIES) {
                    try {
                        // Parse genres from stringified list of dicts
                        let genres = [];
                        let genreNames = "";
                        try {
                            const genreStr = row.genres.replace(/'/g, '"');
                            genres = JSON.parse(genreStr);
                            genreNames = genres.map(g => g.name).join(' ');
                        } catch (e) {
                            genres = [];
                        }

                        const tmdbId = parseInt(row.id);
                        const title = row.title || row.original_title || "";
                        const overview = row.overview || "";
                        const tagline = row.tagline || "";

                        if (!isNaN(tmdbId) && title) {
                            movies.push({
                                tmdbId: tmdbId,
                                title: title,
                                overview: overview,
                                genres: genres,
                                posterPath: row.poster_path,
                                releaseDate: row.release_date,
                                voteAverage: parseFloat(row.vote_average) || 0,
                                voteCount: parseInt(row.vote_count) || 0,
                                // Including title in tags to ensure Avatar matches Avatar 2
                                tags: `${title} ${overview} ${genreNames} ${tagline}`
                                    .toLowerCase()
                                    .replace(/[^a-zA-Z\s]/g, '')
                                    .trim()
                            });
                            count++;
                        }
                    } catch (err) {
                        // Skip rows with issues
                    }
                }
            })
            .on('end', async () => {
                console.log(`Parsed ${movies.length} movies. Inserting into DB...`);
                // Bulk insert
                try {
                    await Movie.insertMany(movies, { ordered: false });
                    console.log('Seeding completed successfully!');
                } catch (err) {
                    console.log(`Finished with some duplicates skipped: ${err.message}`);
                }
                process.exit();
            });

    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();
