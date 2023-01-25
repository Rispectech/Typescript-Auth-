import express from "express";
import cors from "cors";

import { authRouter } from "./routes/auth";
import { userRouter } from "./routes/User";
import { connectDb } from "./utils/Connect";
require("dotenv").config();

const port = process.env.PORT || 8000;
const app = express();

app.use(cors());
app.use(express.json());

app.use("/", authRouter);
app.use("/", userRouter);
// app.use(ErrorHandler);

const start = async () => {
  try {
    await connectDb();
    app.listen(port, () => console.log(`Server is listening at port ${port}`));
  } catch (error) {
    console.log(error);
  }
};

start();
