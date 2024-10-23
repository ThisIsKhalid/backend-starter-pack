import { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { corsOptions } from "../app";
import { chatServices } from "../app/modules/Chat/chat.services";

export function socketIo(server: Server) {
  // Initialize Socket.io with the server and CORS options
  const io = new SocketIOServer(server, {
    cors: corsOptions,
  });

  // Handle new connections to the Socket.io server
  io.on("connection", (socket) => {
    console.log("New user connected:", socket.id);

    // Handle joining a chat room and loading previous messages
    socket.on("joinRoom", async (orderId) => {
      try {
        socket.join(orderId);
        console.log(`User joined room: ${orderId}`);

        // Fetch and send previous messages to the user in the room
        const chat = await chatServices.getChatByOrderId(Number(orderId));

        socket.emit("loadMessages", chat?.messages || []);
      } catch (error) {
        console.error(`Error joining room ${orderId}:`, error);
      }
    });

    // Handle sending a message in a chat room
    socket.on("sendMessage", async (data) => {
      const { chatId, senderId, content, senderRole, orderId } = data;
      try {
        // Save the message to the database
        const message = await chatServices.addMessage(
          Number(chatId),
          senderId,
          content,
          senderRole
        );

        // Emit the new message to all users in the room
        io.to(orderId).emit("receiveMessage", message);
      } catch (error) {
        console.error(`Error sending message to room ${orderId}:`, error);
      }
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
      const { chatroomId, username } = data;
      socket.to(chatroomId).emit("typing", { username });
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}
