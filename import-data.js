import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SOURCE_FILE = "c:\\Users\\Alim\\Desktop\\main-new\\main-new\\data\\storage.json";
const DATA_DIR = join(__dirname, "data");
const DATA_FILE = join(DATA_DIR, "data.json");

// Читаем данные из Python файла
const pythonData = JSON.parse(readFileSync(SOURCE_FILE, "utf-8"));

// Преобразуем сотрудников
const employees = pythonData.employees.map((emp) => ({
  id: emp.id,
  fullName: emp.name,
  position: emp.position || "",
  percent: emp.percent || 0,
}));

// Преобразуем клиентов
const clients = pythonData.clients.map((client) => ({
  id: client.id,
  name: client.name,
  company: client.company || "",
  contact: client.contact || "",
  phone: "",
  email: "",
}));

// Преобразуем постоянные расходы
const fixedExpenses = pythonData.expenses?.constant?.map((exp) => ({
  id: exp.id,
  name: exp.title,
  amount: exp.amount || 0,
  period: "",
})) || [];

// Преобразуем доходы
const incomes = [];
if (pythonData.incomes) {
  for (const [monthKey, monthIncomes] of Object.entries(pythonData.incomes)) {
    if (Array.isArray(monthIncomes)) {
      monthIncomes.forEach((income) => {
        // Определяем дату из ключа месяца (формат "YYYY-MM")
        const [year, month] = monthKey.split("-");
        // Берем первую дату месяца как дату дохода (можно улучшить, если есть точная дата)
        const date = `${year}-${month}-01`;
        
        // Определяем первого исполнителя (если есть)
        const firstExecutor = income.executors && income.executors.length > 0 
          ? income.executors[0] 
          : null;
        
        // Определяем тип выплаты
        const employeePayoutType = firstExecutor?.mode === "fixed" ? "fixed" : "percent";
        
        // Сумма выплат исполнителям
        const employeePayouts = income.executor_total || 0;
        
        // Вычисляем прибыль
        const taxAmount = income.amount * (income.tax || 0) / 100;
        const profit = income.amount - taxAmount - (income.np || 0) - (income.inner_expense || 0) - employeePayouts;
        
        incomes.push({
          id: income.id,
          date: date,
          title: income.title || "",
          clientId: income.client_id || "",
          employeeId: firstExecutor?.employee_id || "",
          amount: income.amount || 0,
          taxPercent: income.tax || 0,
          taxAmount: taxAmount,
          npAmount: income.np || 0,
          internalCosts: income.inner_expense || 0,
          employeePayouts: employeePayouts,
          employeePayoutType: employeePayoutType,
          comment: "",
          profit: profit,
        });
      });
    }
  }
}

// Создаем структуру данных для нашего приложения
const appData = {
  clients: clients,
  employees: employees,
  expenseCategories: [],
  fixedExpenses: fixedExpenses,
  variableExpenses: [],
  incomes: incomes,
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

// Сохраняем данные
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

writeFileSync(DATA_FILE, JSON.stringify(appData, null, 2), "utf-8");

console.log("Данные успешно импортированы!");
console.log(`- Клиентов: ${clients.length}`);
console.log(`- Сотрудников: ${employees.length}`);
console.log(`- Постоянных расходов: ${fixedExpenses.length}`);
console.log(`- Доходов: ${incomes.length}`);
console.log(`\nФайл сохранен: ${DATA_FILE}`);

