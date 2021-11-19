const mongoose = require('mongoose')

const techniqueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  timing: {
    type: String,
    required: true
  },
  direction: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Technique', techniqueSchema)
