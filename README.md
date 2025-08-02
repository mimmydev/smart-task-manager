# Smart Task Manager

This is a full-stack serverless application built with Nuxt.js for the frontend and AWS Lambda with the Serverless Framework for the backend. It's designed as a learning project to explore full-stack development with a focus on serverless architecture.

## Features

- **Task Management**: Create, view, update, and delete tasks.
- **AI-Powered Analysis**: Leverage Google's Gemini API to analyze tasks and provide insights on urgency, importance, and estimated completion time.
- **Serverless Backend**: The backend is built with AWS Lambda and API Gateway, managed by the Serverless Framework.
- **Supabase Database**: Uses Supabase for a managed PostgreSQL database.
- **Modern Frontend**: The frontend is a reactive and responsive application built with Nuxt.js and Tailwind CSS.

## Tech Stack

- **Frontend**:
  - [Nuxt.js](https://nuxt.com/)
  - [Vue.js](https://vuejs.org/)
  - [Tailwind CSS](https://tailwindcss.com/)
- **Backend**:
  - [Node.js](https://nodejs.org/)
  - [AWS Lambda](https://aws.amazon.com/lambda/)
  - [AWS API Gateway](https://aws.amazon.com/api-gateway/)
  - [Serverless Framework](https://www.serverless.com/)
- **Database**:
  - [Supabase](https://supabase.com/) (PostgreSQL)
- **AI**:
  - [Google Gemini](https://ai.google.dev/)

## Project Structure

The project is organized into two main directories:

- `frontend/`: Contains the Nuxt.js frontend application.
- `backend/`: Contains the serverless backend application.

```
.
├── backend
│   ├── src
│   │   ├── handlers
│   │   │   ├── aiAnalysis.ts
│   │   │   ├── options.ts
│   │   │   └── tasks.ts
│   ├── serverless.yml
│   └── ...
├── frontend
│   ├── app
│   │   ├── components
│   │   ├── composables
│   │   ├── pages
│   │   └── ...
│   ├── nuxt.config.ts
│   └── ...
└── README.md
```

## API Endpoints

The following API endpoints are available:

- `GET /tasks`: Fetches all tasks.
- `POST /tasks`: Creates a new task.
- `PUT /tasks/{id}`: Updates an existing task.
- `DELETE /tasks/{id}`: Deletes a task.
- `GET /tasks/view/{task_id}`: Fetches a single task by its `task_id`.
- `POST /tasks/analyze/{task_id}`: Triggers an AI analysis of a task using Gemini.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher)
- [AWS CLI](https://aws.amazon.com/cli/) configured with your credentials
- [Serverless Framework](https://www.serverless.com/framework/docs/getting-started)
- A [Supabase](https://supabase.com/) account
- A [Google AI](https://ai.google.dev/) API key for Gemini

### Backend Setup

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/mimmydev/smart-task-manager.git
    cd smart-task-manager/backend
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Set up environment variables**:
    Create a `.env` file in the `backend` directory and add the following:

    ```
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_key
    GEMINI_API_KEY=your_gemini_api_key
    ```

4.  **Deploy the backend**:
    ```bash
    serverless deploy
    ```

### Frontend Setup

1.  **Navigate to the frontend directory**:

    ```bash
    cd ../frontend
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Set up environment variables**:
    Create a `.env` file in the `frontend` directory and add the following, using the API Gateway URL from the backend deployment:

    ```
    VITE_API_BASE_URL=your_api_gateway_url
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

The application should now be running at `http://localhost:3000`.
