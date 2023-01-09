const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const path = require("path");

const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const viewRouter = require("./routes/viewRoutes");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

//Body parser, reading data from body into req.body
//Adding bodyparser middleware (middleware are added using the use method)
app.use(express.json({ limit: "10kb" })); //Adds data to the incoming request object
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
//SETTING VIEW ENGINE (pug which is already used in express)
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(cookieParser());
//Serve Static Files
app.use(express.static(path.join(__dirname, "public")));

// 1) GLOBAL Middleware
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

//SET SECURITY http HEADERS
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'", "https:", "http:", "data:", "ws:"],
            baseUri: ["'self'"],
            fontSrc: ["'self'", "https:", "http:", "data:"],
            scriptSrc: ["'self'", "https:", "http:", "blob:"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
        },
    })
); //Sets Security Headers

//Limit requests from same IP
const limiter = rateLimit({
    max: 100, //Max number of requests allowed from the same IP
    windowMs: 60 * 60 * 1000, //Number of requests allowed per hour
    message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

//DATA SANITIZATION - clean incoming data against NOSQL Query Injection and XSS (Cross-Site Scripting Attacks)
app.use(mongoSanitize()); //Filters out mongoDB operators from any Queries provided to fields
app.use(xss());

//Preventing parameter pollution (clears duplicate fields; duplicate fields in query is converted to array in express, possibly breaks code)
app.use(
    hpp({
        whitelist: [
            "duration",
            "ratingAverage",
            "ratingQuantity",
            "maxGroupSize",
            "difficulty",
            "price",
        ], //properties where duplicates are allowed
    })
); //Will use the query in the last duplicate fields

//Simple middleware

app.use("/", (req, res, next) => {
    //console.log(req.headers);
    req.requestTime = new Date().toISOString();
    //console.log(req.cookies);
    next();
});

// 3) Routes
app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter); //Referred to as mouting a router to a route
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

app.all("*", (req, res, next) => {
    //Handle all routes for all HTTP methods
    // res.status(404).json({
    //     status: "fail",
    //     message: `${req.originalUrl} could not be found`,
    // });
    //This middleware could be used to handle operational errors (errors made by the user)

    // const error = new Error(`${req.originalUrl} could not be found`);
    // error.status = "fail";
    // error.statusCode = 404;

    next(new AppError(`${req.originalUrl} could not be found`, 404)); //Whenever something is passed into next, error will be passed into global error handling middleware
});

app.use(globalErrorHandler);

module.exports.app = app;
