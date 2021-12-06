const mongoose = require('mongoose')

const techniqueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  timing: String,
  direction: String,
  description: String,
  demonstration: String,
  demonstrationComment: String,
  sequences: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sequence'
    }
  ],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Technique', techniqueSchema)
