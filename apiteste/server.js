const express = require("express");
require("dotenv").config();
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});


// Listar produtos
app.get("/produtos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM estoque ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar produtos" });
  }
});

// Adicionar produto
app.post("/produtos", async (req, res) => {
  const { nome, valor, estoque } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO estoque (nome, valor, estoque)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [nome, valor, estoque]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao inserir produto" });
  }
});

// Editar produto
app.put("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, valor, estoque } = req.body;

  try {
    const result = await pool.query(
      `UPDATE estoque
       SET nome=$1, valor=$2, estoque=$3
       WHERE id=$4
       RETURNING *`,
      [nome, valor, estoque, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao atualizar produto" });
  }
});

// Deletar produto
app.delete("/produtos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM estoque WHERE id=$1", [id]);
    res.json({ mensagem: "Produto deletado com sucesso" });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao deletar produto" });
  }
});




app.get("/usuarios", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*, e.nome as produto_nome
       FROM usuarioss u
       JOIN estoque e ON u.productId = e.id
       ORDER BY u.id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar registros" });
  }
});

app.post("/usuarios", async (req, res) => {
  const { productId, nome, setor, quantidade } = req.body;

  try {
    // Buscar produto
    const produto = await pool.query(
      "SELECT * FROM estoque WHERE id=$1",
      [productId]
    );

    if (produto.rows.length === 0) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }

    const produtoData = produto.rows[0];

    if (produtoData.estoque < quantidade) {
      return res.status(400).json({ erro: "Estoque insuficiente" });
    }

    const valorUnit = produtoData.valor;
    const total = valorUnit * quantidade;

    // Inserir movimentação
    const result = await pool.query(
      `INSERT INTO usuarioss
       (productId, nome, setor, quantidade, valorUnit, total)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [productId, nome, setor, quantidade, valorUnit, total]
    );

    // Atualizar estoque
    await pool.query(
      "UPDATE estoque SET estoque = estoque - $1 WHERE id=$2",
      [quantidade, productId]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ erro: "Erro ao inserir registro" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});