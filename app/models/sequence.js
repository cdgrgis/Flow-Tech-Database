const mongoose = require('mongoose')

const sequenceSchema = new mongoose.Schema({
  name: String,
  techniques: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technique'
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

module.exports = mongoose.model('Sequence', sequenceSchema)
