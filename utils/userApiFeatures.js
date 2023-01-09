const APIFeatures = require("./apiFeatures");

class UserApiFeatures extends APIFeatures {
    constructor(query, queryString) {
        super(query, queryString);
    }
    filter() {
        const queryObj = { ...this.queryString };
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt)\b/g,
            (match) => `$${match}`
        );
        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }
    sort(removeField = "name") {
        return super.sort(removeField);
    }
}

module.exports = UserApiFeatures;
