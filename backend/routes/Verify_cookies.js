 import jwt from "jsonwebtoken";

 
 
 
 export function VerifyCookies(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) {
    console.log("No token found from cookies")
    return res.status(400).json({ status: "failure", statusMessage: "jwt not found" })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.token = decoded;
    next();
  }
  catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.log("expired token, try to refresh...");
      return res.status(404).json({ statusMessage: "expired jwt", status: "failure" });
    }
    console.log("error in verifying token: ", err)
    return res.status(400).json({ status: "failure", statusMessage: "Invalid jwt" });
  }
}