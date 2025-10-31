# MicroLearn API - Backend

🎓 AI-powered microlearning platform backend built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication**: JWT-based auth with secure password hashing
- **AI Content Generation**: Generates 15 personalized lessons per topic using Google's Gemini AI
- **Smart Quizzes**: AI-generated quizzes based on lesson content
- **Progress Tracking**: Tracks completed lessons and quiz scores per user
- **RESTful API**: Clean, organized endpoints for all features

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken), bcryptjs
- **AI Integration**: Google Generative AI (Gemini)
- **Security**: CORS, dotenv for environment variables

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Google Gemini API key

## ⚙️ Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd server
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `.env` file**
```env
PORT=5005
MONGODB_URI=mongodb://localhost:27017/microlearning
TOKEN_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
```

4. **Start the server**
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5005`

```

## 🔌 API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/verify` - Verify JWT token
- `GET /auth/profile/:userId` - Get user profile

### Lessons
- `POST /lesson/generate` - Generate 15 AI lessons for a topic
- `GET /lesson/alllesson` - Get all lessons
- `GET /lesson/:lessonId` - Get single lesson

### Quizzes
- `POST /quiz/generate` - Generate AI quiz from lessons
- `POST /quiz/submit/:quizId` - Submit quiz answers
- `GET /quiz/user/:userId` - Get user's quiz history
- `GET /quiz/:quizId` - Get single quiz

### Progress
- `GET /progress/:userId` - Get user's learning progress
- `POST /progress/lesson-complete` - Mark lesson as complete
- `POST /progress/quiz-complete` - Record quiz completion

## 🔐 Authentication

Protected routes require JWT token in headers:
```javascript
headers: {
  Authorization: `Bearer ${token}`
}
```

## 🤖 AI Integration

Uses Google's Gemini AI to generate:
- 15 unique mini-lessons per topic with subtopics, summaries, and bullet points
- 5-question multiple-choice quizzes based on lesson content

## 📊 Data Models

### User
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  progress: [{
    topic: String,
    lessonsCompleted: [LessonId],
    quizzesTaken: [{ quiz: QuizId, score: Number }]
  }]
}
```

### Lesson
```javascript
{
  topic: String,
  subtopic: String,
  summary: String,
  bulletPoints: [String],
  source: "AI" | "user"
}
```

### Quiz
```javascript
{
  user: UserId,
  topic: String,
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: String
  }],
  userAnswers: [String],
  score: Number,
  totalQuestions: Number
}
```

## 🚨 Error Handling

All routes include proper error handling with descriptive messages:
- 400: Bad Request (missing/invalid data)
- 401: Unauthorized (invalid/missing token)
- 404: Not Found
- 500: Server Error

## 🔧 Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5005) |
| `MONGODB_URI` | MongoDB connection string |
| `TOKEN_SECRET` | JWT signing secret |
| `GEMINI_API_KEY` | Google Gemini API key |

## 📝 Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Claire Zhu - https://github.com/Clairebear8888/

## 🙏 Acknowledgments

- Google Gemini AI for content generation
- MongoDB for database
- Express.js community
