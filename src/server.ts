import { Server } from "http";
import app from "./app";
import config from "./config";
import { socketIo } from "./helpars/socketIo";

// Main function to start the server
function main() {
  const server: Server = app.listen(config.port, () => {
    console.log("Server is running on port", config.port);
  });

  socketIo(server);  // clear this if you don't need socket.io

  // Graceful shutdown function
  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.log("Server closed");
      });
    }
    process.exit(1);
  };

  // Handle uncaught exceptions and unhandled promise rejections
  process.on("uncaughtException", exitHandler);
  process.on("unhandledRejection", exitHandler);
}

// Start the server
main();
