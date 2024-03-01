const customError = require("../Utils/customError");

const devErrors = (res, error) => {
  res.status(error.statusCode).json({
    status: error.statusCode,
    message: error.message,
    stacktrace: error.stack,
    error: error,
  });
};

const castErrorHandler = (err) => {
  const msg = `Invalid value ${err.value} for the path ${err.path}.`;
  return new customError(msg, 400);
};
const handleExpiredJWT = (err) => {
  return new customError("JWT token expired. Please login again.",400);
};
const handleJWTerror = (err) => {
  return new customError("invalid token. Please login again.", 400)
}
const duplicatekeyErrorHandler = (error) => {
  const name = error.keyValue.name;
  const msg = `A movie name exists with name ${name}. Please use another name.`;
  return new customError(msg, 400);
};
const validationErrorHandler = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const errorMessages = errors.join(". ");
  const msg = `Invalid input data : ${errorMessages}`;
  return new customError(msg, 400);
};
const prodErrors = (res, error) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.statusCode,
      message: error.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Something went wrong.",
    });
  }
};

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "Some error occurred";
  if (process.env.NODE_ENV === "development") {
    devErrors(res, error);
  } else if (process.env.NODE_ENV === "production") {
    if (error.name === "CastError") {
      error = castErrorHandler(error);
    }
    if (error.code === 11000) {
      error = duplicatekeyErrorHandler(error);
    }
    if (error.name === "ValidationError") {
      error = validationErrorHandler(error);
      console.log(error);
    }
    if (error.name === "TokenExpiredError") {
      error = handleExpiredJWT(error);
    }
    if (error.name === "JsonWebTokenError") {
      error = handleJWTerror(error)
    }

    prodErrors(res, error);
  }
};
