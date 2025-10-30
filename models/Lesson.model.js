const { Schema, model } = require("mongoose");

const lessonSchema = new Schema(
  {
    topic: { type: String, required: true }, // main topic (e.g., “Python Basics”)
    subtopic: { type: String }, // each mini-lesson’s title
    summary: { type: String },
    bulletPoints: [String],
    source: { type: String, enum: ["AI", "user"], default: "AI" },
  },
  { timestamps: true }
);

const LessonModel = model("LessonModel", lessonSchema);

module.exports = LessonModel;
