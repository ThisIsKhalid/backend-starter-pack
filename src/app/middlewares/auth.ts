import { NextFunction, Request, Response } from "express";

const auth = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // we will write down the logic later

      console.log("this is auth");
      roles.map((r) => {
        console.log("role", r);
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
