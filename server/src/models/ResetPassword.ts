import mongoose from "mongoose";

const resetPasswordSchema = new mongoose.Schema({
  entityId: String,
  resetString: String,
  createdAt: Date,
  expiresAt: Date,
});

const resetPasswordModel = mongoose.model("ResetPassword", resetPasswordSchema);

export default resetPasswordModel;
