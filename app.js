const express = require("express");
const multer = require("multer");
const fs = require("fs");
const fsPromises = require("fs").promises;
const { TextServiceClient } = require('@google-ai/generativelanguage'); // Use correct client

const app = express();
const port = process.env.PORT || 5000;
const apiKey = process.env.GEMINI_API_KEY || "GEMINI_API_KEY";

// Initialize the client with the API key
const client = new TextServiceClient({ apiKey: apiKey });

// Configure multer to store uploaded files
const upload = multer({ dest: "uploads/" });

// Configure express to use JSON
app.use(express.json({ limit: "10mb" }));

// Configure express to serve static files
app.use(express.static("public"));

// Route to upload the image
app.post("/upload", upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ success: true });
});

// Route to analyze the image
app.post("/analyze", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Please upload an image" });
        }
        
        const imagePath = req.file.path;
        const imageData = await fsPromises.readFile(imagePath, { encoding: "base64" });

        // Analyze the image using the Gemini API
        const results = await client.generateText({
            prompt: "Please analyze the provided plant image thoroughly and identify the species of the plant. Include a detailed assessment of its health and identify any diseases or pests that may be present. Describe the core characteristics of the plant and provide care recommendations based on its needs. Additionally, outline the optimal planting season and conditions for this species. Finally, give step-by-step instructions for proper care. Please respond in plain text without any markdown formatting.",
            inlineData: {
                mimeType: req.file.mimetype,
                data: imageData
            }
        });

        // Write the result to a file
        const plantInfo = results.response.text; // Ensure this corresponds to your API's response format
        
        // Remove the uploaded image
        await fsPromises.unlink(imagePath);
        
        res.json({
            success: true,
            plantInfo: plantInfo,
            image: `data:${req.file.mimetype};base64,${imageData}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred during analysis." });
    }
});

// Route to download the PDF
app.post("/download", async (req, res) => {
    // Your PDF generation logic here
    res.json({ success: true });
});

// Starting the server
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
