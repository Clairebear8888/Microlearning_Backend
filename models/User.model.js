const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    username: {
      type: String,
      required: [true, "Name is required."],
    },
    progress: [
      {
        topic: String,
        lessonsCompleted: [{ type: Schema.Types.ObjectId, ref: "LessonModel" }],
        quizzesTaken: [
          {
            quiz: { type: Schema.Types.ObjectId, ref: "QuizModel" },
            score: Number,
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

const UserModel = model("UserModel", userSchema);

module.exports = UserModel;
