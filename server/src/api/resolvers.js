import fetch from 'node-fetch'
import returnItemAfterEvaluation from './tools/returnItemAfterEvaluation'
import facebookIds from '../configuration/facebook'
// import { sendMail } from './tools/emailService'

const resolvers = {
  Query: {
    Flashcards (root, args, context) {
      return context.Flashcards.getFlashcards()
    },
    Flashcard (root, args, context) {
      return context.Flashcards.getFlashcard(args._id)
    },
    async Lesson (root, args, context) {
      let nextLessonPosition
      if (context.user) {
        nextLessonPosition = await context.UserDetails.getNextLessonPosition(context.user._id)
      } else {
        nextLessonPosition = 1
      }
      return context.Lessons.getLessonByPosition(nextLessonPosition)
    },
    Lessons (root, args, context) {
      return context.Lessons.getLessons()
    },
    Item (root, args, context) {
      return context.Items.getItemById(args._id, context.user._id)
    },
    ItemsWithFlashcard (root, args, context) {
      if (context.user) {
        return context.ItemsWithFlashcard.getItemsWithFlashcard(context.user._id)
      } else {
        return []
      }
    },
    CurrentUser (root, args, context) {
      return context.user
    }
  },
  Mutation: {
    async createItemsAndMarkLessonAsWatched (root, args, context) {
      let userId = context.user && context.user._id
      if (!userId) {
        const guestUser = await context.Users.createGuest()
        console.log('Gozdecki: guestUser', guestUser)
        userId = guestUser._id
        context.req.logIn(guestUser, (err) => { if (err) throw err })
      }
      const currentLessonPosition = await context.UserDetails.getNextLessonPosition(userId)
      console.log('JMOZGAWA: currentLessonPosition', currentLessonPosition)
      const lesson = await context.Lessons.getLessonByPosition(currentLessonPosition)
      console.log('JMOZGAWA: lesson', lesson)
      const flashcardIds = lesson.flashcardIds
      // TODO THIS SPLICE HAS TO GO
      flashcardIds.splice(2)
      flashcardIds.forEach((flashcardId) => {
        context.Items.create(flashcardId, userId)
      })
      await context.UserDetails.updateNextLessonPosition(userId)
      const nextLessonPosition = await context.UserDetails.getNextLessonPosition(userId)
      return context.Lessons.getLessonByPosition(nextLessonPosition)
    },
    async logInWithFacebook (root, args, context) {
      const {accessToken: userToken} = args
      const requestUrl = `https://graph.facebook.com/debug_token?input_token=${userToken}&access_token=${facebookIds.appToken}`

      const res = await fetch(requestUrl)
      const parsedResponse = await res.json()
      if (parsedResponse.data.is_valid) {
        const facebookId = parsedResponse.data.user_id
        const user = await context.Users.findByFacebookId(facebookId)

        if (user) {
          context.req.logIn(user, (err) => { if (err) throw err })
          return user
        }
        const newUser = await context.Users.updateFacebookUser(context.user._id, facebookId)
        return newUser
      } else {
        return null
      }
    },
    async logIn (root, args, context) {
      try {
        const user = await context.Users.findByUsername(args.username)

        if (!user) {
          throw new Error('User not found')
        }

        const isMatch = await user.comparePassword(args.password)
        if (isMatch) {
          context.req.logIn(user, (err) => { if (err) throw err })
          return user
        }
      } catch (e) {
        throw e
      }
    },
    async logOut (root, args, context) {
      if (context.user) {
        context.req.logOut()
      }
      return {_id: 'loggedOut', username: 'loggedOut', activated: false}
    },
    async setUsernameAndPasswordForGuest (root, args, context) {
      let user = context.user
      if (!user) {
        user = await context.Users.createGuest()
      }

      return context.Users.updateUser(user._id, args.username, args.password)
    },
    async processEvaluation (root, args, context) {
      const item = await context.Items.getItemById(args.itemId, context.user._id)
      const newItem = returnItemAfterEvaluation(args.evaluation, item)
      // TODO move this to repository
      await context.Items.update(args.itemId, newItem, context.user._id)

      return context.ItemsWithFlashcard.getItemsWithFlashcard(context.user._id)
    },
    async resetPassword (root, args, context) {
      const updatedUser = await context.Users.resetUserPassword(args.username)
      if (updatedUser) {
        // TODO check after domain successfully verified, send email with reset link
        // sendMail({
        //     from: 'thebrain.pro',
        //     to: 'jmozgawa@thebrain.pro',
        //     subject: 'logInWithFacebook',
        //     text: 'THIS IS TEST MESSAGE'
        // });
        return {success: true}
      } else {
        return {success: false}
      }
    }
  }
}
//
process.on('unhandledRejection', (reason) => {
  // console.log('Reason: ' + reason)
  throw (reason);
})

export default resolvers
