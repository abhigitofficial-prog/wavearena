import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const appOrigin = process.env.APP_ORIGIN;

// express middlewares
app.use(cors({
  origin: appOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({
  extended: true,
}));
app.use(cookieParser());

// health check route
app.get("/health", (_, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server up and running... 🚀",
  });
});

export default app;
