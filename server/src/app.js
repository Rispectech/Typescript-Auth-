const express = require("express");
const https = require("https");
const fs = require("fs");
const cors = require("cors");

const { authRouter } = require("./routes/auth");
const { userRouter } = require("./routes/User");
const { connectDb } = require("./utils/Connect");
const { ErrorHandler } = require("./utils/error");
const { clientRouter } = require("./routes/Client");
require("dotenv").config();

const port = process.env.PORT || 8000;
const app = express();

// console.log("Current directory:", __dirname);

const options = {
  key: fs.readFileSync("../key.pem"),
  cert: fs.readFileSync("../cert.pem"),
};

app.use(cors());
app.use(express.json());

app.use("/", authRouter);
app.use("/", userRouter);
app.use("/", clientRouter);
app.use(ErrorHandler);

const start = async () => {
  try {
    await connectDb();
    app.listen(port, () => console.log(`Server is listening at port ${port}`));
    // https
    //   .createServer(options, function (req, res) {
    //     res.writeHead(200);
    //     res.end("hello world\n");
    //   })
    //   .listen(port, () => console.log(`Server is listening at port ${port}`));
  } catch (error) {
    console.log(error);
  }
};

start();
