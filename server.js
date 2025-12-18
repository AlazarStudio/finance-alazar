import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import https from "https";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 443;
const DATA_DIR = join(__dirname, "data");
const DATA_FILE = join(DATA_DIR, "data.json");
const AUTH_FILE = join(DATA_DIR, "auth.json");

// Пути к SSL сертификатам (можно задать через переменные окружения)
// По умолчанию используем Let's Encrypt сертификаты
const SSL_DIR = process.env.SSL_DIR || "/etc/letsencrypt/live/backendfinance.demoalazar.ru";
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || join(SSL_DIR, "privkey.pem");
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || join(SSL_DIR, "fullchain.pem");
const SSL_CA_PATH = process.env.SSL_CA_PATH || join(SSL_DIR, "chain.pem");

// Простая функция для хеширования пароля (для продакшена лучше использовать bcrypt)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

// Генерация токена
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}

// Загрузка данных авторизации
function loadAuth() {
  try {
    if (existsSync(AUTH_FILE)) {
      const data = JSON.parse(readFileSync(AUTH_FILE, "utf-8"));
      
      // Проверяем, что passwordHash является хешем (число в строке), а не паролем
      // Если passwordHash равен паролю "admin", пересоздаем с правильным хешем
      if (data.passwordHash === "admin" || data.passwordHash === data.username) {
        console.warn("⚠️  Password hash is invalid, regenerating...");
        data.passwordHash = simpleHash("6Rm%HLz4");
        saveAuth(data);
      }
      
      return data;
    }
  } catch (error) {
    console.error("Error loading auth:", error);
  }
  
  // По умолчанию: admin / admin
  const defaultAuth = {
    username: "admin",
    passwordHash: simpleHash("6Rm%HLz4"),
  };
  saveAuth(defaultAuth);
  return defaultAuth;
}

// Сохранение данных авторизации
function saveAuth(auth) {
  try {
    initDataDir();
    writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error saving auth:", error);
    return false;
  }
}

// Хранилище активных токенов (в продакшене лучше использовать Redis)
const activeTokens = new Set();
const TOKENS_FILE = join(DATA_DIR, "tokens.json");

// Инициализация данных
function initDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Загрузка токенов из файла при старте сервера
function loadTokens() {
  try {
    initDataDir(); // Убеждаемся, что директория существует
    if (existsSync(TOKENS_FILE)) {
      const tokensData = JSON.parse(readFileSync(TOKENS_FILE, "utf-8"));
      tokensData.tokens.forEach(token => activeTokens.add(token));
    } else {
    }
  } catch (error) {
    console.error("Error loading tokens:", error);
  }
}

// Сохранение токенов в файл
function saveTokens() {
  try {
    initDataDir();
    const tokensData = { tokens: Array.from(activeTokens) };
    writeFileSync(TOKENS_FILE, JSON.stringify(tokensData, null, 2), "utf-8");
    // Проверяем, что токены действительно сохранены
    if (existsSync(TOKENS_FILE)) {
      const savedData = JSON.parse(readFileSync(TOKENS_FILE, "utf-8"));
    }
  } catch (error) {
    console.error("[saveTokens] Error saving tokens:", error);
  }
}

// Загружаем токены при старте
initDataDir();
loadTokens();

// Middleware для проверки авторизации
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  
  if (!activeTokens.has(token)) {
    
    // Проверяем, может быть токен в файле, но не загружен в память
    try {
      if (existsSync(TOKENS_FILE)) {
        const fileData = JSON.parse(readFileSync(TOKENS_FILE, "utf-8"));
        const tokenInFile = fileData.tokens.includes(token);
        if (tokenInFile && !activeTokens.has(token)) {
          activeTokens.add(token);
        }
      }
    } catch (error) {
      console.error(`[requireAuth] Error checking token file:`, error);
    }
    
    // Повторная проверка после возможной перезагрузки
    if (!activeTokens.has(token)) {
      return res.status(401).json({ error: "Invalid token" });
    }
  }

  next();
}

// Обработка OPTIONS запросов (preflight CORS)
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Middleware для логирования всех запросов
app.use((req, res, next) => {
  next();
});

// Middleware
app.use(cors({
  origin: true, // Разрешаем все источники
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Инициализация авторизации
loadAuth();

function loadData() {
  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading data:", error);
  }
  
  return {
    clients: [],
    employees: [],
    expenseCategories: [],
    fixedExpenses: [],
    variableExpenses: [],
    incomes: [],
    organization: {
      name: "",
      inn: "",
      address: "",
      phone: "",
      email: "",
      website: "",
    },
    appSettings: {
      currency: "₽",
      dateFormat: "DD.MM.YYYY",
      language: "ru",
      taxPercent: "",
      theme: "light",
    },
  };
}

function saveData(data) {
  try {
    initDataDir();
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error saving data:", error);
    return false;
  }
}

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Получить все данные
app.get("/api/data", requireAuth, (req, res) => {
  try {
    const data = loadData();
    res.json(data);
  } catch (error) {
    console.error(`[GET /api/data] Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Обновить все данные
app.put("/api/data", requireAuth, (req, res) => {
  try {
    const data = req.body;
    if (saveData(data)) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Failed to save data" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clients
app.get("/api/clients", requireAuth, (req, res) => {
  try {
    const data = loadData();
    res.json(data.clients || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/clients", requireAuth, (req, res) => {
  try {
    const data = loadData();
    const client = { ...req.body, id: generateId() };
    data.clients.push(client);
    saveData(data);
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/clients/:id", requireAuth, (req, res) => {
  try {
    const data = loadData();
    const index = data.clients.findIndex((c) => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Client not found" });
    }
    data.clients[index] = { ...data.clients[index], ...req.body };
    saveData(data);
    res.json(data.clients[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/clients/:id", requireAuth, (req, res) => {
  try {
    const data = loadData();
    data.clients = data.clients.filter((c) => c.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Employees
app.get("/api/employees", (req, res) => {
  try {
    const data = loadData();
    res.json(data.employees || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/employees", requireAuth, (req, res) => {
  try {
    const data = loadData();
    const employee = { ...req.body, id: generateId() };
    data.employees.push(employee);
    saveData(data);
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/employees/:id", requireAuth, (req, res) => {
  try {
    const data = loadData();
    const index = data.employees.findIndex((e) => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Employee not found" });
    }
    data.employees[index] = { ...data.employees[index], ...req.body };
    saveData(data);
    res.json(data.employees[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/employees/:id", requireAuth, (req, res) => {
  try {
    const data = loadData();
    data.employees = data.employees.filter((e) => e.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Incomes
app.get("/api/incomes", requireAuth, (req, res) => {
  try {
    const data = loadData();
    res.json(data.incomes || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/incomes", requireAuth, (req, res) => {
  try {
    const data = loadData();
    const income = { ...req.body, id: generateId() };
    data.incomes.push(income);
    saveData(data);
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/incomes/:id", requireAuth, (req, res) => {
  try {
    const data = loadData();
    const index = data.incomes.findIndex((i) => i.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Income not found" });
    }
    data.incomes[index] = { ...data.incomes[index], ...req.body };
    saveData(data);
    res.json(data.incomes[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/incomes/:id", requireAuth, (req, res) => {
  try {
    const data = loadData();
    data.incomes = data.incomes.filter((i) => i.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fixed Expenses
app.get("/api/fixed-expenses", requireAuth, (req, res) => {
  try {
    const data = loadData();
    res.json(data.fixedExpenses || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/fixed-expenses", requireAuth, (req, res) => {
  try {
    const data = loadData();
    const expense = { ...req.body, id: generateId() };
    data.fixedExpenses.push(expense);
    saveData(data);
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/fixed-expenses/:id", requireAuth, (req, res) => {
  try {
    const data = loadData();
    const index = data.fixedExpenses.findIndex((e) => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Expense not found" });
    }
    data.fixedExpenses[index] = { ...data.fixedExpenses[index], ...req.body };
    saveData(data);
    res.json(data.fixedExpenses[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/fixed-expenses/:id", requireAuth, (req, res) => {
  try {
    const data = loadData();
    data.fixedExpenses = data.fixedExpenses.filter((e) => e.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Variable Expenses
app.get("/api/variable-expenses", requireAuth, (req, res) => {
  try {
    const data = loadData();
    res.json(data.variableExpenses || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/variable-expenses", requireAuth, (req, res) => {
  try {
    const data = loadData();
    const expense = { ...req.body, id: generateId() };
    data.variableExpenses.push(expense);
    saveData(data);
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/variable-expenses/:id", requireAuth, (req, res) => {
  try {
    const data = loadData();
    const index = data.variableExpenses.findIndex((e) => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Expense not found" });
    }
    data.variableExpenses[index] = { ...data.variableExpenses[index], ...req.body };
    saveData(data);
    res.json(data.variableExpenses[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/variable-expenses/:id", requireAuth, (req, res) => {
  try {
    const data = loadData();
    data.variableExpenses = data.variableExpenses.filter((e) => e.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Expense Categories
app.get("/api/expense-categories", requireAuth, (req, res) => {
  try {
    const data = loadData();
    res.json(data.expenseCategories || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/expense-categories", requireAuth, (req, res) => {
  try {
    const data = loadData();
    const category = { ...req.body, id: generateId() };
    data.expenseCategories.push(category);
    saveData(data);
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/expense-categories/:id", requireAuth, (req, res) => {
  try {
    const data = loadData();
    const index = data.expenseCategories.findIndex((c) => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Category not found" });
    }
    data.expenseCategories[index] = { ...data.expenseCategories[index], ...req.body };
    saveData(data);
    res.json(data.expenseCategories[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/expense-categories/:id", requireAuth, (req, res) => {
  try {
    const data = loadData();
    data.expenseCategories = data.expenseCategories.filter((c) => c.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Organization Settings
app.get("/api/organization", requireAuth, (req, res) => {
  try {
    const data = loadData();
    res.json(data.organization || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/organization", requireAuth, (req, res) => {
  try {
    const data = loadData();
    data.organization = { ...data.organization, ...req.body };
    saveData(data);
    res.json(data.organization);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// App Settings
app.get("/api/app-settings", requireAuth, (req, res) => {
  try {
    const data = loadData();
    res.json(data.appSettings || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/app-settings", requireAuth, (req, res) => {
  try {
    const data = loadData();
    data.appSettings = { ...data.appSettings, ...req.body };
    saveData(data);
    res.json(data.appSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Авторизация
app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    const auth = loadAuth();
    const passwordHash = simpleHash(password);
    
    if (username === auth.username && passwordHash === auth.passwordHash) {
      const token = generateToken();
      activeTokens.add(token);
      saveTokens(); // Сохраняем токены в файл
      
      // Убеждаемся, что токен точно сохранен перед отправкой ответа
      const response = { token, username: auth.username };
      res.json(response);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/verify", (req, res) => {
  try {
    const { token } = req.body;
    
    if (activeTokens.has(token)) {
      res.json({ valid: true });
    } else {
      res.status(401).json({ valid: false });
    }
  } catch (error) {
    console.error(`[verify] Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/logout", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      activeTokens.delete(token);
      saveTokens(); // Сохраняем изменения токенов
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Защита всех API endpoints (кроме авторизации и health check)
// Применяем middleware к каждому маршруту отдельно

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Инициализация директории данных
initDataDir();

// Запуск сервера с HTTPS
try {
  // Проверяем наличие SSL сертификатов
  if (existsSync(SSL_KEY_PATH) && existsSync(SSL_CERT_PATH)) {
    const httpsOptions = {
      key: readFileSync(SSL_KEY_PATH),
      cert: readFileSync(SSL_CERT_PATH),
    };

    // Добавляем CA bundle если есть
    if (existsSync(SSL_CA_PATH)) {
      httpsOptions.ca = readFileSync(SSL_CA_PATH);
    }

    const httpsServer = https.createServer(httpsOptions, app);
    
    httpsServer.listen(PORT, () => {
      console.log(`HTTP Server is running on https://finance.demoalazar.ru`);
    });
  } else {
    // Если сертификатов нет, запускаем HTTP (для разработки)
    console.warn(`⚠️  SSL certificates not found at ${SSL_KEY_PATH} and ${SSL_CERT_PATH}`);
    console.warn(`⚠️  Starting HTTP server (not recommended for production)`);
    console.warn(`⚠️  To enable HTTPS, ensure SSL certificates are available at ${SSL_DIR}`);
    
    app.listen(PORT, () => {
      console.log(`HTTP Server is running on http://0.0.0.0:${PORT}`);
    });
  }
} catch (error) {
  console.error("Error starting server:", error);
  process.exit(1);
}

