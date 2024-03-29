'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Review extends Model {
  user () {
    return this.hasOne('App/Models/User', 'user_id', 'id')
  }

  likes () {
    return this.hasMany('App/Models/ReviewLike')
  }
}

module.exports = Review
