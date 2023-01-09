class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter(excludedFields = ["page", "sort", "limit", "fields"], id) {
        const queryObj = { ...this.queryString };
        //1A) FILTERING
        excludedFields.forEach((field) => {
            if (queryObj[field]) delete queryObj[field];
        });

        //1B) ADVANCED FILTERING
        /**Normal filter object: { duration: { $gte: 5 } }
         * Give query in request: ?duration[gte]=5 = { duration: { gte: 5 } }
         * Need to add the '$' mongo operator to this created object
         */
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt)\b/g,
            (match) => `$${match}`
        );
        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }
    sort(removeField = "createdAt") {
        //2) SORTING
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(",").join(" ");
            this.query = this.query.sort(sortBy); //If minus on sort field (eg sort=-price), order of sort reverses
            //Not, mongoose sorts based on string, sort by multiply by using multiple field with space between
        } else {
            this.query = this.query.sort("-" + removeField);
        }
        return this;
    }
    limitFields() {
        //3) LIMITING FIELDS
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(",").join(" ");
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select("-__v"); //- and field means to exclude
        }
        return this;
    }
    paginate() {
        //4) PAGINATION
        //Done use skip method (number of documents to skip) and limit (number of documents to send)
        //Example: page=2&limit=10 (1-10 on page 1 and 11-20 on page 2)

        const page = +this.queryString.page || 1;
        const limit = +this.queryString.limit || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        if (+this.queryString.page) {
            (async function () {
                const numTours = await Tour.countDocuments();
                if (skip >= numTours)
                    throw new Error("This page does not exist");
            })();
        }
        return this;
    }
    getQuery() {
        return this.query;
    }
}

module.exports = APIFeatures;
