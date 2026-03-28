import { Application } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import config from "../config";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: config.app.name,
      version: config.app.version,
      description: "Production-grade REST API — auto-generated documentation",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "/api/v1",
        description: "Current host",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your access token",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            errorMessages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        RegisterInput: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            password: { type: "string", minLength: 6, example: "secret123" },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "john@example.com" },
            password: { type: "string", example: "secret123" },
          },
        },
        TokenResponse: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
            user: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                email: { type: "string" },
                role: { type: "string", enum: ["USER", "ADMIN", "SUPER_ADMIN"] },
                isEmailVerified: { type: "boolean" },
              },
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [{ name: "Auth", description: "Authentication & account management" }],
    paths: {
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterInput" },
              },
            },
          },
          responses: {
            201: {
              description: "User registered. Verification OTP sent to email.",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } },
              },
            },
            400: { description: "Validation error" },
            409: { description: "Email already registered" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Tokens returned on success",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      { properties: { data: { $ref: "#/components/schemas/TokenResponse" } } },
                    ],
                  },
                },
              },
            },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/auth/refresh-token": {
        post: {
          tags: ["Auth"],
          summary: "Refresh access token",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["refreshToken"],
                  properties: { refreshToken: { type: "string" } },
                },
              },
            },
          },
          responses: {
            200: { description: "New tokens returned" },
            401: { description: "Invalid or expired refresh token" },
          },
        },
      },
      "/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout (invalidates tokens)",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { refreshToken: { type: "string" } },
                },
              },
            },
          },
          responses: {
            200: { description: "Logged out successfully" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/auth/verify-email": {
        post: {
          tags: ["Auth"],
          summary: "Verify email with OTP",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "otp"],
                  properties: {
                    email: { type: "string", format: "email" },
                    otp: { type: "string", example: "123456" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Email verified" },
            400: { description: "Invalid or expired OTP" },
          },
        },
      },
      "/auth/resend-otp": {
        post: {
          tags: ["Auth"],
          summary: "Resend OTP",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "purpose"],
                  properties: {
                    email: { type: "string", format: "email" },
                    purpose: { type: "string", enum: ["EMAIL_VERIFICATION", "PASSWORD_RESET"] },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "OTP sent" },
          },
        },
      },
      "/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Request password reset OTP",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: { email: { type: "string", format: "email" } },
                },
              },
            },
          },
          responses: {
            200: { description: "OTP sent (if email exists)" },
          },
        },
      },
      "/auth/verify-otp": {
        post: {
          tags: ["Auth"],
          summary: "Verify password reset OTP and receive reset token",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "otp"],
                  properties: {
                    email: { type: "string", format: "email" },
                    otp: { type: "string", example: "123456" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "OTP verified and reset token issued",
            },
            400: { description: "Invalid or expired OTP" },
          },
        },
      },
      "/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Reset password with reset token",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["resetToken", "newPassword"],
                  properties: {
                    resetToken: { type: "string" },
                    newPassword: { type: "string", minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Password reset successfully" },
            401: { description: "Invalid or expired reset token" },
          },
        },
      },
      "/auth/change-password": {
        post: {
          tags: ["Auth"],
          summary: "Change password (authenticated)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["oldPassword", "newPassword"],
                  properties: {
                    oldPassword: { type: "string" },
                    newPassword: { type: "string", minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Password changed" },
            400: { description: "Incorrect old password" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current user profile",
          responses: {
            200: { description: "User profile" },
            401: { description: "Unauthorized" },
          },
        },
      },
    },
  },
  apis: ["./src/app/modules/**/*.route.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  if (config.env !== "production") {
    app.use(
      "/api/docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customSiteTitle: `${config.app.name} API Docs`,
        swaggerOptions: {
          persistAuthorization: true,
        },
      })
    );

    app.get("/api/docs.json", (_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(swaggerSpec);
    });

    console.warn(`📄 Swagger docs available at /api/docs`);
  }
};
