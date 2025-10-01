import { Cache, TTL } from "./cacheManagement";

// ===========================================
// 1. USER PROFILE CACHING
// ===========================================

interface User {
  id: string;
  name: string;
  email: string;
}

export class UserService {
  static async getUser(userId: string): Promise<User | null> {
    const cacheKey = `user:${userId}`;

    // Try to get from cache first
    const cachedUser = await Cache.get<User>(cacheKey);
    if (cachedUser) {
      console.log("✓ User found in cache");
      return cachedUser;
    }

    // If not in cache, fetch from database
    const user = await this.fetchUserFromDB(userId);
    if (user) {
      // Cache for 1 hour
      await Cache.set(cacheKey, user, TTL.HOUR);
      console.log("✓ User cached");
    }

    return user;
  }

  static async updateUser(
    userId: string,
    userData: Partial<User>
  ): Promise<void> {
    // Update in database
    await this.updateUserInDB(userId, userData);

    // Invalidate cache
    await Cache.del(`user:${userId}`);
    console.log("✓ User cache invalidated");
  }

  private static async fetchUserFromDB(userId: string): Promise<User | null> {
    // Simulate DB call
    return { id: userId, name: "John Doe", email: "john@example.com" };
  }

  private static async updateUserInDB(
    userId: string,
    data: Partial<User>
  ): Promise<void> {
    // Simulate DB update
    console.log("DB updated for user:", userId);
  }
}

// ===========================================
// 2. POSTS FEED CACHING (Cache-Aside Pattern)
// ===========================================

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
}

export class PostService {
  static async getTrendingPosts(): Promise<Post[]> {
    return await Cache.getOrSet(
      "posts:trending",
      async () => {
        console.log("📊 Fetching trending posts from DB...");
        // Expensive database query
        return await this.fetchTrendingFromDB();
      },
      TTL.HOUR // Cache for 1 hour
    );
  }

  static async getUserPosts(userId: string): Promise<Post[]> {
    return await Cache.getOrSet(
      `posts:user:${userId}`,
      async () => {
        console.log(`📝 Fetching posts for user ${userId}...`);
        return await this.fetchUserPostsFromDB(userId);
      },
      TTL.HOUR * 2 // Cache for 2 hours
    );
  }

  static async createPost(post: Post): Promise<void> {
    // Save to database
    await this.savePostToDB(post);

    // Invalidate related caches
    await Cache.del("posts:trending", `posts:user:${post.authorId}`);
    console.log("✓ Post caches invalidated");
  }

  private static async fetchTrendingFromDB(): Promise<Post[]> {
    // Simulate expensive DB query
    return [
      {
        id: "1",
        title: "Trending Post",
        content: "Content...",
        authorId: "user1",
      },
    ];
  }

  private static async fetchUserPostsFromDB(userId: string): Promise<Post[]> {
    return [
      { id: "2", title: "User Post", content: "Content...", authorId: userId },
    ];
  }

  private static async savePostToDB(post: Post): Promise<void> {
    console.log("Post saved to DB:", post.id);
  }
}

// ===========================================
// 3. RATE LIMITING
// ===========================================

export class RateLimitService {
  static async checkLoginAttempts(userId: string): Promise<boolean> {
    const key = `rate_limit:login:${userId}`;
    const attempts = await Cache.incr(key, TTL.HOUR); // Reset after 1 hour

    const maxAttempts = 5;
    if (attempts > maxAttempts) {
      console.log(
        `❌ Rate limit exceeded for user ${userId}: ${attempts} attempts`
      );
      return false;
    }

    console.log(
      `✓ Login attempt ${attempts}/${maxAttempts} for user ${userId}`
    );
    return true;
  }

  static async checkAPIRequests(apiKey: string): Promise<boolean> {
    const key = `rate_limit:api:${apiKey}`;
    const requests = await Cache.incr(key, TTL.HOUR);

    const maxRequests = 1000; // 1000 requests per hour
    return requests <= maxRequests;
  }

  static async resetRateLimit(
    userId: string,
    type: "login" | "api"
  ): Promise<void> {
    const key = `rate_limit:${type}:${userId}`;
    await Cache.del(key);
    console.log(`✓ Rate limit reset for ${type}:${userId}`);
  }
}

// ===========================================
// 4. SESSION MANAGEMENT
// ===========================================

interface Session {
  userId: string;
  createdAt: Date;
  lastActivity: Date;
}

export class SessionService {
  static async createSession(userId: string): Promise<string> {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36)}`;

    const session: Session = {
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    // Store session for 24 hours
    await Cache.set(`session:${sessionId}`, session, TTL.DAY);
    console.log(`✓ Session created: ${sessionId}`);

    return sessionId;
  }

  static async getSession(sessionId: string): Promise<Session | null> {
    const session = await Cache.get<Session>(`session:${sessionId}`);

    if (session) {
      // Update last activity
      session.lastActivity = new Date();
      await Cache.set(`session:${sessionId}`, session, TTL.DAY);
    }

    return session;
  }

  static async deleteSession(sessionId: string): Promise<void> {
    await Cache.del(`session:${sessionId}`);
    console.log(`✓ Session deleted: ${sessionId}`);
  }
}

// ===========================================
// 5. CONFIGURATION CACHING
// ===========================================

interface AppConfig {
  features: string[];
  limits: Record<string, number>;
  settings: Record<string, any>;
}

export class ConfigService {
  static async getConfig(): Promise<AppConfig> {
    return await Cache.getOrSet(
      "app:config",
      async () => {
        console.log("🔧 Loading configuration from database...");
        // Load from database or config service
        return {
          features: ["feature1", "feature2"],
          limits: { maxUsers: 1000, maxPosts: 10000 },
          settings: { theme: "dark", language: "en" },
        };
      },
      TTL.HOUR * 6 // Cache for 6 hours
    );
  }

  static async updateConfig(newConfig: AppConfig): Promise<void> {
    // Save to database
    await this.saveConfigToDB(newConfig);

    // Update cache
    await Cache.set("app:config", newConfig, TTL.HOUR * 6);
    console.log("✓ Configuration updated and cached");
  }

  private static async saveConfigToDB(config: AppConfig): Promise<void> {
    console.log("Config saved to DB");
  }
}

// ===========================================
// 6. USAGE EXAMPLES IN CONTROLLERS
// ===========================================

// Express.js route examples
export const userController = {
  async getProfile(req: any, res: any) {
    try {
      const { userId } = req.params;
      const user = await UserService.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  },

  async updateProfile(req: any, res: any) {
    try {
      const { userId } = req.params;
      await UserService.updateUser(userId, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Update failed" });
    }
  },
};

// ===========================================
// 7. CACHE MONITORING & MAINTENANCE
// ===========================================

export class CacheMonitor {
  static async checkCacheHealth(): Promise<void> {
    // Test basic operations
    const testKey = "health:test";
    await Cache.set(testKey, "test", 60);
    const result = await Cache.get(testKey);
    await Cache.del(testKey);

    if (result === "test") {
      console.log("✅ Cache is healthy");
    } else {
      console.log("❌ Cache health check failed");
    }
  }

  static async clearUserCache(userId: string): Promise<void> {
    // Clear all user-related cache
    await Cache.del(
      `user:${userId}`,
      `posts:user:${userId}`,
      `rate_limit:login:${userId}`
    );
    console.log(`✓ All cache cleared for user: ${userId}`);
  }

  static async warmupCache(): Promise<void> {
    console.log("🔥 Warming up cache...");

    // Pre-load frequently accessed data
    await ConfigService.getConfig();
    await PostService.getTrendingPosts();

    console.log("✓ Cache warmed up");
  }
}
