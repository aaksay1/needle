// This file allows API routes to access the Socket.IO instance
// The server.js file will set this when it initializes

let ioInstance: any = null;

export function setSocketIOInstance(io: any) {
  ioInstance = io;
}

export function getSocketIOInstance() {
  return ioInstance;
}

