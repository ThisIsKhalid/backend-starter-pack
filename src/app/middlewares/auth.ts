import {NextFunction, Request, Response} from "express";

import {Secret} from "jsonwebtoken";
import config from "../../config";

import {UserStatus} from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiErrors";
import {jwtHelpers} from "../../helpars/jwtHelpers";
import prisma from "../../shared/prisma";
import {MyUser} from "../../interfaces";

//  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN)

const auth = (...roles: string[]) => {
    return async (
        req: Request & { user?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {

            let token = req.cookies.accessToken;

            if (!token) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
            }

            const verifiedUser = jwtHelpers.verifyToken(
                token,
                config.jwt.jwt_secret as Secret
            );

            const user = await prisma.user.findUnique({
                where: {
                    id: verifiedUser.id,
                },
            });

            if (!user) {
                throw new ApiError(httpStatus.NOT_FOUND, "This user is not found !");
            }

            const userStatus = user?.status;

            if (userStatus === UserStatus.INACTIVE) {
                throw new ApiError(httpStatus.FORBIDDEN, "This user is inactive !");
            }

            if (roles.length && !roles.includes(verifiedUser.role)) {
                throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!");
            }

            if (user?.accessToken !== token) {
                throw new ApiError(401, "Invalid token!");
            }

            req.user = verifiedUser as MyUser;

            next();
        } catch (err) {
            next(err);
        }
    };
};

export default auth;