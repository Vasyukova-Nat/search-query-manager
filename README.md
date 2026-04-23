# Search Query Manager

Веб-приложение для управления поисковыми запросами. 

## Стек

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite
- **Frontend:** React, TypeScript, Mantine UI

## Установка и запуск
Запуск в 2-х терминалах.  
Backend (терминал 1):
```
cd backend
pip install -r requirements.txt
python -m app.seed    # генерация 10 000 записей, запускать 1 раз
uvicorn app.main:app --reload
```
API будет доступен на http://localhost:8000, документация на http://localhost:8000/docs

Frontend (терминал 2):
```
cd frontend
npm install
npm run dev
```
Интерфейс доступен по адресу: http://localhost:3000

## Функционал
- Отображение таблицы поисковых запросов с пагинацией (20 записей на странице)
- Серверная сортировка по всем столбцам
- Серверный поиск по названию
- Создание, редактирование и удаление запросов
- Групповое удаление выбранных записей
- Подсветка истёкших дедлайнов красным
- 10 000+ предсгенерированных записей в базе
