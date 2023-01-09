const AppError = require("./../utils/appError");

const sendErrorDev = (error, req, res) => {
    //API
    if (req.originalUrl.startsWith("/api"))
        //Development Error: send all possible information
        res.status(error.statusCode).json({
            status: error.status,
            error,
            message: error.message,
            stack: error.stack,
        });
    //RENDERED WEBSITE
    else {
        console.error("ERROR: " + error);
        res.status(error.statusCode).render("error", {
            title: "Something went wrong",
            msg: error.message,
        });
    }
};

const sendErrorProd = (error, req, res) => {
    if (req.originalUrl.startsWith("/api")) {
        //FOR API ONLY
        //Operational error (leak information to client since error is known): send message to client
        if (error.isOperational) {
            res.status(error.statusCode).json({
                status: error.status,
                message: error.message,
            });
        } else {
            //An error that occurs through unknown/other means
            //1) Log Error
            console.error("ERROR: " + error);
            //2) Send a Generic Message
            res.status(500).json({
                status: "error",
                message: "Something went very wrong",
            });
        }
    } else {
        //RENDERED WEBSITE
        if (error.isOperational) {
            res.status(error.statusCode).render("error", {
                title: "Something went wrong",
                msg: error.message,
            });
        } else {
            //An error that occurs through unknown/other means
            //1) Log Error
            console.error("ERROR: " + error);
            //2) Send a Generic Message
            res.status(error.statusCode).render("error", {
                title: "Something went wrong",
                msg: "Please try again later",
            });
        }
    }
};

function handleCastErrorDB(error) {
    const message = `Invalid ${error.path}: ${error.value}`;
    return new AppError(message, 400);
}

function handleDuplicateFieldsDB(error) {
    const value = error.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please enter a correct field value`;
    return new AppError(message, 400);
}

function handleValidationErrorDB(error) {
    const errors = Object.values(error.errors).map((err) => err.message);

    const message = `Invalid input data. ${errors.join(". ")}`;
    return new AppError(message, 400);
}

function handleJWTError() {
    return new AppError("Invalid token. Please log in again!", 401);
}

function handleJWTExpiredError() {
    return new AppError("Your token has expired! Please login in again!", 401);
}

module.exports = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || "error";

    if (process.env.NODE_ENV === "development") {
        sendErrorDev(error, req, res);
    } else if ((process.env.NODE_ENV = "production")) {
        let err = { ...error };
        err.message = error.message;
        if (err?.name === "CastError") err = handleCastErrorDB(err); //Make a mongoose/mongodb error into an operational error
        if (err?.code === 11000) err = handleDuplicateFieldsDB(err);
        if (err?.name === "ValidationError") err = handleValidationErrorDB(err);
        if (err?.name === "JsonWebTokenError") err = handleJWTError();
        if (err?.name === "TokenExpiredError") err = handleJWTExpiredError();
        sendErrorProd(err, req, res);
    }
};
