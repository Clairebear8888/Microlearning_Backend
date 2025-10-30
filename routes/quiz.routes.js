const router = require("express").Router();
const QuizModel = require("../models/Quiz.model");
const LessonModel = require("../models/Lesson.model");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { isAuthenticated } = require("../middlewares/jwt.middleware");

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

// --- POST /quiz/generate ---
router.post("/generate", isAuthenticated, async (req, res) => {
  try {
    const { topic, lessonIds } = req.body;
    const userId = req.payLoad._id;

    // Debug logging
    console.log(" BACKEND RECEIVED:");
    console.log("   - Topic:", topic);
    console.log("   - Topic type:", typeof topic);
    console.log("   - LessonIds:", lessonIds);
    console.log("   - UserId:", userId);

    // Validate topic
    if (!topic || topic === "undefined" || topic.trim() === "") {
      return res.status(400).json({ message: "Valid topic is required" });
    }

    let lessonTexts = "";

    // Fetch lessons
    if (lessonIds && lessonIds.length > 0) {
      const lessons = await LessonModel.find({ _id: { $in: lessonIds } });
      console.log("   - Found lessons:", lessons.length);

      lessonTexts = lessons
        .map((l) => `${l.subtopic}: ${l.summary}`)
        .join("\n");

      console.log("   - Lesson texts length:", lessonTexts.length);
    } else {
      console.log("   - No lesson IDs provided");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Based on the following lessons about "${topic}", create a 5-question multiple-choice quiz.
Each question should have exactly 4 options and 1 correct answer.

IMPORTANT: Return ONLY valid JSON with NO markdown formatting or code blocks.
Use this exact structure:

{
  "topic": "${topic}",
  "questions": [
    {
      "questionText": "Your question here?",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswer": "Option A text"
    }
  ]
}

The correctAnswer must be the EXACT text of one of the options, not just "A" or "B".

Lessons content:
${lessonTexts}
`;

    console.log("🔍 Generating quiz with AI...");

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log(
      "🔍 AI RAW RESPONSE (first 300 chars):",
      text.substring(0, 300)
    );

    // Clean markdown code blocks and extra whitespace
    const cleanText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    console.log(
      "🔍 CLEANED TEXT (first 300 chars):",
      cleanText.substring(0, 300)
    );

    let parsed;
    try {
      parsed = JSON.parse(cleanText);
      console.log("JSON PARSED SUCCESSFULLY");
      console.log("   - Parsed topic:", parsed.topic);
      console.log("   - Questions count:", parsed.questions?.length);
    } catch (err) {
      console.error(" JSON PARSE ERROR:", err.message);
      console.error(" Full cleaned text:", cleanText);
      return res.status(500).json({
        message: "AI response not valid JSON",
        detail: err.message,
      });
    }

    // Create quiz in database
    const newQuiz = await QuizModel.create({
      user: userId,
      topic: topic,
      questions: parsed.questions,
      totalQuestions: parsed.questions.length,
    });

    console.log("Quiz created with ID:", newQuiz._id);

    res.status(201).json({
      message: ` Quiz generated for topic "${topic}"`,
      quiz: newQuiz,
    });
  } catch (err) {
    console.error(" Error generating quiz:", err);
    res.status(500).json({
      message: "Error generating quiz",
      error: err.message,
    });
  }
});

// --- POST /quiz/submit/:quizId ---
router.post("/submit/:quizId", isAuthenticated, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // array of user's answers

    console.log("🔍 Submitting quiz:", quizId);
    console.log("   - Answers:", answers);

    const quiz = await QuizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    let score = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        score++;
      }
    });

    quiz.userAnswers = answers;
    quiz.score = score;
    quiz.completedAt = new Date();
    await quiz.save();

    console.log(" Quiz submitted - Score:", score, "/", quiz.totalQuestions);

    res.status(200).json({
      message: " Quiz submitted successfully",
      score,
      total: quiz.totalQuestions,
    });
  } catch (err) {
    console.error(" Error submitting quiz:", err);
    res.status(500).json({
      message: "Error submitting quiz",
      error: err.message,
    });
  }
});

// --- GET /quiz/user/:userId ---
router.get("/user/:userId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;

    const quizzes = await QuizModel.find({ user: userId }).sort({
      createdAt: -1,
    });

    console.log(" Found", quizzes.length, "quizzes for user:", userId);

    res.status(200).json(quizzes);
  } catch (err) {
    console.error("Error fetching user quizzes:", err);
    res.status(500).json({
      message: "Error fetching user quizzes",
      error: err.message,
    });
  }
});

// --- GET /quiz/:quizId ---
router.get("/:quizId", isAuthenticated, async (req, res) => {
  try {
    const quiz = await QuizModel.findById(req.params.quizId);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.status(200).json(quiz);
  } catch (err) {
    console.error(" Error fetching quiz:", err);
    res.status(500).json({
      message: "Error fetching quiz",
      error: err.message,
    });
  }
});

module.exports = router;
