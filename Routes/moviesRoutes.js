const express = require("express");
const moviesController = require("../Controllers/mongooseMovieController");
const authController = require("../Controllers/authController")
const router = express.Router();

// router.param("id",moviesController.checkId)
//Aliasing routing
router
  .route("/highest-rated")
  .get(moviesController.getHighestRatedMovie, moviesController.getMovies);
router.route("/movie-stats").get(moviesController.getMovieStats)
  router.route("/getMovieByGenre/:genre?").get(moviesController.getMovieByGenre)
router
  .route("/")
  .get(authController.protect,moviesController.getMovies)
  .post(moviesController.createMovie);
router
  .route("/:id/:name?") //"?" is for optional paramter
  .get(authController.protect,moviesController.getMovieById)
  .patch(moviesController.updateMovieById)
  .delete(authController.protect, authController.restrict("admin", "superAdmin"), moviesController.deleteMovieById);

module.exports = router;
