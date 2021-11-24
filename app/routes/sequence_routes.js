// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for sequences
const Sequence = require('../models/sequence')

// pull in Mongoose model for sequences
const Technique = require('../models/technique')

// pull in Mongoose model for users
const User = require('../models/user')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existent document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { sequence: { title: '', text: 'foo' } } -> { sequence: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })


// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /sequences
router.get('/', requireToken, (req, res, next) => {
  Sequence.find()
    // Populate the sequence property in the sequence document
    .populate('techniques')
    // Populate the owner property in the sequence document
    .populate('owner')
    // respond with status 200 and JSON of the sequences
    .then(sequences => res.status(200).json({ sequences }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /sequences/5a7db6c74d55bc51bdf39793
router.get('/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Sequence.findById(req.params.id)
    // Populate the technique property in the sequence document
    .populate('techniques')
    // Populate the owner property in the sequence document
    .populate('owner')
    .then(handle404)
    // if `findById` is successful, respond with 200 and "sequence" JSON
    .then(sequence => res.status(200).json({ sequence }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /sequences
router.post('/', requireToken, (req, res, next) => {
  // set owner of new sequence to be current user
  req.body.sequence.owner = req.user.id
  console.log('user ', req.user)
  
  const techniqueIdArray = [Object.values(req.body.sequence.techniques)]
  
  
  let sequenceData 
 console.log('tech id array ', techniqueIdArray)
  
  console.log('api sequence incoming ', req.body.sequence)
  
  Sequence.create(req.body.sequence)
    
    // respond to successful `create` with status 201 and JSON of new "sequence"
    .then(sequence => {
      sequenceData = sequence
    
    })
    .then(() => User.findById(req.user._id))
    .then(user => {
      
      user.sequences.push(sequenceData._id)
      return user.save()
    })

    // Find technique by ids
    .then(() => {
      Technique.findById.all(techniqueIdArray).then(value => console.log(value))
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .then(() => res.status(201).json({ sequenceData }))
    .catch(next)
})

// UPDATE
// PATCH /sequences/5a7db6c74d55bc51bdf39793
router.patch('/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.sequence.owner

  Sequence.findById(req.params.id)
    .then(handle404)
    // ensure the signed in user (req.user.id) is the same as the sequence's owner (sequence.owner)
    .then(sequence => requireOwnership(req, sequence))
    // updating sequence object with sequenceData
    .then(sequence => sequence.updateOne(req.body.sequence))
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /sequences/5a7db6c74d55bc51bdf39793
router.delete('/:id', requireToken, (req, res, next) => {
  console.log('tech id ', req.params.id)
  console.log('user id ', req.user.id)
  Sequence.findById(req.params.id)
    .then(handle404)
     // ensure the signed in user (req.user.id) is the same as the sequence's owner (sequence.owner)
    .then(sequence => requireOwnership(req, sequence))
    // delete sequence from mongodb
    .then(sequence => sequence.deleteOne())
    // GET user
    .then(() => User.findById(req.user.id))
    // remove sequence from user's sequences array
    .then(user => {
      user.sequences.pull(req.params.id)
      return user.save()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

router.patch('/:id/relationships', requireToken, (req, res, next) => {
  const sequenceId = req.params.sequenceId
  const userId = req.body.sequence.userId

  User.findById(userId)
    .then(user => {
      user.sequences.push(sequenceId)
      return user.save()
    })
    .then(() => res.sendStatus(204))
    .catch(next)
})

router.delete('/:id/relationships', requireToken, (req, res, next) => {
  const sequenceId = req.params.id
  const userId = req.user.id
  
  User.findById(userId)
    .then(user => {
      user.sequences.pull(sequenceId)

      return user.save()
    })
    .then(res.sendStatus(204))
    .catch(next)
})

module.exports = router
