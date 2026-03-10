import { Server } from "http";
import app from "../../app";

let server: Server;

export const startTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    server = app.listen(0, () => resolve());
  });
};

export const stopTestServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close((err) => (err ? reject(err) : resolve()));
    } else {
      resolve();
    }
  });
};

export { app };
