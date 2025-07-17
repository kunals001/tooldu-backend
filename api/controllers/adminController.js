import "dotenv/config";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import ConvertImagePost from "../models/convert.image.post.model.js";


// // Signup Admin
// export const signupAdmin = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     if (!name || !email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Missing name, email or password" });
//     }

//     const existUser = await Admin.findOne({ email });

//     if (existUser) {
//       return res.status(409).json({ message: "User already exists" });
//     }

//     const newUser = new Admin({
//       name,
//       email,
//       password,
//       isAdmin: true,
//     });

//     await newUser.save();

//     res.status(201).json({ message: "Signup successful" });
//   } catch (error) {
//     console.log("Signup error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// Login Admin
export const loginAdmin = async (req, res) => {
  try {
    const { name,email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Missing email or password" });
    }

    const existUser = await Admin.findOne({ email });

    if (!existUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (existUser.isAdmin === false) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (existUser.name !== name) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isMatch = await existUser.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: existUser._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, 
    });

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Logout Admin
export const logoutAdmin = (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.log("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Send only what's expected in frontend
    res.status(200).json({
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.log("CheckAuth error:", error);
    res.status(500).json({ message: "Internal server error in checkAuth" });
  }
};


/// Convert Image Post Routes 
export const createConvertImagePost = async (req, res) => {
  try {

    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      title,
      description,
      keyword,
      mainPartHeadOne,
      mainPartHeadTwo,
      bottomPart,
    } = req.body;

    // Basic validation
    if (
      !title ||
      !description ||
      !keyword ||
      !mainPartHeadOne ||
      !mainPartHeadTwo ||
      !bottomPart
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newPost = new ConvertImagePost({
      title,
      description,
      keyword,
      mainPartHeadOne,
      mainPartHeadTwo,
      bottomPart,
    });

    await newPost.save();

    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.log("Create Post error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateConvertImagePost = async (req, res) => {
  try {

    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params; // post ID from URL
    const {
      title,
      description,
      keyword,
      mainPartHeadOne,
      mainPartHeadTwo,
      bottomPart,
    } = req.body;

    // Find existing post
    const post = await ConvertImagePost.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Update fields only if provided
    if (title) post.title = title;
    if (description) post.description = description;
    if (keyword) post.keyword = keyword;
    if (mainPartHeadOne) post.mainPartHeadOne = mainPartHeadOne;
    if (mainPartHeadTwo) post.mainPartHeadTwo = mainPartHeadTwo;
    if (bottomPart) post.bottomPart = bottomPart;

    const updatedPost = await post.save();

    res.status(200).json({
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.log("Update Post error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const deleteConvertImagePost = async (req, res) => {
  try {

    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const deletedPost = await ConvertImagePost.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Delete Post error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getConvertImagePosts = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    // ✅ Fix this line
    const posts = await ConvertImagePost.findById(id);

    res.status(200).json({ post: posts }); // return as `post` for frontend
  } catch (error) {
    console.log("Get single post error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getAllConvertImagePosts = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const posts = await ConvertImagePost.find();
    res.status(200).json({ posts });
  } catch (error) {
    console.log("Get all posts error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}