
export interface MyUser {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user: MyUser;
    }
  }
}



// import express, { Application } from 'express';
// import { JwtPayload } from 'jsonwebtoken';
//
// declare global {
//   namespace Express {
//     interface Request {
//       user: JwtPayload;
//     }
//   }
// }