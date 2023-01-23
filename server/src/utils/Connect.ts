import mongoose from "mongoose";

const connectDb = async () => {
  // console.log(process.env.MONGO_URL);
  mongoose.set("strictQuery", false);
  await mongoose
    .connect(process.env.MONGO_URL as string)
    .then(() => {
      console.log("Database Connected");
    })
    .catch((error: any) => {
      console.log("Failed to connect");
    });
};

module.exports = {
  connectDb,
};
