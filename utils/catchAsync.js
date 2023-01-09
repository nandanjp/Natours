const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next); //since function is async (returns promise), can use catch to catch errors
    };
};

module.exports = catchAsync;
