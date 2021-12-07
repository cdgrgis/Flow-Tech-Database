# Flow Technique Server

This is a site to store and share flow techniques (tricks, moves) and sequences which are a chain of techniques. You can add a description, video demonstration, and video comment to each technique for the opportunity to spread your knowledge to other flow artists. 

I originally started this as a project for my Software Engineering boot camp with General Assembly.

In planning for this project, I completed the User model and routes first, followed by the Technique model and route, and finished with the Sequence model and routes. My public launch date is currently 1/01/2022.

## Setup Steps
  1. Fork and clone this repository
  2. Run `npm install` to install all dependencies.
  3. Use `grunt serve` to start up server.

## Important Links
[Flow Technique Database] (https://cdgrgis.github.io/flowtech-client)

## User Model
 - email (required)
 - hashedPassword (required)
 - userName
 - picture
 - techniques[ref:'Technique']
 - sequences[ref:'Sequence']

## Technique Model
 - name (required)
 - timing
 - direction
 - description
 - demonstration
 - demonstrationComment
  
## Sequence Model
 - name
 - techniques:[ref:'Technique']
 - owner: ref:'Owner'