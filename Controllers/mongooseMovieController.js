const Movie = require("../Models/movieModel");
const Apifeatures = require("../Utils/apiFeatures");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");
const customError = require("../Utils/customError");

exports.getHighestRatedMovie = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratings";

  next();
};
exports.createMovie = asyncErrorHandler(async (req, res, next) => {
  const movie = await Movie.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      movie,
    },
  });
});

exports.getMovies = asyncErrorHandler(async (req, res, next) => {
  const features = new Apifeatures(Movie.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate(); //Not Working
  let movies = await features.query;
  //Advance filtering by Query search: http://localhost:4000/api/v1/movies?duration[gte]=135&ratings[gte]=7.9&price[lte]=58&sort=1&page=12
  //Exclude fields from query object
  // let queryObj = { ...req.query };
  //If we want to exclude any query field ==>
  // const excludeFields = ["sort", "page", "limit", "fields"];
  // excludeFields.forEach((el) => {
  //   delete queryObj[el];
  // });
  // let queryString = JSON.stringify(queryObj);
  // queryString = queryString.replace(
  //   /\b(gte|gt|lte|lt)\b/g,
  //   (match) => `$${match}`
  // );
  // queryObj = JSON.parse(queryString);
  // console.log(queryObj);
  // const movies = await Movie.find(queryObj);

  //Sorting Logic :==> http://localhost:4000/api/v1/movies?sort=-releaseYear,ratings
  // let query = Movie.find();
  // if (req.query.sort) {
  //   const sortBy = req.query.sort.split(",").join(" ");
  //   query = query.sort(sortBy);
  // } else {
  //   query = query.sort("-createdAt");
  // }

  //Limiting Fields :==> http://localhost:4000/api/v1/movies?fields=name,duration,ratings,price
  // if (req.query.fields) {
  //   const fields = req.query.fields.split(",").join(" ");
  //   query = query.select(fields);
  // } else {
  //   query = query.select("-__v");
  // }

  //Pagination:==> http://localhost:4000/api/v1/movies?page=2&limit=2&sort=_id
  // const page = req.query.page * 1 || 1;
  // const limit = req.query.limit * 1 || 10;
  // const skip = (page - 1) * limit;
  // query = query.skip(skip).limit(limit);
  // if (req.query.page) {
  //   const movieCount = await Movie.countDocuments();
  //   if (skip >= movieCount) {
  //     throw new Error("Page is not found");
  //   }
  // }
  // const movies = await query;
  //By mongoose method
  // const movies = await Movie.find()
  //   .where("duration")
  //   .gte(req.query.duration.gte*1)
  //   .where("ratings")
  //   .gte(req.query.ratings.gte*1)
  //   .where("price")
  //   .lte( req.query.price.lte*1);
  res.status(200).json({
    status: "success",
    count: movies.length,
    data: {
      movies,
    },
  });
});
exports.getMovieById = asyncErrorHandler(async (req, res, next) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) {
    const error = new customError("Movie with that id is not found");
    return next(error);
  }
  res.status(200).json({
    status: "success",
    data: {
      movie,
    },
  });
});
exports.updateMovieById = asyncErrorHandler(async (req, res, next) => {
  const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }); //{new:true} = returns the updated document. {runValidators:true} = It will check the validation agaist Schema.
  if (!updatedMovie) {
    const error = new customError("Movie with that id is not found");
    return next(error);
  }
  res.status(200).json({
    status: "success",
    data: {
      updatedMovie,
    },
  });
});
exports.deleteMovieById = asyncErrorHandler(async (req, res, next) => {
  const movie = await Movie.findByIdAndDelete(req.params.id);
  if (!movie) {
    const error = new customError("Movie with that id is not found");
    return next(error);
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getMovieStats = asyncErrorHandler(async (req, res, next) => {
  const stats = await Movie.aggregate([
    { $match: { ratings: { $gte: 5 } } },
    {
      $group: {
        _id: "$releaseYear",
        avgRating: { $avg: "$ratings" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        totalPrice: { $sum: "$price" },
        movieCount: { $sum: 1 },
      },
    },
    { $sort: { minPrice: 1 } },
    {
      $match: { maxPrice: { $gte: 20 } },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});
//
exports.getMovieByGenre = asyncErrorHandler(async (req, res, next) => {
  const genre = req.params.genre;
  const movies = await Movie.aggregate([
    { $unwind: "$genres" },
    {
      $group: {
        _id: "$genres",
        movieCount: { $sum: 1 },
        movies: { $push: "$name" },
      },
    },
    { $addFields: { genres: "$_id" } },
    { $project: { _id: 0 } },
    { $sort: { movieCount: -1 } },
    { $match: { genres: genre } },
  ]);
  res.status(200).json({
    status: "success",
    count: movies.length,
    data: {
      movies,
    },
  });
});
