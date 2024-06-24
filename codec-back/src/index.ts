import { Socket } from "socket.io"
import http from "http"
import express from "express"
import {Server} from "socket.io"
import { UserManager } from "./managers/UserManager";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

const userManager = new UserManager();

io.on("connection", (socket: Socket) => {
    console.log("a user connected");
    userManager.addUser(socket, "randomUser")
    socket.on("disconnect", ()=>{
        userManager.removeUser(socket.id)
    })
});

server.listen(3000, () => {
    console.log("listening on *:3000");
})