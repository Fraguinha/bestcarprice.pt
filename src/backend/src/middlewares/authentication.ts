import { Request, Response } from "express";

const authenticator = (req: Request, res: Response, next: () => void) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ authenticated: false });
};

export default authenticator;
