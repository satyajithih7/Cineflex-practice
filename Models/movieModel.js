const mongoose = require("mongoose");
const fs = require("fs");
const validator = require("validator")
const movieSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      maxlength: [100, "Movie name must not have more than 100 characters"],
      minlength: [3, "Movie name must have more than 3 characters"],
      unique: true,
      trim: true,
      validate : [validator.isAlphanumeric, "Name should only contain alpha numeric value"]
    },
    description: {
      type: String,
      required: [true, "description is required"],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
    },
    ratings: {
      type: Number,
      // max: [10, "Ratings must not have more than 10"],
      // min:[1, "Ratings must have more than 1"]

      //Creating Custom Validator:
      validate: {
        validator: function (value) {
          return value >= 1 && value <= 10;
        },
        message:"Ratings({VALUE}) should be within 1 to 10"
      },
    },
    totlaRating: {
      type: Number,
    },
    releaseYear: {
      type: Number,
      required: [true, "Release year is required"],
    },
    releaseDate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    genres: {
      type: [String],
      required: [true, "Genres is required"],
      enum: {
        values: [
          "Action",
          "Adventure",
          "Sci-Fi",
          "Thriller",
          "Crime",
          "Drama",
          "Comedy",
          "Romance",
          "Biography",
        ],
        message: "This genre does not exist",
      },
    },
    directors: {
      type: [String],
      required: [true, "Director name year is required"],
    },
    coverImage: {
      type: String,
      required: [true, "Cover image is required"],
    },
    actors: {
      type: [String],
      required: [true, "Actor name is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    createdBy: String,
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
//Virtual property in Mongoose
movieSchema.virtual("durationInHours").get(function () {
  return (this.duration / 60).toFixed(2);
}); //We can no virtual properties to query documents.

//Hooks & Middleware in mongoose :
//Document Middleware
//Pre Hook ==>
movieSchema.pre("save", function (next) {
  this.createdBy = "s.maity"; //"this" will return the document of the save method.
  next();
});
//Post Hook ==>
movieSchema.post("save", function (doc, next) {
  let content = `A new movie document name ${doc.name} is inserted by ${doc.createdBy}.\n`;
  fs.writeFileSync("./Log/log.txt", content, { flag: "a" }, (err) => {
    console.log(err);
  });
  next();
});

//Query Middleware:
movieSchema.pre(/^find/, function (next) {
  this.find({ releaseDate: { $lte: Date.now() } }); //"this" will reurn the query of find method.
  this.startTime = Date.now();
  next();
});
movieSchema.post(/^find/, function (docs, next) {
  this.find({ releaseDate: { $lte: Date.now() } });
  this.endTime = Date.now();
  let content = `Query took ${
    this.endTime - this.startTime       //To calculate the query timing 
  } milliseconds to fetch the data.\n`;
  fs.writeFileSync("./Log/log.txt", content, { flag: "a" }, (err) => {
    console.log(err);
  });
  next();
});

//Aggregation middleware:
movieSchema.pre("aggregate", function (next) {
  console.log(
    this.pipeline().unshift({ $match: { releaseDate: { $lte: new Date() } } })
  ); //"this" will return aggregation object.
  next();
});
const movieModel = mongoose.model("Movie", movieSchema);

module.exports = movieModel;
