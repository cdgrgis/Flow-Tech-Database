const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  hashedPassword: {
    type: String,
    required: true
  },
  userName: String,
  picture: String,
  techniques: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technique'
    }
  ],
  sequences: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sequence"
    }
  ],
  token: String
}, {
  timestamps: true,
  toJSON: {
    // remove `hashedPassword` field when we call `.toJSON`
    transform: (_doc, user) => {
      delete user.hashedPassword
      return user
    }
  }
})

module.exports = mongoose.model('User', userSchema)
