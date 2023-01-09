const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const catchAsync = require("./../utils/catchAsync");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "A User must have a name!"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Please provide your email"],
            unique: true,
            lowercase: true,
            trim: true,
            validate: [validator.isEmail, "Please provide a valid email!"],
        },
        photo: {
            type: String,
            default: "No Photo",
        },
        role: {
            type: String,
            enum: {
                values: ["user", "guide", "lead-guide", "admin"],
                message: "({VALUE}) is not a valid role for a user",
            },
            default: "user",
        },
        password: {
            type: String,
            required: [true, "A User must have a password!"],
            minlength: 8,
            select: false,
        },
        passwordConfirm: {
            type: String,
            required: [true, "Please confirm your password!"],
            validate: {
                //THIS ONLY WORKS ON SAVE (pre("save") and post("save"))
                validator: function (confirm) {
                    return confirm.trim() === this.password;
                },
                message:
                    "Please make sure to confirm your password (({VALUE}) is not equal to the given password.",
            },
        },
        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        active: {
            type: Boolean,
            default: true,
            select: false,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// userSchema.virtual("password").get(function () {
//     return "******************";
// });

//PASSWORD ENCRYPTION
userSchema.pre("save", async function (next) {
    //Only Run if Password was modified (actually added)
    if (!this.isModified("password")) return void next();

    //HASHING THE PASSWORD USING 'bcrypt'
    this.password = await bcrypt.hash(this.password, 12); //Second argument; essentially how CPU intensive hashing is

    this.passwordConfirm = undefined; //Just delete the field
    next();
});
//Change passwordChangedAt property through another middleware
userSchema.pre("save", function (next) {
    if (!this.isModified("password") || this.isNew) return void next();

    this.passwordChangedAt = new Date(Date.now()) - 1000; //Making sure that the JWT is not created before the password is changed
    next();
});

//QUERY middleware (filter documents that are active and don't show inactive ones)
userSchema.pre(/^find/, function (next) {
    //This points to current query
    this.find({ active: { $ne: false } }); //Query object now shows only those with active as true
    next();
});

// userSchema.methods.test = function () {
//     console.log("This is a test");
// };

//Instance method: method available to all documents in a collection
userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = Number.parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        //console.log(changedTimeStamp, JWTTimeStamp);
        return JWTTimeStamp < changedTimeStamp;
    }

    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const token = crypto.randomBytes(32).toString("hex"); //Token sent to user to be used to create a password
    //The token is encrypted to avoid a hacker from using it (not stored in database)
    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return token;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
