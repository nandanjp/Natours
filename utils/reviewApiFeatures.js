/**const features = new ReviewApiFeatures(Review.find(), req.query);
    features.filter().sort().limitFields().paginate();

    const reviews = await Review.find(features.getQuery()); */

const APIFeatures = require("./apiFeatures");

class ReviewApiFeatures extends APIFeatures {
    constructor(query, queryObject) {
        super(query, queryObject);
    }
    filter(excludedFields = ["page", "sort", "limit", "fields"], tourId) {
        let queryStr = JSON.stringify(this.queryString);
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt)\b/g,
            (match) => `$${match}`
        );
        this.query = this.query.find(JSON.parse(queryStr));

        if (tourId) this.query = this.query.find({ tour: tourId });
        return this;
    }
    sort(removeField = "name") {
        return super.sort(removeField);
    }
}

module.exports = ReviewApiFeatures;
