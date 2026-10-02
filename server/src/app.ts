import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import fileUpload from "express-fileupload";

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
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp",
  limits: { fileSize: 2 * 1024 * 1024 }
}));

app.use("/api/v1/auth", userRoutes);

// health check route
app.get("/health", (_, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server up and running... 🚀",
  });
});

app.get("/", (_, res) => {
  res.status(200).json({
    status: 200,
    service: "wave-arena api",
  });
});

export default app;
