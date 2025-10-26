const express = require("express");
const mysql = require("mysql2");
const { Client } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

// Configuración de conexiones desde variables de entorno
const dbConfigMySQL = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: true,
  },
};

const dbConfigPostgres = {
  host: process.env.DB_HOST_PG,
  user: process.env.DB_USER_PG,
  password: process.env.DB_PASS_PG,
  port: process.env.DB_PORT_PG || 5432,
  database: "postgres", // <<< Usamos la base de datos default de PostgreSQL
  ssl: {
    rejectUnauthorized: true,
  },
};

app.get("/", async (req, res) => {
  let mysqlStatus = "Desconectado";
  let postgresStatus = "Desconectado";
  let mysqlResult = "";
  let postgresResult = "";

  try {
    const mysqlConnection = await mysql
      .createConnection(dbConfigMySQL)
      .promise();
    const [rows] = await mysqlConnection.query("SELECT NOW() AS datentime");
    mysqlStatus = "Conectado exitosamente a MySQL";
    mysqlResult = `Timeperiod desde MySQL: ${rows[0].datentime}`;
    await mysqlConnection.end();
  } catch (error) {
    mysqlStatus = "Error en conexión a MySQL: " + error.message;
  }

  try {
    const pgClient = new Client(dbConfigPostgres);
    await pgClient.connect();
    const result = await pgClient.query("SELECT NOW() AS current_time");
    postgresStatus = "Conectado exitosamente a PostgreSQL";
    postgresResult = `Timeperiod desde PostgreSQL: ${result.rows[0].current_time}`;
    await pgClient.end();
  } catch (error) {
    postgresStatus = "Error en conexión a PostgreSQL: " + error.message;
  }

  res.send(`
    <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Estado de Conexiones DB</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', sans-serif;
            background-color: #0f172a;
            min-height: 100vh;
            padding: 2rem;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: #e2e8f0;
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 3rem;
            position: relative;
            padding-bottom: 1rem;
        }
        h1::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 4px;
            background: linear-gradient(90deg, #60a5fa, #34d399);
            border-radius: 2px;
        }
        .cards-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            padding: 1rem;
        }
        .card {
            background: #1e293b;
            border-radius: 1rem;
            padding: 2rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }
        .card:hover {
            transform: translateY(-5px);
        }
        .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        .card-header strong {
            color: #94a3b8;
            font-size: 1.25rem;
            margin-left: 0.5rem;
        }
        .status-badge {
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }
        .ok {
            background-color: #065f46;
            color: #34d399;
        }
        .error {
            background-color: #7f1d1d;
            color: #fca5a5;
        }
        .result {
            color: #cbd5e1;
            font-size: 0.875rem;
            padding: 0.75rem;
            background-color: #334155;
            border-radius: 0.5rem;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Monitor de Conexiones</h1>
        
        <div class="cards-container">
            <div class="card">
                <div class="card-header">
                    <strong>MySQL</strong>
                </div>
                <div class="status-badge ${mysqlStatus.includes('Conectado') ? 'ok' : 'error'}">
                    ${mysqlStatus}
                </div>
                <div class="result">
                    ${mysqlResult}
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <strong>PostgreSQL</strong>
                </div>
                <div class="status-badge ${postgresStatus.includes('Conectado') ? 'ok' : 'error'}">
                    ${postgresStatus}
                </div>
                <div class="result">
                    ${postgresResult}
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `);
});

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});