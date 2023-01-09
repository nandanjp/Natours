// const tours = await Tour.find()
//     .where("duration")
//     .equals(5)
//     .where("difficulty")
//     .equals("easy"); ANOTHER WAY TO DO THIS

//1A) FILTERING
const queryObj = { ...req.query };
excludedFields.forEach((field) => {
    if (queryObj[field]) delete queryObj[field];
});

//1B) ADVANCED FILTERING
/**Normal filter object: { duration: { $gte: 5 } }
 * Give query in request: ?duration[gte]=5 = { duration: { gte: 5 } }
 * Need to add the '$' mongo operator to this created object
 */
let queryStr = JSON.stringify(queryObj);
queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
// console.log(JSON.parse(queryStr));

let query = Tour.find(JSON.parse(queryStr)); //Returns array of all objects and turns into JavaScript Object

//2) SORTING
if (req.query?.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy); //If minus on sort field (eg sort=-price), order of sort reverses
    //Not, mongoose sorts based on string, sort by multiply by using multiple field with space between
} else {
    query = query.sort("-createdAt");
}

//3) LIMITING FIELDS
if (req.query?.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
} else {
    query = query.select("-__v"); //- and field means to exclude
}

//4) PAGINATION
//Done use skip method (number of documents to skip) and limit (number of documents to send)
//Example: page=2&limit=10 (1-10 on page 1 and 11-20 on page 2)

const page = +req.query.page || 1;
const limit = +req.query.limit || 100;
const skip = (page - 1) * limit;

query = query.skip(skip).limit(limit);

if (req.query.page) {
    const numTours = await Tour.countDocuments();
    if (skip >= numTours) throw new Error("This page does not exist");
}
