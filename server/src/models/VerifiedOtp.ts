const mongoose = require("mongoose");

const otpVerificationSchema = new mongoose.Schema({
  entityId: {
    type: String,
    required: ["true", "ID is required"],
  },

  otp: {
    type: String,
    required: ["true", "Otp is required"],
  },

  createdAt: Date,

  expiresAt: Date,
});

const otpVerificationModel = mongoose.model("OtpVerification", otpVerificationSchema);

export { otpVerificationModel };
