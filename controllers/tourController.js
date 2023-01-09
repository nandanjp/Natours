const Tour = require("./../models/tourModel");
const APIFeatures = require("./../utils/apiFeatures");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");

const {
    deleteOne,
    updateOne,
    createOne,
    getOne,
    getAll,
} = require("./handlerFactory");
// const tours = JSON.parse(fs.readFileSync(pathToTours));

module.exports.aliasTopTours = (req, res, next) => {
    req.query.limit = "5";
    req.query.sort = "-ratingsAverage,price";
    req.query.fields = "name,price,ratingsAverage,summary,difficulty";
    next();
};

module.exports.getAllTours = getAll(Tour, APIFeatures, "tours", true);
module.exports.getSingleTour = getOne(
    Tour,
    "tour",
    "No tour found with the ID: ",
    undefined,
    "review"
);
module.exports.createTour = createOne(Tour, "newTour");
module.exports.updateTour = updateOne(
    Tour,
    "No tour found with the ID: ",
    "tour"
);
module.exports.deleteTour = deleteOne(
    Tour,
    "No tour found with the given ID: "
);

module.exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingAverage: { $gte: 4.5 } },
        },
        {
            $group: {
                //_id: "$ratingAverage", //Accumulate using all documents (not select ones)
                _id: { $toUpper: "$difficulty" },
                numTours: { $sum: 1 }, //For each tour in the collection, numTours increasing by 1
                numRatings: { $sum: "$ratingQuantity" },
                avgRating: { $avg: "$ratingAverage" },
                avgPrice: { $avg: "$price" },
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" },
            },
        },
        {
            $sort: { avgPrice: 1 }, //Must use this field as each subsequent stage works on result of previous
        },
        {
            $match: { _id: { $ne: "EASY" } }, //Since difficulty was changed to uppercase
        },
    ]);
    res.status(200).json({
        status: "success",
        data: {
            stats,
        },
    });
});

module.exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = +req.params.year; //2021
    const plan = await Tour.aggregate([
        {
            $unwind: "$startDates",
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: "$startDates" },
                numTourStarts: { $sum: 1 },
                tours: { $push: "$name" }, //Push a tour into an array
            },
        },
        {
            $addFields: { $month: "$_id" },
        },
        {
            $project: {
                _id: 0, //Does not show up
            },
        },
        {
            $sort: { numTourStarts: -1 },
        },
        {
            $limit: 12,
        },
    ]);
    res.status(200).json({
        status: "success",
        data: {
            plan,
        },
    });
});

module.exports.getToursWithin = catchAsync(async (req, res, next) => {
    //"/tours-within/:distance/center/:latlng/unit/:unit" eg. /tours-within/250/center/34.111745, -118.113491/unit/mi
    const { distance, latlng, unit } = req.params;
    const [lat, long] = latlng.split(",");

    if (!lat || !long)
        return void next(
            new AppError(
                "Please provide latitude and longitude in the format: lat, lng.",
                400
            )
        );
    const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[long, lat], radius] } }, //This is a geospatial query
    }); //Find documents within certain geometry
    //Find all tours within a sphere that has radius (in radians) at center of the longitude and latitude

    res.status(200).json({
        status: "success",
        message: `distance=${distance}, latitude=${lat}, longitude=${long}, unit=${unit}`,
        results: tours.length,
        data: {
            tours,
        },
    });
});

module.exports.getDistances = catchAsync(async (req, res, next) => {
    //"/tours-within/:distance/center/:latlng/unit/:unit" eg. /tours-within/250/center/34.111745, -118.113491/unit/mi
    const { latlng, unit } = req.params;
    const [lat, long] = latlng.split(",");

    if (!lat || !long)
        return void next(
            new AppError(
                "Please provide latitude and longitude in the format: lat, lng.",
                400
            )
        );

    const distances = await Tour.aggregate([
        {
            //geoNear: always first in geospatial aggregation (also one field must have GeoSpatial Index (like 2dsphere))
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [+long, +lat],
                },
                distanceField: "distance",
                distanceMultiplier: unit === "mi" ? 0.000621371 : 0.001,
            },
        },
        {
            $project: {
                distance: 1,
                name: 1,
            },
        },
    ]);

    res.status(200).json({
        status: "success",
        message: `latitude=${lat}, longitude=${long}, unit=${unit}`,
        results: distances.length,
        data: {
            distances,
        },
    });
});
