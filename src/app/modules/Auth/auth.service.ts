import {Provider, UserRole, UserStatus} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import httpStatus from "http-status";
import {Secret} from "jsonwebtoken";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import {jwtHelpers} from "../../../helpars/jwtHelpers";
import prisma from "../../../shared/prisma";
import emailSender from "../../../helpars/emailSender/emailSender";
import {comparePassword, hashPassword} from "../../../helpars/passwordHelpers";
import {otpEmail} from "../../../emails/otpEmail";


const verifyUserByOTP = async (email: string, otp: string, keepMeLogin?: boolean) => {
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.otp !== otp) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "OTP expired");
    }

    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            isVerified: true,
            otp: null,
            otpExpiresAt: null,
        },
    });

    let accessToken;
    let refreshToken;

    if (keepMeLogin) {
        accessToken = jwtHelpers.generateToken(
            {
                id: user.id,
                role: user.role,
            },
            config.jwt.jwt_secret as Secret,
            keepMeLogin as boolean
        );


        refreshToken = jwtHelpers.generateToken(
            {
                id: user.id,
                role: user.role,
            },
            config.jwt.refresh_token_secret as Secret,
            keepMeLogin as boolean
        );
    } else {
        accessToken = jwtHelpers.generateToken(
            {
                id: user.id,
                role: user.role,
            },
            config.jwt.jwt_secret as Secret,
            config.jwt.expires_in as string
        );

        refreshToken = jwtHelpers.generateToken(
            {
                id: user.id,
                role: user.role,
            },
            config.jwt.refresh_token_secret as Secret,
            config.jwt.refresh_token_expires_in as string
        );
    }


    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            accessToken: accessToken,
            refreshToken: refreshToken,
        },
    });

    return {
        accessToken,
        refreshToken,
    };
};

const refreshToken = async (refreshToken: string) => {

    const decodedToken = jwtHelpers.verifyToken(
        refreshToken,
        config.jwt.refresh_token_secret as Secret
    );

    if (!decodedToken) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
    }

    const user = await prisma.user.findUnique({
        where: {
            id: decodedToken.id,
        },
    });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.refreshToken !== refreshToken) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
    }

    const accessToken = jwtHelpers.generateToken(
        {
            id: user.id,
            role: user.role,
        },
        config.jwt.jwt_secret as Secret,
        config.jwt.expires_in as string
    );

    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            accessToken: accessToken,
        },
    });

    return {accessToken};
};


const loginUserWithEmail = async (
    email: string,
    password: string,
    keepMeLogin?: boolean
) => {
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: email,
        },
    });

    if (!userData) {
        throw new ApiError(404, "User not found");
    }

    if (userData.provider !== Provider.EMAIL) {
        throw new ApiError(400, `Please login with your ${userData.provider} account`);
    }
    if (userData.status === UserStatus.INACTIVE) {
        throw new ApiError(400, "Your account is INACTIVE");
    }

    if (!password || !userData?.password) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Password is required");
    }

    const isCorrectPassword: boolean = await comparePassword(
        password,
        userData.password
    );

    if (!isCorrectPassword) {
        throw new ApiError(401, "Password is incorrect");
    }

    if (userData?.isVerified === false) {
        const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.user.update({
            where: {
                id: userData.id,
            },
            data: {
                otp: randomOtp,
                otpExpiresAt: otpExpiry,
            },
        });

        const html = otpEmail(randomOtp);

        await emailSender("OTP", userData.email as string, html);

        return {
            email: userData.email,
            isVerified: userData.isVerified,
            keepMeLogin: keepMeLogin
        };
    } else {
        let accessToken;
        let refreshToken;

        if (keepMeLogin) {
            accessToken = jwtHelpers.generateToken(
                {
                    id: userData.id,
                    role: userData.role,
                },
                config.jwt.jwt_secret as Secret,
                keepMeLogin as boolean
            );


            refreshToken = jwtHelpers.generateToken(
                {
                    id: userData.id,
                    role: userData.role,
                },
                config.jwt.refresh_token_secret as Secret,
                keepMeLogin as boolean
            );
        } else {
            accessToken = jwtHelpers.generateToken(
                {
                    id: userData.id,
                    role: userData.role,
                },
                config.jwt.jwt_secret as Secret,
                config.jwt.expires_in as string
            );

            refreshToken = jwtHelpers.generateToken(
                {
                    id: userData.id,
                    role: userData.role,
                },
                config.jwt.refresh_token_secret as Secret,
                config.jwt.refresh_token_expires_in as string
            );
        }


        await prisma.user.update({
            where: {
                id: userData.id,
            },
            data: {
                accessToken: accessToken,
                refreshToken: refreshToken,
            },
        });

        return {
            isVerified: userData.isVerified,
            accessToken,
            refreshToken,
        };
    }
};

const loginWithGoogle = async (payload: {
    name: string,
    email: string,
    profileImage: string,
    uniqueId: string
}) => {

    const userData = await prisma.user.findFirst({
        where: {
            email: payload.email,
        },
    });

    if (!userData) {
        const newUser = await prisma.user.create({
            data: {
                firstName: payload.name,
                email: payload.email,
                profileImage: payload?.profileImage,
                provider: Provider.GOOGLE,
                uniqueId: payload.uniqueId,
            }
        })

        const accessToken = jwtHelpers.generateToken(
            {
                id: newUser.id,
                role: UserRole.USER
            },
            config.jwt.jwt_secret as Secret,
            config.jwt.expires_in as string
        );

        const refreshToken = jwtHelpers.generateToken(
            {
                id: newUser.id,
                role: UserRole.USER,
            },
            config.jwt.refresh_token_secret as Secret,
            config.jwt.expires_in as string
        );

        await prisma.user.update({
            where: {
                id: newUser.id,
            },
            data: {
                accessToken: accessToken,
                refreshToken: refreshToken,
            },
        });

        return {accessToken, refreshToken};
    }

    if (userData.provider !== Provider.GOOGLE) {
        throw new ApiError(400, `Please login with your ${userData.provider} and Password`);
    }

    if (userData.status === UserStatus.INACTIVE) {
        throw new ApiError(403, "Your account is Suspended");
    }

    const accessToken = jwtHelpers.generateToken(
        {
            id: userData.id,
            role: UserRole.USER
        },
        config.jwt.jwt_secret as Secret,
        config.jwt.expires_in as string
    );

    const refreshToken = jwtHelpers.generateToken(
        {
            id: userData.id,
            role: UserRole.USER,
        },
        config.jwt.refresh_token_secret as Secret,
        config.jwt.expires_in as string
    );

    await prisma.user.update({
        where: {
            id: userData.id,
        },
        data: {
            accessToken: accessToken,
            refreshToken: refreshToken,
        },
    });

    return {
        accessToken,
        refreshToken
    };
}

const loginWithFacebook = async (payload: {
    name: string,
    email?: string,
    profileImage: string,
    uniqueId: string
}) => {

    const userData = await prisma.user.findFirst({
        where: {
            uniqueId: payload.uniqueId,
        },
    });

    if (!userData) {
        const newUser = await prisma.user.create({
            data: {
                firstName: payload.name,
                email: payload.email,
                profileImage: payload?.profileImage,
                provider: Provider.FACEBOOK,
                uniqueId: payload.uniqueId,
            }
        })

        const accessToken = jwtHelpers.generateToken(
            {
                id: newUser.id,
                role: UserRole.USER
            },
            config.jwt.jwt_secret as Secret,
            config.jwt.expires_in as string
        );

        const refreshToken = jwtHelpers.generateToken(
            {
                id: newUser.id,
                role: UserRole.USER,
            },
            config.jwt.refresh_token_secret as Secret,
            config.jwt.expires_in as string
        );

        await prisma.user.update({
            where: {
                id: newUser.id,
            },
            data: {
                accessToken: accessToken,
                refreshToken: refreshToken,
            },
        });

        return {accessToken, refreshToken};
    }

    if (userData.provider !== Provider.FACEBOOK) {
        throw new ApiError(400, `Please login with your ${userData.provider}`);
    }

    if (userData.status === UserStatus.INACTIVE) {
        throw new ApiError(403, "Your account is Suspended");
    }

    const accessToken = jwtHelpers.generateToken(
        {
            id: userData.id,
            role: UserRole.USER
        },
        config.jwt.jwt_secret as Secret,
        config.jwt.expires_in as string
    );

    const refreshToken = jwtHelpers.generateToken(
        {
            id: userData.id,
            role: UserRole.USER,
        },
        config.jwt.refresh_token_secret as Secret,
        config.jwt.expires_in as string
    );

    await prisma.user.update({
        where: {
            id: userData.id,
        },
        data: {
            accessToken: accessToken,
            refreshToken: refreshToken,
        },
    });

    return {
        accessToken,
        refreshToken
    };
}

const getMyProfile = async (id: string) => {
    const isUserExist = await prisma.user.findUnique({
        where: {id},
    });

    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "User does not exist!");
    }

    const {password, ...user} = isUserExist;
    return user;
};


// change password

const changePassword = async (
    id: string,
    newPassword: string,
    oldPassword: string
) => {

    if (!oldPassword) {
        throw new ApiError(httpStatus.FORBIDDEN, "Old Password is required");
    }

    if (!newPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New Password is required");
    }

    const userData = await prisma.user.findUnique({
        where: {id},
    });

    if (!userData) {
        throw new ApiError(httpStatus.NOT_FOUND, "No record found with this email");
    }

    if (userData.provider !== Provider.EMAIL) {
        throw new ApiError(400, `Please login with your ${userData.provider}`);
    }


    const isCorrectPassword = await comparePassword(oldPassword, userData.password as string)

    if (!isCorrectPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect old password!");
    }


    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
        where: {
            id: userData?.id,
        },
        data: {
            password: hashedPassword,
        },
    });

    return
};

const forgetPassword = async (email: string) => {

    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.provider !== Provider.EMAIL) {
        throw new ApiError(400, `Please login with your ${user.provider}`);
    }

    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            otp: randomOtp,
            otpExpiresAt: otpExpiry,
        },
    });

    const html = otpEmail(randomOtp);

    await emailSender("OTP", user.email as string, html);
};

// reset password
const resetPassword = async (id: string, password: string) => {
    const user = await prisma.user.findUnique({
        where: {
            id,
        },
    });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            password: hashedPassword,
            otp: null,
            otpExpiresAt: null,
        },
    });
};
export const AuthServices = {
    loginUserWithEmail,
    loginWithGoogle,
    getMyProfile,
    changePassword,
    forgetPassword,
    resetPassword,
    verifyUserByOTP,
    refreshToken,
    loginWithFacebook
};
