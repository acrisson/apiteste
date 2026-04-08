const express = require("express");
require("dotenv").config();
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const PORT = 3005;

app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
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
       SET nome=$1, valor=$2, estoque=$3, updated_at = CURRENT_TIMESTAMP
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

// Listar usuários com filtro de mês, ano e setor
app.get("/usuarios", async (req, res) => {
  const { mes, ano, setor } = req.query;

  try {
    let query = `
      SELECT u.*, e.nome as produto_nome
      FROM usuarioss u
      JOIN estoque e ON u.productId = e.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (mes) {
      query += ` AND EXTRACT(MONTH FROM u.created_at) = $${paramIndex}`;
      params.push(Number(mes));
      paramIndex++;
    }

    if (ano) {
      query += ` AND EXTRACT(YEAR FROM u.created_at) = $${paramIndex}`;
      params.push(Number(ano));
      paramIndex++;
    }

    if (setor) {
      query += ` AND u.setor = $${paramIndex}`;
      params.push(setor);
      paramIndex++;
    }

    query += ` ORDER BY u.id DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar registros com filtro:", err);
    res.status(500).json({ erro: "Erro ao buscar registros" });
  }
});



//Listar usuários sem filtro  de mes e ano para teste de consulta sem filtro

/*app.get("/usuarios", async (req, res) => {
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
});*/





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

// Buscar usuário por ID
app.get("/usuarios/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT u.*, e.nome as produto_nome
       FROM usuarioss u
       JOIN estoque e ON u.productId = e.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar usuário" });
  }
});

// Atualizar usuário
app.put("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, setor, quantidade } = req.body;

  try {
    // Validar dados obrigatórios
    if (!nome || !setor || quantidade === undefined) {
      return res.status(400).json({ erro: "Nome, setor e quantidade são obrigatórios" });
    }

    // Buscar registro atual
    const current = await pool.query("SELECT * FROM usuarioss WHERE id=$1", [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const currentRecord = current.rows[0];
    const oldQuantidade = currentRecord.quantidade;
    const productId = currentRecord.productid || currentRecord.productId;

    // Verificar se o produto referenciado existe NA TABELA ESTOQUE
    const produtoCheck = await pool.query("SELECT estoque FROM estoque WHERE id=$1", [productId]);
    if (produtoCheck.rows.length === 0) {
      return res.status(404).json({ 
        erro: `Produto com ID ${productId} não encontrado na tabela estoque` 
      });
    }

    // Calcular diferença de quantidade
    const diff = quantidade - oldQuantidade;

    if (diff > 0) {
      // Verificar estoque se aumentando quantidade
      if (produtoCheck.rows[0].estoque < diff) {
        return res.status(400).json({ erro: "Estoque insuficiente para aumento" });
      }
    }

    // Atualizar registro
    const valorUnit = currentRecord.valorunit;
    const total = parseFloat(valorUnit) * parseFloat(quantidade);

    const result = await pool.query(
      `UPDATE usuarioss
       SET nome=$1, setor=$2, quantidade=$3, total=$4, updated_at = CURRENT_TIMESTAMP
       WHERE id=$5
       RETURNING *`,
      [nome, setor, parseFloat(quantidade), total, id]
    );

    // Atualizar estoque
    if (diff !== 0) {
      await pool.query(
        "UPDATE estoque SET estoque = estoque - $1 WHERE id=$2",
        [diff, productId]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    res.status(500).json({ erro: "Erro ao atualizar usuário", detalhes: err.message });
  }
});

app.get("/debug/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const usuario = await pool.query("SELECT * FROM usuarioss WHERE id=$1", [id]);
    if (usuario.rows.length === 0) {
      return res.json({ erro: "Usuário não encontrado" });
    }
    
    const productId = usuario.rows[0].productid || usuario.rows[0].productId;
    const produto = await pool.query("SELECT * FROM estoque WHERE id=$1", [productId]);
    
    res.json({
      usuario: usuario.rows[0],
      productId: productId,
      produtoEncontrado: produto.rows.length > 0,
      produto: produto.rows[0] || null
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Deletar usuário
app.delete("/usuarios/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar registro para restaurar estoque
    const current = await pool.query("SELECT productId, quantidade FROM usuarioss WHERE id=$1", [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const { productId, quantidade } = current.rows[0];

    // Deletar registro
    await pool.query("DELETE FROM usuarioss WHERE id=$1", [id]);

    // Restaurar estoque
    await pool.query(
      "UPDATE estoque SET estoque = estoque + $1 WHERE id=$2",
      [quantidade, productId]
    );

    res.json({ mensagem: "Usuário deletado com sucesso" });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao deletar usuário" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});