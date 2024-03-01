const mongoose = require("mongoose");
const dotenv = require("dotenv").config({ path: "./config.env" });

// process.on("uncaughtException", (err) => {
//   console.log(err.name, err.message);
//   console.log("Uncaught Exception occured. Shutting down...");
//   process.exit(1)
// })
const app = require("./app");
const port = process.env.PORT || 4000;
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
  })
  .then((conn) => {
    console.log("database connected successfully");
    // console.log(conn);
  })
  // .catch((err) => {
  //   console.log(err);
  // });
const server = app.listen(port, () => {
  console.log(`server is running on : ${port}`);
  // console.log(process.env);
});

// process.on("unhandledRejection", (err) => {
//   console.log(err.name, err.message);
//   console.log("Unhandled rejection occured. Shutting down...");
//   server.close(() => {
//     process.exit(1);
//   });
// });
