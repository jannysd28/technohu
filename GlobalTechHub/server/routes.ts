import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertProjectSchema, insertRequestSchema, insertPitchSchema, insertRatingSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Get user profile
  app.get("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).send("Invalid user ID");

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).send("User not found");

    // Remove sensitive information
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  // Update user profile
  app.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (req.user!.id !== parseInt(req.params.id)) return res.status(403).send("Forbidden");

    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).send("Invalid user ID");

    try {
      const updatedUser = await storage.updateUser(userId, req.body);
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Projects
  app.post("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (req.user!.role !== "seller" && req.user!.role !== "both") {
      return res.status(403).send("Only sellers can create projects");
    }

    try {
      const projectData = insertProjectSchema.parse({ ...req.body, sellerId: req.user!.id });
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/projects", async (req, res) => {
    try {
      const sellerId = req.query.sellerId ? parseInt(req.query.sellerId as string) : undefined;
      const cacheKey = `projects-${sellerId || 'all'}`;

      // Add cache control headers
      res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

      const projects = await storage.getProjects(sellerId);
      res.json(projects);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) return res.status(400).send("Invalid project ID");

    try {
      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).send("Project not found");
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Sellers
  app.get("/api/sellers", async (req, res) => {
    try {
      const filters = {
        status: req.query.status as string | undefined,
      };
      const sellers = await storage.getSellers(filters);
      res.json(sellers);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Requests
  app.post("/api/requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const requestData = insertRequestSchema.parse({ ...req.body, buyerId: req.user!.id });
      const request = await storage.createRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const buyerId = req.query.buyerId ? parseInt(req.query.buyerId as string) : undefined;
      const sellerId = req.query.sellerId ? parseInt(req.query.sellerId as string) : undefined;

      // Ensure user can only view their own requests
      if (buyerId && buyerId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).send("Forbidden");
      }
      if (sellerId && sellerId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).send("Forbidden");
      }

      const requests = await storage.getRequests({ buyerId, sellerId });
      res.json(requests);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Pitches
  app.post("/api/pitches", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (req.user!.role !== "seller" && req.user!.role !== "both") {
      return res.status(403).send("Only sellers can create pitches");
    }

    try {
      // Check daily pitch limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const pitchCount = await storage.countPitchesBySellerSince(req.user!.id, today);

      if (pitchCount >= 5) {
        return res.status(403).json({ message: "Daily pitch limit reached (5)" });
      }

      const pitchData = insertPitchSchema.parse({ ...req.body, sellerId: req.user!.id });
      const pitch = await storage.createPitch(pitchData);
      res.status(201).json(pitch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/pitches", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const buyerId = req.query.buyerId ? parseInt(req.query.buyerId as string) : undefined;
      const sellerId = req.query.sellerId ? parseInt(req.query.sellerId as string) : undefined;

      // Ensure user can only view their own pitches
      if (buyerId && buyerId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).send("Forbidden");
      }
      if (sellerId && sellerId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).send("Forbidden");
      }

      const pitches = await storage.getPitches({ buyerId, sellerId });
      res.json(pitches);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (req.user!.role !== "admin" || 
        req.user!.email !== process.env.TECHHUB_ADMIN_EMAIL ||
        !(await comparePasswords(req.user!.password, process.env.TECHHUB_ADMIN_PASSWORD || ''))) {
      return res.status(403).send("Forbidden - Invalid admin credentials");
    }

    try {
      // Get all users (for admin dashboard)
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/admin/users/:userId/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (req.user!.role !== "admin") return res.status(403).send("Forbidden");

    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).send("Invalid user ID");

    try {
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).send("User not found");

      // Only allow verifying sellers
      if (user.role !== "seller" && user.role !== "both") {
        return res.status(400).send("Only sellers can be verified");
      }

      // Update user status to verified
      const updatedUser = await storage.updateUser(userId, { status: "verified" });
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Ratings
  app.post("/api/ratings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const ratingData = insertRatingSchema.parse({ ...req.body, buyerId: req.user!.id });
      const rating = await storage.createRating(ratingData);
      res.status(201).json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/ratings/:sellerId", async (req, res) => {
    const sellerId = parseInt(req.params.sellerId);
    if (isNaN(sellerId)) return res.status(400).send("Invalid seller ID");

    try {
      const ratings = await storage.getRatingsBySeller(sellerId);
      res.json(ratings);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Uploads
  app.get("/api/uploads/:requestId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const requestId = parseInt(req.params.requestId);
    if (isNaN(requestId)) return res.status(400).send("Invalid request ID");

    try {
      const uploads = await storage.getUploadsByRequest(requestId);
      res.json(uploads);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Payment routes
app.post("/api/payments/create-intent", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
  
  try {
    const paymentData = paymentSchema.parse(req.body);
    const paymentIntent = await createPaymentIntent(paymentData);
    res.json(paymentIntent);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post("/api/uploads", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
      const uploadData = insertUploadSchema.parse(req.body);

      // Verify this is an active request
      const request = await storage.getRequest(uploadData.requestId);
      if (!request || request.status !== "accepted") {
        return res.status(400).json({ message: "Invalid or inactive request" });
      }

      // Verify user is the seller
      if (request.sellerId !== req.user!.id) {
        return res.status(403).json({ message: "Only the seller can upload files" });
      }

      const upload = await storage.createUpload(uploadData);
      res.status(201).json(upload);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(400).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}