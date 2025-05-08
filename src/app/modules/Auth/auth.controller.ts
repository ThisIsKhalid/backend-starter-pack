import {Request, Response} from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import {AuthServices} from "./auth.service";
import ApiError from "../../../errors/ApiErrors";

const loginUserWithEmail = catchAsync(async (req: Request, res: Response) => {

    const {email, password, keepMeLogin} = req.body;

    const result = await AuthServices.loginUserWithEmail(email, password, keepMeLogin);


    if (result.isVerified) {
        res.cookie("accessToken", result.accessToken, {
            httpOnly: true,
            maxAge: 2 * 60 * 60 * 1000,
            sameSite: "none",
            secure: true
        });

        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "none",
            secure: true
        });
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.isVerified ? "User logged in successfully" : "OTP sent successfully",
        data: result,
    });
});

const verifyUserByOTP = catchAsync(async (req: Request, res: Response) => {

    const {email, otp, keepMeLogin} = req.body;
    const result = await AuthServices.verifyUserByOTP(email, otp, keepMeLogin);

    res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        maxAge: 2 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true
    });

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true
    });


    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Otp verified successfully",
        data: result,
    });
});


const loginWithGoogle = catchAsync(async (req: Request, res: Response) => {
    const googleProfile: any = req.user;

    try {
        // const result = await AuthServices.loginWithGoogle(req.body);
        const result = await AuthServices.loginWithGoogle(googleProfile);
        console.log(result.accessToken)

        res.cookie("accessToken", result.accessToken, {
            httpOnly: true,
            maxAge: 2 * 60 * 60 * 1000,
            sameSite: "none",
            secure: true
        });

        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "none",
            secure: true
        });

        // Redirect to the desired URL after successful login
        res.redirect("http://localhost:3000");

    } catch (error) {
        // Handle different error types (ApiError or other errors)
        if (error instanceof ApiError) {
            // Redirect to the desired URL if login is failed
            const redirectUrl = `https://localhost:3000/login?message=${error.message}`;
            res.redirect(redirectUrl);
            return sendResponse(res, {
                statusCode: error.statusCode,
                success: false,
                message: error.message,
                data: null
            });
        } else {
            // Handle unexpected errors
            return sendResponse(res, {
                statusCode: 500,
                success: false,
                message: "Something went wrong. Please try again.",
                data: null
            });
        }
    }
});

const loginWithFacebook = catchAsync(async (req: Request, res: Response) => {

    const facebookProfile: any = req.user;

    try {
        const result = await AuthServices.loginWithFacebook(facebookProfile);

        res.cookie("accessToken", result.accessToken, {
            httpOnly: true,
            maxAge: 2 * 60 * 60 * 1000,
            sameSite: "none",
            secure: true
        });

        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "none",
            secure: true
        });

        // Redirect to the desired URL after successful login
        res.redirect("http://localhost:3000");

    } catch (error) {
        // Handle different error types (ApiError or other errors)
        if (error instanceof ApiError) {
            // Redirect to the desired URL if login is failed
            const redirectUrl = `https://localhost:3000/login?message=${error.message}`;
            res.redirect(redirectUrl);
            return sendResponse(res, {
                statusCode: error.statusCode,
                success: false,
                message: error.message,
                data: null
            });
        } else {
            // Handle unexpected errors
            return sendResponse(res, {
                statusCode: 500,
                success: false,
                message: "Something went wrong. Please try again.",
                data: null
            });
        }
    }
});


const logoutUser = catchAsync(async (req: Request, res: Response) => {
    // Clear the token cookie
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User Successfully logged out",
        data: null,
    });
});

// get user profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
    // @ts-ignore
    let id = req.user.id
    const result = await AuthServices.getMyProfile(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User profile fetch successfully",
        data: result,
    });
});

// change password
const changePassword = catchAsync(async (req: Request, res: Response) => {

    // @ts-ignore
    const id = req.user.id;
    const {oldPassword, newPassword} = req.body;

    await AuthServices.changePassword(
        id,
        newPassword,
        oldPassword
    );
    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: "Password changed successfully",
        data: null,
    });
});

// forgot password
const forgetPassword = catchAsync(async (req: Request, res: Response) => {
    const {email} = req.body;
    const data = await AuthServices.forgetPassword(email);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Check your email!",
        data: data,
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const {password} = req.body;
    const user: any = req.user;

    const result = await AuthServices.resetPassword(user?.id, password);

    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: "Password reset successfully",
        data: result,
    });
});



const refreshToken = catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    const result = await AuthServices.refreshToken(refreshToken as string);

    res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        maxAge: 2 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Token refreshed successfully",
        data: result,
    });
});

export const AuthController = {
    loginUserWithEmail,
    loginWithGoogle,
    loginWithFacebook,
    verifyUserByOTP,
    logoutUser,
    getMyProfile,
    changePassword,
    forgetPassword,
    resetPassword,
    refreshToken
};
