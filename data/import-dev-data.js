const mongoose = require("mongoose");
const fs = require("fs");
const Movie = require("../Models/movieModel");
const dotenv = require("dotenv").config({ path: "./config.env" });

mongoose
  .connect(process.env.MONGO_URI, {
    UseNewUrlParser: true,
  })
  .then((conn) => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.log(err);
  });

//Read the movies.json file
const movies = JSON.parse(fs.readFileSync("./data/movies.json", "utf-8"));
//delete existing movie document from collection
const deleteMovies = async () => {
  try {
      await Movie.deleteMany();
      console.log("data successfully deleted");
  } catch (error) {
    console.log(error.message);
    }
    process.exit()
};

//Import movie data to movies.json file
const importMovies = async () => {
  try {
      await Movie.create(movies);
      console.log("data successfully imported");
  } catch (error) {
    console.log(err.message);
    }
    process.exit()
};

if (process.argv[2] === "--import") {
    importMovies()
}
if (process.argv[2] === "--delete") {
    deleteMovies()
}

console.log(process.argv); //process.argv is a property that holds an array of command-line values provided when the current process was initiated. The first element in the array is the absolute path to the Node, followed by the path to the file that's running and finally any command-line arguments provided when the process was initiated.
