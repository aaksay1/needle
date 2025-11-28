// Global type declarations for Socket.IO instance
declare global {
  var io: any;
  namespace NodeJS {
    interface Global {
      io: any;
    }
  }
}

export {};

