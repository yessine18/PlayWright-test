# Playwright Test Playground

A minimal Node.js web application intentionally created **without any tests**. This project serves as a playground where you can manually add and practice writing Playwright tests.

## About This Project

This is a simple Express-based web app with:
- **Fake authentication system**: Login with username `user` and password `pw`
- **Todo list functionality**: Add and delete todos (stored in localStorage)
- **Clean HTML structure**: All interactive elements have stable IDs for easy test selection

**Important**: This repository contains **NO tests, NO test frameworks, and NO Playwright configuration**. You will add these yourself as a learning exercise.

## Installation

```bash
npm install
```

## Running the Application

Start the server:

```bash
npm start
```

Or use nodemon for development (auto-restart on file changes):

```bash
npm run dev
```

The application will be available at **http://localhost:3000**

## Application Behavior

### Login Flow
- Navigate to http://localhost:3000
- **Valid credentials**: username = `user`, password = `pw`
- **Invalid credentials**: Any other combination will show an error message
- Successful login stores a flag in localStorage and displays the todo app
- Login state persists across page refreshes

### Todo Management
- Once logged in, you can:
  - Add new todos via the input field
  - Delete existing todos via the delete button
  - All todos are stored in localStorage
  - Todos persist across sessions

### Logout
- Click the logout button to clear the login state and return to the login screen

## DOM Element IDs for Testing

The following stable IDs are available for writing Playwright selectors:

### Login Area
- `#loginArea` - Container for login section
- `#loginForm` - Login form element
- `#username` - Username input field
- `#password` - Password input field
- `#loginMsg` - Status message (shows success/error)

### App Area
- `#appArea` - Container for todo app (hidden until logged in)
- `#logoutBtn` - Logout button
- `#todoForm` - Form for adding todos
- `#todoInput` - Input field for new todo text
- `#todoList` - Unordered list container for todos
- Individual todo items have `data-testid="todo-{index}"` attributes

## Project Structure

```
.
├── server.js           # Express server
├── package.json        # Dependencies and scripts
├── public/
│   ├── index.html     # Main HTML page
│   └── app.js         # Client-side JavaScript
└── README.md          # This file
```

## Next Steps

This project is ready for you to:
1. Install Playwright: `npm init playwright@latest`
2. Write your first test
3. Practice E2E testing scenarios

Happy testing! 🎭
