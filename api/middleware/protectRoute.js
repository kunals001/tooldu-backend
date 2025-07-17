import "dotenv/config";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await Admin.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.user = decoded;
        next();
    } catch (error) {
        console.log("Protect route error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};