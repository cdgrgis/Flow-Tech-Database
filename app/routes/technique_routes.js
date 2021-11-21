// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for techniques
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
// { technique: { title: '', text: 'foo' } } -> { technique: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })


// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /techniques
router.get('/', requireToken, (req, res, next) => {
  Technique.find()
    // Populate the owner key in the technique document
    .populate('owner')
    // respond with status 200 and JSON of the techniques
    .then(techniques => res.status(200).json({ techniques: techniques }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /techniques/5a7db6c74d55bc51bdf39793
router.get('/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Technique.findById(req.params.id)
    // Populate the owner key in the technique document
    .populate('owner')
    .then(handle404)
    // if `findById` is successful, respond with 200 and "technique" JSON
    .then(technique => res.status(200).json({ technique: technique }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /techniques
router.post('/', requireToken, (req, res, next) => {
  // set owner of new technique to be current user
  req.body.technique.owner = req.user.id
  let techniqueId 
  
  Technique.create(req.body.technique)
    // respond to successful `create` with status 201 and JSON of new "technique"
    .then(technique => {
      techniqueId = technique._id
      res.status(201).json({ technique })
    })
    .then(() => User.findById(req.user.id))
    .then(user => {
      user.techniques.push(techniqueId)
      return user.save()
    })

    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /techniques/5a7db6c74d55bc51bdf39793
router.patch('/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.technique.owner

  Technique.findById(req.params.id)
    .then(handle404)
    // ensure the signed in user (req.user.id) is the same as the technique's owner (technique.owner)
    .then(technique => requireOwnership(req, technique))
    // updating technique object with techniqueData
    .then(technique => technique.updateOne(req.body.technique))
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /techniques/5a7db6c74d55bc51bdf39793
router.delete('/:id', requireToken, (req, res, next) => {
  Technique.findById(req.params.id)
    .then(handle404)
     // ensure the signed in user (req.user.id) is the same as the technique's owner (technique.owner)
    .then(technique => requireOwnership(req, technique))
    // delete technique from mongodb
    .then(technique => technique.deleteOne())
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

router.patch('/:techniqueId/add-relationship', requireToken, (req, res, next) => {
  const techniqueId = req.params.techniqueId
  const userId = req.body.technique.userId

  User.findById(userId)
    .then(user => {
      user.techniques.push(techniqueId)
      return user.save()
    })
    .then(() => res.sendStatus(204))
    .catch(next)
})

module.exports = router
