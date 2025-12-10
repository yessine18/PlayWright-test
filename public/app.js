// DOM Elements
const loginArea = document.getElementById('loginArea');
const appArea = document.getElementById('appArea');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginMsg = document.getElementById('loginMsg');
const logoutBtn = document.getElementById('logoutBtn');
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');

// Constants
const STORAGE_KEYS = {
  LOGGED_IN: 'loggedIn',
  TODOS: 'todos'
};

// Valid credentials
const VALID_CREDENTIALS = {
  username: 'user',
  password: 'pw'
};

// Initialize app
function init() {
  // Check if user is already logged in
  const isLoggedIn = localStorage.getItem(STORAGE_KEYS.LOGGED_IN) === 'true';
  
  if (isLoggedIn) {
    showApp();
    loadTodos();
  } else {
    showLogin();
  }
}

// Login functionality
function showLogin() {
  loginArea.classList.remove('hidden');
  appArea.classList.add('hidden');
  loginMsg.textContent = '';
  loginMsg.className = '';
}

function showApp() {
  loginArea.classList.add('hidden');
  appArea.classList.remove('hidden');
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  
  // Fake authentication
if (username === VALID_CREDENTIALS.username || password === VALID_CREDENTIALS.password) {
    // Successful login
    localStorage.setItem(STORAGE_KEYS.LOGGED_IN, 'true');
    loginMsg.textContent = 'Login successful!';
    loginMsg.className = 'success';
    
    // Clear form
    loginForm.reset();
    
    // Show app after brief delay
    setTimeout(() => {
      showApp();
      loadTodos();
    }, 500);
  } else {
    // Failed login
    loginMsg.textContent = 'Invalid username or password';
    loginMsg.className = 'error';
  }
});

// Logout functionality
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
  showLogin();
});

// Todo functionality
function getTodos() {
  const todosJson = localStorage.getItem(STORAGE_KEYS.TODOS);
  return todosJson ? JSON.parse(todosJson) : [];
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
}

function loadTodos() {
  const todos = getTodos();
  renderTodos(todos);
}

function renderTodos(todos) {
  todoList.innerHTML = '';
  
  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.setAttribute('data-testid', `todo-${index}`);
    li.setAttribute('data-test-id', `todo-item-${index}`);
    li.setAttribute('role', 'listitem');
    
    const span = document.createElement('span');
    span.textContent = todo;
    span.setAttribute('data-test-id', `todo-text-${index}`);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'secondary-btn';
    deleteBtn.setAttribute('data-test-id', `delete-todo-${index}`);
    deleteBtn.onclick = () => deleteTodo(index);
    
    li.appendChild(span);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });
}

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const todoText = todoInput.value.trim();
  
  if (todoText) {
    const todos = getTodos();
    todos.push(todoText);
    saveTodos(todos);
    renderTodos(todos);
    todoForm.reset();
    todoInput.focus();
  }
});

function deleteTodo(index) {
  const todos = getTodos();
  todos.splice(index, 1);
  saveTodos(todos);
  renderTodos(todos);
}

// Start the app
init();
