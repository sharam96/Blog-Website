import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL config
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Create post route (save to DB)
app.post("/create-post", async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ message: "Missing title or content" });

  try {
    const result = await pool.query(
      "INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING *",
      [title, content]
    );
    res.status(201).json({ message: "Post created", post: result.rows[0] });
  } catch (err) {
    console.error("Error inserting into DB:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch all posts
app.get("/posts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM posts ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete all posts
app.delete("/delete-all", async (req, res) => {
  try {
    await pool.query("DELETE FROM posts");
    res.json({ message: "All posts deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
