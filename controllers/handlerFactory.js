const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

module.exports.deleteOne = (
    Model,
    errorMsg = "No document found with that ID: ",
    returnObj = { status: "success", data: null }
) =>
    catchAsync(async (req, res, next) => {
        const document = await Model.findByIdAndDelete(req.params.id);
        if (!document)
            return void next(new AppError(errorMsg + req.params.id, 404));
        res.status(204).json(returnObj); //204 = resource not being sent back (No Content)
    });

module.exports.updateOne = (
    Model,
    errorMsg = "No document found with that ID: ",
    returnPropName = "document"
) =>
    catchAsync(async (req, res, next) => {
        const updatedDocument = await Model.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true, //New Updated document is returned,
                //upsert: true,
                runValidators: true,
            }
        );

        if (!updatedDocument)
            return void next(new AppError(errorMsg + req.params.id, 404));

        res.status(200).json({
            status: "success",
            data: {
                [returnPropName]: updatedDocument,
            },
        });
    });

module.exports.createOne = (
    Model,
    returnPropName = "newDocument",
    propsToUseOnly
) =>
    catchAsync(async (req, res, next) => {
        let body = undefined;
        if (propsToUseOnly) {
            body = {};
            propsToUseOnly.forEach((prop) => (body[prop] = req.body[prop])); //To allow for only select fields to be used in creation
        }
        const newDocument = await Model.create(body || req.body);
        res.status(201).json({
            status: "success",
            data: {
                [returnPropName]: await Model.findById(newDocument._id),
            },
        });
    });

module.exports.getOne = (
    Model,
    returnPropName = "document",
    errorMsg = "No document found with that ID: ",
    paramIdField,
    populateOptions
) =>
    catchAsync(async (req, res, next) => {
        paramIdField = paramIdField ? req.params[paramIdField] : req.params.id;

        let query = Model.findById(paramIdField);
        if (populateOptions) query = query.populate(populateOptions);

        const document = await query;

        if (!document)
            return void next(new AppError(errorMsg + paramIdField, 404));

        res.status(200).json({
            status: "success",
            data: {
                [returnPropName]: document,
            },
        });
    });

module.exports.getAll = (
    Model,
    APIFeaturesClass,
    returnPropName,
    excludeFields
) =>
    catchAsync(async (req, res, next) => {
        const features = new APIFeaturesClass(
            Model.find(), //create a query
            req.query
        );

        let excludedFields = undefined;
        if (excludeFields) excludedFields = ["page", "sort", "limit", "fields"];
        excludedFields
            ? req.params?.id || req.params?.tourId
                ? features.filter(
                      excludedFields,
                      req.params?.id || req.params?.tourId
                  )
                : features.filter(excludedFields)
            : features.filter();

        features.sort().limitFields().paginate();

        //let query = Tour.find(features.getQuery());
        const documents = await Model.find(features.getQuery()); //.explain(); //Build query (to find the desired data) and then execute the query

        res.status(200).json({
            status: "success",
            results: documents.length,
            data: {
                [returnPropName]: documents,
            },
        });
    });
