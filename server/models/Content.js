const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['Movie', 'Series', 'Cartoon'] 
  },
  industry: { 
    type: String, 
    required: true,
    enum: ['Hollywood', 'Bollywood', 'South Indian', 'Anime', 'Other']
  },
  genres: [String],
  language: String,
  description: String,
  thumbnailUrl: String,
  downloadLinks: [{
    quality: String,
    url: String,
    size: String,
    id: String
  }],
  season: Number,
  episode: Number,
  releaseYear: Number,
  views: { type: Number, default: 0 },
  createdAt: { type: Number, default: Date.now }
});

// Duplicate the ID field.
contentSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

// Ensure virtual fields are serialized.
contentSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {   delete ret._id  }
});

module.exports = mongoose.model('Content', contentSchema);