"use strict";

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Art = use("App/Models/Art");
const User = use("App/Models/User");
const City = use("App/Models/City");
const Notification = use("App/Models/Notification");
const Database = use("Database");
const BaseController = use("App/Controllers/Http/BaseController");
const FileUpload = use("FileUpload");
const UserBusiness = use("UserBusiness");
const moment = require("moment");

/**
 * Resourceful controller for interacting with arts
 */
class ArtController extends BaseController {
  /**
   * Show a list of all arts.
   * GET arts
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */

  async index ({ request, response, auth }) {
    const {
      user_id,
      title,
      distance,
      style_id,
      order_by,
      order
    } = request.get();

    let user = await auth.getUser();

    const arts = Art.query().with("style");

    if (order_by) {
      arts.orderBy(order_by, order ? order : null)
    }

    if (title) {
      arts.where("title", "ILIKE", `%${title}%`);
    }

    if (user_id) {
      arts.where("user_id", user_id);

      return this.responseSuccess({
        response,
        statusCode: 200,
        data: {
          arts: await arts.fetch()
        }
      });
    }

    const interests = await Database.table("interests")
      .select("style_id")
      .where("user_id", user.id)
      .map(interest => interest.style_id)

    if (style_id) {
      arts
        .where("style_id", style_id)
    }

    if (user.city_id) {
      const { lon, lat }  = await City.find(user.city_id)
      arts.nearBy(lat, lon, user_id ? null : distance)
    }

    if (!user.isStudio()) {
      arts.orderByInterests(interests)
    }

    return this.responseSuccess({
      response,
      statusCode: 200,
      data: {
        arts: await arts.fetch()
      }
    });
  }

  /**
   * Create/save a new art.
   * POST arts
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, auth }) {
    let image = request.file("image", {
      types: ["image"],
      size: "10mb"
    });

    const data = request.only([
      "title",
      "description",
      "path",
      "price",
      "dimensions",
      "user_id",
      "style_id",
      "duration"
    ]);

    try {
      image = await FileUpload.upload(image);
    } catch (e) {
      return this.responseError({
        response,
        statusCode: 400,
        errors: e.message
      });
    }

    let currentUser = await auth.getUser();
    if (data.user_id) {
      const user = await User.find(data.user_id);
      if (!user) {
        return this.responseError({
          response,
          statusCode: 400,
          errors: ["Usuário não encontrado"]
        });
      }

      if (!user.isArtist()) {
        return this.responseError({
          response,
          statusCode: 400,
          errors: ["Arte só pode ser cadastrada para artistas"]
        });
      }

      if (await UserBusiness.belongsToStudio(user, currentUser)) {
        await Notification.create({
          user_id: user.id,
          description: `O estúdio ${currentUser.username} adicionou uma nova arte ao seu perfil`
        })
        currentUser = user;
      }
    }

    let art = await Art.create({
      ...data,
      user_id: currentUser.id,
      path: "/uploads/" + image.fileName
    });

    art = await Art.query()
      .where("id", art.id)
      .with("style")
      .first();

    return this.responseSuccess({
      response,
      statusCode: 200,
      data: { art }
    });
  }

  /**
   * Display a single art.
   * GET arts/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const { id } = params;
    if (!id) {
      return this.responseError({
        response,
        statusCode: 400,
        errors: ["Arte não especificada"]
      });
    }

    const art = await Art.query()
      .where("id", id)
      .with("style")
      .with("user", builder => {
        builder.with("city", builder => {
          builder.with("state");
        });
        builder.with("schedule", builder => {
          builder.with("scheduleDates", builder => {
            builder
              .where("date", ">", moment().format("YYYY-MM-DD hh:mm"))
              .orderBy("date");
          });
        });
      })
      .first();

    if (!art) {
      return this.responseError({
        response,
        statusCode: 400,
        errors: ["Arte não encontrada"]
      });
    }

    return this.responseSuccess({
      response,
      statusCode: 200,
      data: art
    });
  }

  /**
   * Update art details.
   * PUT or PATCH arts/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {}

  /**
   * Delete a art with id.
   * DELETE arts/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {}
}

module.exports = ArtController;
