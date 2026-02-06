require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Content = require('./models/Content');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
// REPLACE THE URI BELOW WITH YOUR ACTUAL MONGODB ATLAS CONNECTION STRING
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cinestream_db';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- API ROUTES ---

// 1. GET ALL CONTENT
app.get('/api/contents', async (req, res) => {
  try {
    const { type, language, industry, search } = req.query;
    let query = {};

    if (type) query.type = type;
    if (language) query.language = language;
    if (industry) query.industry = industry;
    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    const contents = await Content.find(query).sort({ createdAt: -1 });
    res.json(contents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. GET SINGLE CONTENT
app.get('/api/contents/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ message: 'Content not found' });
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. CREATE CONTENT
app.post('/api/contents', async (req, res) => {
  const content = new Content({
    title: req.body.title,
    type: req.body.type,
    industry: req.body.industry,
    genres: req.body.genres,
    language: req.body.language,
    description: req.body.description,
    thumbnailUrl: req.body.thumbnailUrl,
    downloadLinks: req.body.downloadLinks,
    season: req.body.season,
    episode: req.body.episode,
    releaseYear: req.body.releaseYear,
    views: 0,
    createdAt: Date.now()
  });

  try {
    const newContent = await content.save();
    res.status(201).json(newContent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 4. UPDATE CONTENT
app.put('/api/contents/:id', async (req, res) => {
  try {
    const updatedContent = await Content.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        { new: true } // Return the updated document
    );
    res.json(updatedContent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 5. DELETE CONTENT
app.delete('/api/contents/:id', async (req, res) => {
  try {
    await Content.findByIdAndDelete(req.params.id);
    res.json({ message: 'Content deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Increment View Count (Optional Utility)
app.post('/api/contents/:id/view', async (req, res) => {
    try {
        await Content.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.status(200).send();
    } catch (err) {
        res.status(500).send();
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});