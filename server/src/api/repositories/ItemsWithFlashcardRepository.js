// @flow
import _ from 'lodash'
import { Collection, ObjectId } from 'mongodb'
import moment from 'moment'
import { MongoRepository } from './MongoRepository'
import getItemsWithFlashcardsByCount from '../tools/getItemsWithFlashcardsByCount'

class ItemsWithFlashcardRepository extends MongoRepository {
  flashcardsCollection: Collection
  itemsCollection: Collection

  init () {
    this.flashcardsCollection = this.db.collection('flashcards')
    this.itemsCollection = this.db.collection('items')
  }

  async getItemsWithFlashcard (userId: string, isCasual: Boolean) {
    let currentItemsQuery = {
      userId: new ObjectId(userId),
      $or: [
        { actualTimesRepeated: 0 },
        { extraRepeatToday: true },
        { nextRepetition: { $lte: moment().unix() } },
      ]
    }
    const isCasualQuery = { $and: [
      { isCasual: { $eq: true } }
    ]}
    if(isCasual) {
      currentItemsQuery = _.extend({}, currentItemsQuery, isCasualQuery)
    }
    // currently changed to fetching only one current item, after testing and approving, code below should be refactored
    const currentItems = await this.itemsCollection.find(currentItemsQuery, {limit: 1, sort: {lastRepetition: 1} }).toArray()
    const flashcards = await this.flashcardsCollection.find({_id: {$in: currentItems.map(item =>  new ObjectId(item.flashcardId))}}).toArray()

    return currentItems.map(item => {
      return {
        item,
        flashcard: flashcards.find(flashcard => flashcard._id.equals(item.flashcardId))
      }
    })
  }

  async getSessionCount (userId: string, isCasual: Boolean) {
    let currentItemsQuery = {
      userId: new ObjectId(userId),
      $or: [
        { actualTimesRepeated: 0 },
        { lastRepetition: { $gte: moment().subtract(3, 'hours').unix() } },
        { nextRepetition: { $lte: moment().unix() } }
      ]
    }
    const isCasualQuery = { $and: [
      { isCasual: { $eq: true } }
    ]}
    if(isCasual) {
      currentItemsQuery = _.extend({}, currentItemsQuery, isCasualQuery)
    }
    const items = await this.itemsCollection.find(currentItemsQuery).toArray()

    return getItemsWithFlashcardsByCount(items)
  }
}

export const itemsWithFlashcardRepository = new ItemsWithFlashcardRepository()
