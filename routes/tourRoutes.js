const express = require("express");
const { protect, restrictTo } = require("./../controllers/authController");
const {
    getAllTours,
    getSingleTour,
    createTour,
    updateTour,
    deleteTour,
    aliasTopTours,
    getTourStats,
    getMonthlyPlan,
    getToursWithin,
    getDistances,
} = require("./../controllers/tourController");
const reviewRouter = require("./reviewRoutes");

const tourRouter = express.Router();

// //Implementing routes for users and their reviews
// tourRouter
//     .route("/:tourId/reviews")
//     .post(protect, restrictTo("user"), createReview);
//POST /tour/tour._id/reviews (this is the url that you would like to route on a tour)
//GET /tour/tour._id/reviews (this is the url that you would like to route on a tour)
//GET /tour/tour._id/reviews/review._id (this is the url that you would like to route on a tour)
tourRouter.use("/:tourId/reviews", reviewRouter); //Mounting a router; use the reviewRouter if you encounter this route

tourRouter.route("/top-5-cheap").get(aliasTopTours, getAllTours);
tourRouter.route("/tour-stats").get(getTourStats);
tourRouter
    .route("/monthly-plan/:year")
    .get(protect, restrictTo("admin", "lead-guide", "guide"), getMonthlyPlan);
// tourRouter.param("id", checkID);

//ADDING GEOSPATIAL QUERIES
tourRouter
    .route("/tours-within/:distance/center/:latlng/unit/:unit?")
    .get(getToursWithin);
//GEOSPATIAL AGGREGATION
tourRouter.route("/distances/:latlng/unit/:unit").get(getDistances);

// tourRouter.route("/").get(getAllTours).post(checkBody, createTour); //Root of the router root
tourRouter
    .route("/")
    .get(getAllTours)
    .post(protect, restrictTo("admin", "lead-guide"), createTour); //No authorization; everyone should be able to access it
tourRouter
    .route("/:id")
    .get(getSingleTour)
    .patch(protect, restrictTo("admin", "lead-guide"), updateTour)
    .delete(protect, restrictTo("admin", "lead-guide"), deleteTour);

module.exports = tourRouter;
