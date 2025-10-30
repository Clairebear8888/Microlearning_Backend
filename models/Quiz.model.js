const { Schema, model } = require("mongoose");

const quizSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: String, required: true },
    questions: [
      {
        questionText: String,
        options: [String],
        correctAnswer: String, // store for grading
      },
    ],
    userAnswers: [String],
    score: { type: Number, default: 0 },
    totalQuestions: Number,
    completedAt: { type: Date },
    source: { type: String, default: "AI" },
  },
  { timestamps: true }
);

const QuizModel = model("QuizModel", quizSchema);

module.exports = QuizModel;
