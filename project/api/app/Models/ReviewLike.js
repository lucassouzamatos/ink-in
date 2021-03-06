'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ReviewLike extends Model {
  user () {
    return this.hasOne('App/Models/User', 'user_id', 'id')
  }

  review () {
    return this.hasOne('App/Models/Review', 'review_id', 'id')
  }
}

module.exports = ReviewLike
