const router = require("express").Router();
const UserModel = require("../models/User.model");
const LessonModel = require("../models/Lesson.model");
const QuizModel = require("../models/Quiz.model");
const { isAuthenticated } = require("../middlewares/jwt.middleware");
const mongoose = require("mongoose");

// GET /progress/:userId
router.get("/:userId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await UserModel.findById(userId)
      .populate("progress.lessonsCompleted")
      .populate("progress.quizzesTaken.quiz");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Summarize progress per topic
    const summary = user.progress.map((p) => {
      const totalLessons = p.lessonsCompleted.length;
      const totalQuizzes = p.quizzesTaken.length;
      const avgScore =
        totalQuizzes > 0
          ? (
              p.quizzesTaken.reduce((sum, q) => sum + q.score, 0) / totalQuizzes
            ).toFixed(1)
          : 0;

      return {
        topic: p.topic,
        lessonsCompleted: totalLessons,
        quizzesTaken: totalQuizzes,
        averageScore: Number(avgScore),
      };
    });

    res.status(200).json({
      username: user.username,
      progress: summary,
    });
  } catch (err) {
    console.error("Error fetching user progress:", err);
    res.status(500).json({ message: "Error fetching user progress" });
  }
});

// POST /progress/lesson-complete
router.post("/lesson-complete", isAuthenticated, async (req, res) => {
  try {
    const userId = req.payLoad._id;
    const { lessonId, topic } = req.body;

    if (!lessonId || !topic)
      return res.status(400).json({ message: "LessonId and topic required" });

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Find or create topic progress
    let topicProgress = user.progress.find((p) => p.topic === topic);
    if (!topicProgress) {
      topicProgress = { topic, lessonsCompleted: [], quizzesTaken: [] };
      user.progress.push(topicProgress);
    }

    // Add lesson if not already completed
    if (
      !topicProgress.lessonsCompleted.some((id) =>
        id.equals(new mongoose.Types.ObjectId(lessonId))
      )
    ) {
      topicProgress.lessonsCompleted.push(lessonId);
    }
    await user.save();
    res.status(200).json({ message: "Lesson marked as complete" });
  } catch (err) {
    console.error("Error updating lesson progress:", err);
    res.status(500).json({ message: "Error updating lesson progress" });
  }
});

// ✅ POST /progress/quiz-complete
router.post("/quiz-complete", isAuthenticated, async (req, res) => {
  try {
    const userId = req.payLoad._id;
    const { quizId, topic, score } = req.body;

    if (!quizId || !topic)
      return res.status(400).json({ message: "QuizId and topic required" });

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Find or create topic progress
    let topicProgress = user.progress.find((p) => p.topic === topic);
    if (!topicProgress) {
      topicProgress = { topic, lessonsCompleted: [], quizzesTaken: [] };
      user.progress.push(topicProgress);
    }

    // Add quiz result
    topicProgress.quizzesTaken.push({ quiz: quizId, score });

    await user.save();
    res.status(200).json({ message: "Quiz progress updated" });
  } catch (err) {
    console.error("Error updating quiz progress:", err);
    res.status(500).json({ message: "Error updating quiz progress" });
  }
});

module.exports = router;
