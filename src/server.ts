import { Server } from "http";
import app from "./app";

let server: Server;

async function main() {
  try {
    // 1. Connect to database
    // 2. Initialize data in DB ( if there any , ex: admin or super admin)
    // 3. Start HTTP server
    server = app.listen(8000, () => {
      console.log(`Server is running on port 8000`);
    });

    // Handle server errors
    server.on("error", (error: any) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port 8000 is already in use`);
      } else {
        console.error("❌ Server error:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

main();
