const nodemailer = require("nodemailer");
const catchAsync = require("./catchAsync");

const sendEmail = catchAsync(async (options) => {
    // 1) Create a transporter (service that will send the email like gmail)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // 2) Defined the email options
    const mailOptions = {
        from: "Nandan Patel <hello@jonas.io",
        to: options.email,
        subject: options.email,
        text: options.message,
        // html:
    };

    // 3) Actually send the email (using nodemailer)
    await transporter.sendMail(mailOptions);
});

module.exports = sendEmail;
