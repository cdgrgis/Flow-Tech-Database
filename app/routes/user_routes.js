const express = require('express')
// jsonwebtoken docs: https://github.com/auth0/node-jsonwebtoken
const crypto = require('crypto')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')
// bcrypt docs: https://github.com/kelektiv/node.bcrypt.js
const bcrypt = require('bcrypt')

// see above for explanation of "salting", 10 rounds is recommended
const bcryptSaltRounds = 10

// pull in error types and the logic to handle them and set status codes
const errors = require('../../lib/custom_errors')

const BadParamsError = errors.BadParamsError
const BadCredentialsError = errors.BadCredentialsError

const User = require('../models/user')

// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `res.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()



// GET USERS

router.get('/users', (req, res, next) => {
  User.find()
    .populate('techniques')
    .then(users => console.log(users))
    .then(users => res.status(200).json({ users }))
    .catch(next)
})

router.post('/users/username', requireToken, (req, res, next) => {
  console.log('body ', req.body)
  const userNameData = req.body.credentials.userName
  console.log('username ', userNameData)
  let userId = ''

  User.findOne({ userName: userNameData})
    .populate('techniques')
    .populate('sequences')
    .populate({
      path: 'sequences',
      populate: {
        path: 'techniques',
        model: 'Technique'
      }
    })
    .then((user) => res.status(200).json({ user }))
    .catch(next)
})


// GET one User
router.get('/users/:id', requireToken, (req, res, next) => {
  
  console.log('user id ', req.user.id)
  
  User.findById(req.user.id)
    .populate('techniques')
    .populate('sequences')
    .populate({
      path: 'sequences',
      populate: {
        path: 'techniques',
        model: 'Technique'
      }
    })
    .then(user => {
       
      console.log('user data ', user)
   
      return user
    })
    .then((user) => res.status(200).json({ user }))
    .catch(next)
})




// SIGN UP
// POST /sign-up
router.post('/sign-up', (req, res, next) => {
  // start a promise chain, so that any errors will pass to `handle`
  Promise.resolve(req.body.credentials)
    // reject any requests where `credentials.password` is not present, or where
    // the password is an empty string
    .then(credentials => {
      if (!credentials ||
          !credentials.password ||
          credentials.password !== credentials.password_confirmation) {
        throw new BadParamsError()
      }
    })
    // generate a hash from the provided password, returning a promise
    .then(() => bcrypt.hash(req.body.credentials.password, bcryptSaltRounds))
    .then(hash => {
      // return necessary params to create a user
      return {
        email: req.body.credentials.email,
        hashedPassword: hash,
        userName: req.body.credentials.user_name,
        picture: req.body.credentials.picture
      }
    })
    // create user with provided email and hashed password
    .then(user => User.create(user))
    // send the new user object back with status 201, but `hashedPassword`
    // won't be send because of the `transform` in the User model
    .then(user => res.status(201).json({ user: user }))
    // pass any errors along to the error handler
    .catch(next)
})

// SIGN IN
// POST /sign-in
router.post('/sign-in', (req, res, next) => {
  const pw = req.body.credentials.password
  let user

  // find a user based on the email that was passed
  User.findOne({ email: req.body.credentials.email })
    .then(record => {
      // if we didn't find a user with that email, send 401
      if (!record) {
        throw new BadCredentialsError()
      }
      // save the found user outside the promise chain
      user = record
      // `bcrypt.compare` will return true if the result of hashing `pw`
      // is exactly equal to the hashed password stored in the DB
      return bcrypt.compare(pw, user.hashedPassword)
    })
    .then(correctPassword => {
      // if password does not match
      if (!correctPassword) {
        //  then throw a BadCredentialsError
        throw new BadCredentialsError()
      }

      // create a token using crypto that is 16 bytes long in hexadecimal
      // https://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback
      const token = crypto.randomBytes(16).toString('hex')
      // add token to user
      user.token = token
      // save user
      return user.save()
    })
    .then(user => {
      // return status 201, the email, and the new token
      res.status(201).json({ user: user })
    })
    .catch(next)
})

// CHANGE password
// PATCH /change-password
router.patch('/change-password', requireToken, (req, res, next) => {
  let user
  // `req.user` will be determined by decoding the token payload
  User.findById(req.user.id)
    // save user outside the promise chain
    .then(record => { user = record })
    // check that the old password is correct
    .then(() => bcrypt.compare(req.body.passwords.old, user.hashedPassword))
    // `correctPassword` will be true if hashing the old password ends up the
    // same as `user.hashedPassword`
    .then(correctPassword => {
      // throw an error if the new password is missing, an empty string,
      // or the old password was wrong
      if (!req.body.passwords.new || !correctPassword) {
        throw new BadParamsError()
      }
    })
    // hash the new password
    .then(() => bcrypt.hash(req.body.passwords.new, bcryptSaltRounds))
    .then(hash => {
      // set and save the new hashed password in the DB
      user.hashedPassword = hash
      return user.save()
    })
    // respond with no content and status 200
    .then(() => res.sendStatus(204))
    // pass any errors along to the error handler
    .catch(next)
})

router.patch('/update-user', requireToken, (req, res, next) => {
 
  // we don't know the name of the object in `req.body`, so we'll apply this to
  // ALL objects in `req.body`
  Object.values(req.body).forEach(obj => {
    for (const key in obj) {
      if (obj[key] === '') {
        // removes both the key and the value, preventing it from being updated
        delete obj[key]
      }
    }
  })

  console.log('userData ', req.body.userData)
  console.log('user ', req.user)
  console.log('username ', req.body.userData.userName)

  User.findById(req.user._id)
    .then(user => {
      Object.keys(req.body.userData).forEach(key => {
        console.log('key', req.body.userData[key])
        user[key] = req.body.userData[key]
        return user.save()
      })
    })
    .then(() => res.sendStatus(204))
    .catch(next)
})

router.delete('/sign-out', requireToken, (req, res, next) => {
  // create a new random token for the user, invalidating the current one
  req.user.token = null
  // save the token and respond with 204
  req.user.save()
    .then(() => res.sendStatus(204))
    .catch(next)
})

module.exports = router
