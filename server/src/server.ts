import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const port = process.env.PORT || 3000;
const appOrigin = process.env.APP_ORIGIN;

app.use(
  cors({
    origin: appOrigin || "*",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server up and running... 🚀",
  });
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
