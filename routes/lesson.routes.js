const router = require("express").Router();
const LessonModel = require("../models/Lesson.model");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

//create lesson by user
router.post("/create", (req, res) => {
  LessonModel.create(req.body)
    .then((newLesson) => {
      console.log("new lesson created", newLesson);
      res.status(200).json(newLesson);
    })

    .catch((err) => {
      console.log("error in create a lesson", err);
      res.status(500).json({ message: "err in create lesson" });
    });
});

//find all lesson

router.get("/alllesson", (req, res) => {
  LessonModel.find()
    .then((allLesson) => {
      console.log("Find all lesson", allLesson);
      res.status(200).json(allLesson);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ errorMessage: "problem find all lesson" });
    });
});

//get lesson by ID
router.get("/:lessonId", (req, res) => {
  const { lessonId } = req.params;
  LessonModel.findById(lessonId)
    .then((oneLesson) => {
      console.log("show one lesson by ID", oneLesson);
      res.status(200).json(oneLesson);
    })

    .catch((err) => {
      console.log("err in important one lesson by ID", err);
      res.status(500).json({ message: "error in import one lesson by ID" });
    });
});

// AI generate lesson

async function generateMultipleLessons(genAI, topic) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
  Create 15 mini-lessons about "${topic}".
    Each lesson should have:
    - A unique subtopic title
    - A 2 to 3 sentence summary
    - Exactly 3 bullet points
    Respond ONLY in valid JSON like this:

    {
      "topic": "${topic}",
      "lessons": [
        {
          "title": "...",
          "summary": "...",
          "bulletPoints": ["...", "...", "..."]
        }
      ]
    } `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Parse Gemini's text output into JSON
    const cleanText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleanText);
    return parsed.lessons;
  } catch (err) {
    console.error(" Error generating from Gemini:", err);
    throw new Error("Failed to generate lesson content");
  }
}

// --- ROUTE: POST /lesson/generate-multiple ---
router.post("/generate", isAuthenticated, async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    const { topic } = req.body;

    if (!topic || topic.trim() === "") {
      return res.status(400).json({ message: "Topic is required" });
    }

    // Generate 15 AI mini-lessons
    const lessons = await generateMultipleLessons(genAI, topic);

    // Map them into Lesson model format
    const lessonsToSave = lessons.map((l) => ({
      topic,
      subtopic: l.title,
      summary: l.summary,
      bulletPoints: l.bulletPoints,
      source: "AI",
    }));

    // Insert all lessons in bulk
    const createdLessons = await LessonModel.insertMany(lessonsToSave);

    res.status(201).json({
      message: ` Successfully created ${createdLessons.length} lessons for topic "${topic}"`,
      lessons: createdLessons,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error generating multiple lessons",
      error: err.message,
    });
  }

  // manually update a lesson
  router.put("/update/:lessonId", isAuthenticated, async (req, res) => {
    try {
      const { lessonId } = req.params;
      const updatedLesson = await LessonModel.findByIdAndUpdate(
        lessonId,
        req.body,
        { new: true }
      );
      if (!updatedLesson)
        return res.status(404).json({ message: "Lesson not found" });
      res.status(200).json(updatedLesson);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error updating lesson", error: err.message });
    }
  });

  //  DELETE a lesson
  router.delete("/:lessonId", isAuthenticated, async (req, res) => {
    try {
      const { lessonId } = req.params;
      const deletedLesson = await LessonModel.findByIdAndDelete(lessonId);
      if (!deletedLesson)
        return res.status(404).json({ message: "Lesson not found" });
      res.status(200).json({ message: "Lesson deleted successfully" });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error deleting lesson", error: err.message });
    }
  });
});

module.exports = router;
