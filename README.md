# 🎬 MovieBuddy: AI-Powered Movie Discovery System

Welcome to **MovieBuddy**, a full-stack movie recommendation engine that combines custom machine learning logic with a high-performance web interface. This project was born out of a desire to create a discovery tool that feels cinematic, fast, and actually intelligent.

## 🌟 Why I built this?
Most movie recommendation sites are either too simple (just showing popular movies) or too slow. I wanted to build something that:
1. Uses actual **Machine Learning (TF-IDF Similarity)** to find movies based on content, not just popularity.
2. Has a **Hybrid Brain**: It uses a local dataset of 45,000 movies but can also fetch brand-new 2024/25 releases on-the-fly.
3. Looks and feels like a **Premium Streaming Service** with smooth animations and cinematic hero sections.

---

## 🚀 Key Features

### 1. Hybrid Recommendation Engine
- **Local AI**: Implemented a TF-IDF (Term Frequency-Inverse Document Frequency) vectorizer in Node.js to calculate cosine similarity between movies based on genres, keywords, and overviews.
- **Smart Fallback**: If a movie isn't in our local database, the system automatically queries the TMDB Global API to ensure you always get suggestions.

### 2. High-Performance Dashboard
- **Dynamic Feeds**: Four real-time categories (Trending, Masterpieces, Popular, Upcoming) organized into a super-clean tabbed interface.
- **Smooth Navigation**: Built with React and Framer Motion for that "app-like" feel.
- **Cinematic Landing Pages**: Every movie has a dedicated homepage view with HD backdrops and synopsis.

### 3. Resilience & Design
- **Graceful Failbacks**: If a poster image is missing, the UI generates a beautiful unique gradient card with the title automatically.
- **Optimized Loading**: Uses debounced search and skeleton states to keep the experience snappy.

---

## 🛠️ Performance Stack

- **Frontend**: React 18, Vite (for ultra-fast builds), Framer Motion (animations), Lucide Icons.
- **Backend**: Node.js, Express, Axios (with custom retry/timeout logic for API stability).
- **Database**: MongoDB (hosting 45,000+ movie nodes).
- **AI/ML**: Custom TF-IDF similarity algorithm implemented in JavaScript.

---

## ⚙️ How to run it locally

### 1. Prerequisite
You'll need a **TMDB API Key**. You can get one for free at [themoviedb.org](https://www.themoviedb.org/).

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
TMDB_API_KEY=your_api_key_here
```
Run the server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
The app will be live at `http://localhost:5173`.

---

## 📸 Screenshots
*(Add your screenshots here after deploying!)*

---

*Made with 🍿 and a love for great cinema.*
