import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { ZodError } from "zod";
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "tech-talent-hub-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: app.get("env") === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local auth with username or email
  passport.use(
    new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password',
    }, async (username, password, done) => {
      try {
        // Check if login is using email
        let user = null;
        if (username.includes('@')) {
          user = await storage.getUserByEmail(username);
        } else {
          user = await storage.getUserByUsername(username);
        }
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );
  
  // GitHub OAuth
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
    },
    async (accessToken: string, refreshToken: string, profile: any, done: (error: Error | null, user?: any) => void) => {
      try {
        const email = profile.emails?.[0]?.value || '';
        // Check if user exists
        let user = await storage.getUserByEmail(email);
        
        if (!user && email) {
          // Check if email is already registered
          const existingEmailUser = await storage.getUserByEmail(email);
          if (existingEmailUser) {
            return done(new Error('Email already registered'));
          }
          // Create new user
          // Generate a random password for GitHub users
          const randomPassword = randomBytes(16).toString('hex');
          
          // Create username from GitHub username or name
          const username = profile.username || 
                         profile.displayName?.replace(/\s+/g, '') || 
                         profile.emails?.[0]?.value.split('@')[0] || 
                         `user${Date.now()}`;
          
          // Create the user
          // Ensure GitHub users can't be admins
          user = await storage.createUser({
            username,
            password: await hashPassword(randomPassword),
            name: profile.displayName || username,
            email: profile.emails?.[0]?.value,
            role: 'buyer', // Force buyer role
            avatar: profile.photos?.[0]?.value || '',
            location: '',
            status: 'active',
            statusMessage: '',
            isVpnUser: false,
          });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }));
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", authLimiter, async (req, res, next) => {
    try {
      // Validate request body
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const [existingUser, existingEmail] = await Promise.all([
        storage.getUserByUsername(userData.username),
        storage.getUserByEmail(userData.email)
      ]);

      if (existingUser) {
        return res.status(400).send("Username already exists");
      }
      
      if (existingEmail) {
        return res.status(400).send("Email already exists");
      }
      
      // Create user with forced non-admin role
      const user = await storage.createUser({
        ...userData,
        role: userData.role === 'admin' ? 'buyer' : userData.role, // Force non-admin role
        password: await hashPassword(userData.password),
      });
      
      // Log in the user
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove sensitive info
        const { password, ...safeUser } = user;
        res.status(201).json(safeUser);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | undefined, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).send("Invalid username or password");
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove sensitive info
        const { password, ...safeUser } = user;
        res.status(200).json(safeUser);
      });
    })(req, res, next);
  });

  // GitHub auth routes
  app.get("/api/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

  app.get("/api/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/auth" }),
    (req, res) => {
      // Successful authentication, redirect to home
      res.redirect("/");
    }
  );

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove sensitive info
    const { password, ...safeUser } = req.user!;
    res.json(safeUser);
  });
}
