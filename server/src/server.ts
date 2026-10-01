import "dotenv/config";
import app from "./app.js"
import { connectDatabase } from "./db/db.js"

const port = process.env.PORT;

await connectDatabase();

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
