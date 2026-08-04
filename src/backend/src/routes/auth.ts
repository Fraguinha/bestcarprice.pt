import express from "express";
import passport from "passport";
import { User } from "../models/user.js";

const router = express.Router();

router.post("/auth/status", (req, res) => {
  if (req.isAuthenticated() && req.user) {
    const user = req.user as User;
    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    res.json({ authenticated: true, user: safeUser });
  } else {
    res.json({ authenticated: false });
  }
});

router.post("/auth/login", (req, res, next) => {
  passport.authenticate("local", (err: any, user: any) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ success: false, error: "Invalid credentials" });
    req.logIn(user, (err: any) => {
      if (err) return next(err);
      const safeUser = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      return res.json({ success: true, user: safeUser });
    });
  })(req, res, next);
});

router.post("/auth/logout", (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

export default router;
