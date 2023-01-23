import nodeMailer from "nodemailer";
import bcrypt from "bcrypt";
import { otpVerificationModel } from "../models/VerifiedOtp";

const getHrTime = () => {
  var datetime = new Date(Date.now());
  console.log("Before: ", datetime);
  datetime.setHours(datetime.getHours() + 1);
  console.log("After: ", datetime);
  return datetime;
};

const sendEmail = async (email: string, subject: string, html: string) => {
  const transporter = nodeMailer.createTransport({
    // host: "smtp-mail.outlook.com", // hostname
    service: "gmail",
    auth: {
      user: process.env.AUTH_USER,
      pass: process.env.AUTH_PASS,
    },
  });

  let mailOptions = {
    from: process.env.AUTH_USER, // sender address
    to: email, // list of receivers
    subject: subject, // Subject
    html: html,
  };

  await transporter.sendMail(mailOptions);
};

const sendOtpVerificationEmail = async (email: string, _id: string) => {
  const transporter = nodeMailer.createTransport({
    // host: "smtp-mail.outlook.com", // hostname
    service: "gmail",
    auth: {
      user: process.env.AUTH_USER,
      pass: process.env.AUTH_PASS,
    },
  });

  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

    let mailOptions = {
      from: process.env.EMAIL_USER, // sender address
      to: email, // list of receivers
      subject: "Verify Your Account", // Subject
      html: ` <p>Enter ${otp} in the application to verify the email and complete registration </p>
      <p>This otp will expire after an hour</p>
      `,
    };
    const saltRounds = 10;
    const hashedOtp = await bcrypt.hash(otp, saltRounds);

    const newOtp = await otpVerificationModel.create({
      entityId: _id,
      otp: hashedOtp,
      createdAt: Date.now(),
      expiresAt: getHrTime(),
    });

    await transporter.sendMail(mailOptions);

    return {
      status: "Pending",
      message: "Verification Otp email sent",
      data: {
        userId: _id,
        email,
      },
    };
  } catch (error) {
    console.log(error);
  }
};

export { sendOtpVerificationEmail, sendEmail, getHrTime };
