import { 
  users, projects, requests, pitches, ratings,
  User, InsertUser, 
  Project, InsertProject,
  Request, InsertRequest,
  Pitch, InsertPitch,
  Rating, InsertRating
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Filters for queries
interface SellerFilters {
  status?: string;
}

interface RequestFilters {
  buyerId?: number;
  sellerId?: number;
}

// Upload storage methods
async function createUpload(data: InsertUpload): Promise<Upload> {
  return db.insert(uploads).values(data).returning().then(rows => rows[0]);
}

async function getUploadsByRequest(requestId: number): Promise<Upload[]> {
  return db.select().from(uploads).where(eq(uploads.requestId, requestId));
}

interface PitchFilters {
  buyerId?: number;
  sellerId?: number;
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getProjects(sellerId?: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;

  // Sellers
  getSellers(filters?: SellerFilters): Promise<User[]>;

  // Requests
  getRequest(id: number): Promise<Request | undefined>;
  getRequests(filters?: RequestFilters): Promise<Request[]>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequest(id: number, updates: Partial<Request>): Promise<Request>;

  // Pitches
  getPitches(filters?: PitchFilters): Promise<Pitch[]>;
  createPitch(pitch: InsertPitch): Promise<Pitch>;
  countPitchesBySellerSince(sellerId: number, since: Date): Promise<number>;

  // Ratings
  getRatingsBySeller(sellerId: number): Promise<Rating[]>;
  createRating(rating: InsertRating): Promise<Rating>;

  // Session storage
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private requests: Map<number, Request>;
  private pitches: Map<number, Pitch>;
  private ratings: Map<number, Rating>;
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private projectIdCounter: number;
  private requestIdCounter: number;
  private pitchIdCounter: number;
  private ratingIdCounter: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.requests = new Map();
    this.pitches = new Map();
    this.ratings = new Map();
    
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.requestIdCounter = 1;
    this.pitchIdCounter = 1;
    this.ratingIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const timestamp = new Date();
    const newUser: User = { ...user, id, createdAt: timestamp };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjects(sellerId?: number): Promise<Project[]> {
    const projects = Array.from(this.projects.values());
    if (sellerId) {
      return projects.filter(project => project.sellerId === sellerId);
    }
    return projects;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const timestamp = new Date();
    const newProject: Project = { ...project, id, createdAt: timestamp };
    this.projects.set(id, newProject);
    return newProject;
  }

  // Sellers
  async getSellers(filters?: SellerFilters): Promise<User[]> {
    let sellers = Array.from(this.users.values()).filter(
      user => user.role === "seller" || user.role === "both"
    );
    
    // Apply filters
    if (filters?.status) {
      sellers = sellers.filter(seller => seller.status === filters.status);
    }
    
    return sellers;
  }

  // Requests
  async getRequest(id: number): Promise<Request | undefined> {
    return this.requests.get(id);
  }

  async getRequests(filters?: RequestFilters): Promise<Request[]> {
    let requests = Array.from(this.requests.values());
    
    // Apply filters
    if (filters?.buyerId) {
      requests = requests.filter(request => request.buyerId === filters.buyerId);
    }
    
    if (filters?.sellerId) {
      requests = requests.filter(request => request.sellerId === filters.sellerId);
    }
    
    return requests;
  }

  async createRequest(request: InsertRequest): Promise<Request> {
    const id = this.requestIdCounter++;
    const timestamp = new Date();
    const newRequest: Request = { ...request, id, createdAt: timestamp };
    this.requests.set(id, newRequest);
    return newRequest;
  }

  async updateRequest(id: number, updates: Partial<Request>): Promise<Request> {
    const request = await this.getRequest(id);
    if (!request) {
      throw new Error("Request not found");
    }
    
    const updatedRequest = { ...request, ...updates };
    this.requests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Pitches
  async getPitches(filters?: PitchFilters): Promise<Pitch[]> {
    let pitches = Array.from(this.pitches.values());
    
    // Apply filters
    if (filters?.buyerId) {
      pitches = pitches.filter(pitch => pitch.buyerId === filters.buyerId);
    }
    
    if (filters?.sellerId) {
      pitches = pitches.filter(pitch => pitch.sellerId === filters.sellerId);
    }
    
    return pitches;
  }

  async createPitch(pitch: InsertPitch): Promise<Pitch> {
    const id = this.pitchIdCounter++;
    const timestamp = new Date();
    const newPitch: Pitch = { ...pitch, id, createdAt: timestamp };
    this.pitches.set(id, newPitch);
    return newPitch;
  }

  async countPitchesBySellerSince(sellerId: number, since: Date): Promise<number> {
    return (await this.getPitches({ sellerId })).filter(
      pitch => new Date(pitch.createdAt) >= since
    ).length;
  }

  // Ratings
  async getRatingsBySeller(sellerId: number): Promise<Rating[]> {
    return Array.from(this.ratings.values()).filter(
      rating => rating.sellerId === sellerId
    );
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const id = this.ratingIdCounter++;
    const timestamp = new Date();
    const newRating: Rating = { ...rating, id, createdAt: timestamp };
    this.ratings.set(id, newRating);
    return newRating;
  }
}

export const storage = new MemStorage();
