import request from "supertest";
import { app } from "./helpers/testServer";

describe("Auth Routes", () => {
  describe("POST /api/v1/auth/register", () => {
    it("should return 400 when body is empty", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 for invalid email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ name: "Test", email: "not-an-email", password: "secret123" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 for short password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ name: "Test", email: "test@example.com", password: "123" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should return 400 for missing credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 for wrong credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "notexist@example.com", password: "wrongpass" });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid.token.here");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/forgot-password", () => {
    it("should return 200 even for non-existent email (security)", async () => {
      const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "nobody@example.com" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
