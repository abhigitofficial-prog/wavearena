import dotenv from "dotenv";
import app from "./app.js"
import { connectDatabase } from "./db/db.js"

dotenv.config({
  path: "./.env"
});

const port = process.env.PORT || 3000;

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port: ${port}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed.", (err as Error)?.message)
  })
