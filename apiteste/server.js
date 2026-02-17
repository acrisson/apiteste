const express = require("express");
require("dotenv").config();
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const port = 3001;
app.use(express.json());
app.use(cors());

// Conexão PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.get("/usuarios", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM usuarios ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar registros" });
  }
});


app.post("/usuarios", async (req, res) => {
  const {
    productId,
    nome,
    setor,
    quantidade,
    valorUnit,
    total,
    estoque,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO usuarios
      (productId, nome, setor, quantidade, valorUnit, total, estoque)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [productId, nome, setor, quantidade, valorUnit, total, estoque]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao inserir registro" });
  }
});


app.put("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const {
    productId,
    nome,
    setor,
    quantidade,
    valorUnit,
    total,
    estoque,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE usuarios
       SET productId=$1, nome=$2, setor=$3,
           quantidade=$4, valorUnit=$5,
           total=$6, estoque=$7
       WHERE id=$8
       RETURNING *`,
      [productId, nome, setor, quantidade, valorUnit, total, estoque, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar registro" });
  }
});


app.delete("/usuarios/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM usuarios WHERE id=$1", [id]);
    res.json({ mensagem: "Registro deletado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao deletar registro" });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});