# Настройка HTTPS для сервера

## Требования

Для работы через HTTPS нужны SSL сертификаты. Сервер будет искать их в папке `server/ssl/`:

- `private.key` - приватный ключ
- `certificate.crt` - сертификат
- `ca_bundle.crt` - CA bundle (опционально, но рекомендуется)

## Настройка через переменные окружения

Вы можете указать свои пути к сертификатам через переменные окружения:

```bash
export SSL_DIR=/path/to/ssl
export SSL_KEY_PATH=/path/to/private.key
export SSL_CERT_PATH=/path/to/certificate.crt
export SSL_CA_PATH=/path/to/ca_bundle.crt
export PORT=443
```

## Получение SSL сертификатов

### Вариант 1: Let's Encrypt (бесплатно)

1. Установите certbot:
```bash
sudo apt-get update
sudo apt-get install certbot
```

2. Получите сертификат:
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

3. Сертификаты будут в `/etc/letsencrypt/live/yourdomain.com/`:
   - `privkey.pem` → скопируйте как `private.key`
   - `fullchain.pem` → скопируйте как `certificate.crt`

### Вариант 2: Самоподписанный сертификат (только для тестирования)

```bash
mkdir -p server/ssl
openssl req -x509 -newkey rsa:4096 -keyout server/ssl/private.key -out server/ssl/certificate.crt -days 365 -nodes
```

⚠️ **Внимание**: Самоподписанные сертификаты не подходят для продакшена!

### Вариант 3: Коммерческий сертификат

Если у вас есть коммерческий SSL сертификат, просто поместите файлы в папку `server/ssl/`:
- Приватный ключ → `private.key`
- Сертификат → `certificate.crt`
- CA bundle (если есть) → `ca_bundle.crt`

## Структура папок

```
server/
├── ssl/
│   ├── private.key
│   ├── certificate.crt
│   └── ca_bundle.crt (опционально)
├── data/
├── server.js
└── package.json
```

## Запуск сервера

После размещения сертификатов просто запустите сервер:

```bash
cd server
npm start
```

Сервер автоматически определит наличие сертификатов и запустится через HTTPS.

## Проверка работы

После запуска проверьте:

```bash
curl https://yourdomain.com:3000/api/health
```

Или откройте в браузере: `https://yourdomain.com:3000/api/health`

## Безопасность

⚠️ **Важно для продакшена**:

1. Используйте порт 443 (стандартный HTTPS порт)
2. Настройте файрвол для блокировки HTTP (порт 80)
3. Используйте надежные пароли для приватных ключей
4. Регулярно обновляйте сертификаты (Let's Encrypt обновляется автоматически)
5. Рассмотрите использование reverse proxy (nginx) перед Node.js сервером

## Troubleshooting

### Ошибка "EACCES: permission denied"

Для портов ниже 1024 нужны права root. Используйте:
- Порт выше 1024 (например, 3000, 4430)
- Или запускайте через sudo (не рекомендуется)
- Или используйте reverse proxy (nginx) на порту 443

### Сертификат не загружается

Проверьте:
1. Существуют ли файлы сертификатов
2. Правильные ли пути (можно указать через переменные окружения)
3. Права доступа к файлам (должны быть читаемыми)
