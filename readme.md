# SFTP-PROJECT

## Tech
* Node 20
* Docker

## Installation

At root of project
```bash
docker compose up
```
Check run container for setup .env configuration
```bash
docker ps
```
Install Package
```bash
cd sftp-csv-importer
npm install
```
Create table postgres
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  age INTEGER
);
```

## Run

```bash
npm start
```

## Notes
This project is using local sftp. If you want use real sftp connect from server just change the configuration at `.env` file.

## Author

See the author [Rendy Ichtiar Saputra](https://github.com/newshow321) 😉