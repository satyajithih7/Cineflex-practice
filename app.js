const express = require("express");
const morgan = require("morgan");
const moviesRouter = require("./Routes/moviesRoutes");
const authRouter = require("./Routes/authRoutes.js");
const userRouter = require("./Routes/userRoute.js");
const customError = require("./Utils/customError.js");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet"); //To save the app from cross-origin threads.
const sanitize = require("express-mongo-sanitize"); //To save the app from any nosql data received from req.body.
const xss = require("xss-clean"); //To save the app from any HTML code data received from req.body.
const globalErrorHandler = require("./Controllers/errorController.js");
const app = express();
// const logger = function (req, res, next) {
//   console.log("Custom middleware called");
//   next();
// };
const limiter = rateLimit({
  max: 3,
  windowMs: 60 * 60 * 1000,
  message:
    "We have received too many request from this IP. Please try after 1 hour.",
});
app.use(helmet());
app.use("/api", limiter);
app.use(express.static("./public"));
app.use(express.json({ limit: "10kb" })); //To limit the date within 10kb received from req.body..
// app.use(logger);
app.use(sanitize());
app.use(xss());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use((req, res, next) => {
  req.requestedAt = new Date().toISOString();
  next();
});

//Using routes
app.use("/api/v1/movies", moviesRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.all("*", (req, res, next) => {
  // res.status(404).json({
  //   status: "fail",
  //   message: `Can't find ${req.originalUrl} in the server.`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} in the server.`);
  // err.statusCode = 404;
  // err.status = "fail";
  // next(err)

  const err = new customError(
    `Can't find ${req.originalUrl} in the server.`,
    404
  );
  next(err);
});

app.use(globalErrorHandler);

module.exports = app;
