import "dotenv/config";
import app from "./app.js"
import { connectDatabase } from "./db/db.js"

const port = process.env.PORT || 80;

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port: ${port}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed.", (err as Error)?.message)
  })
