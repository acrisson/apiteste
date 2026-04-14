# 📦 API de Controle de Estoque

API REST desenvolvida em **Node.js + Express + PostgreSQL** para gerenciamento de estoque e movimentação de produtos por usuários/setores.

---

## 🚀 Tecnologias utilizadas

* Node.js
* Express
* PostgreSQL
* dotenv
* cors
* pg

---

## ⚙️ Configuração do Ambiente

### 1. Clonar o projeto

```bash
git clone <seu-repositorio>
cd <nome-do-projeto>
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Criar arquivo `.env`

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/seubanco
```

---

## ▶️ Executar o projeto

```bash
node index.js
```

Servidor rodando em:

```
http://localhost:3005
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabela `estoque`

* id
* nome
* valor
* estoque
* updated_at

### Tabela `usuarioss`

* id
* productId
* nome
* setor
* quantidade
* valorUnit
* total
* created_at
* updated_at

---

## 📌 Funcionalidades

### 📦 Produtos

* Listar produtos
* Adicionar produto
* Editar produto
* Deletar produto

### 👤 Usuários (Movimentação de estoque)

* Registrar retirada de produtos
* Atualizar movimentação
* Deletar movimentação (restaura estoque)
* Filtro por mês, ano e setor

---

## 📡 Endpoints da API

### 🔹 Produtos

#### Listar produtos

```
GET /produtos
```

#### Criar produto

```
POST /produtos
```

Body:

```json
{
  "nome": "Produto A",
  "valor": 10.50,
  "estoque": 100
}
```

#### Atualizar produto

```
PUT /produtos/:id
```

#### Deletar produto

```
DELETE /produtos/:id
```

---

### 🔹 Usuários

#### Listar com filtro

```
GET /usuarios?mes=4&ano=2026&setor=TI
```

#### Criar movimentação

```
POST /usuarios
```

Body:

```json
{
  "productId": 1,
  "nome": "João",
  "setor": "TI",
  "quantidade": 2
}
```

---

#### Buscar por ID

```
GET /usuarios/:id
```

#### Atualizar

```
PUT /usuarios/:id
```

#### Deletar

```
DELETE /usuarios/:id
```

---

## ⚠️ Regras de Negócio

* Não permite retirar mais do que o estoque disponível
* Atualiza o estoque automaticamente
* Calcula o valor total automaticamente
* Ao deletar um registro, o estoque é restaurado

---

## 🧪 Debug

```
GET /debug/usuarios/:id
```

---

## 🔐 Segurança

* Uso de Prepared Statements (evita SQL Injection)
* Variáveis de ambiente (.env)

---

## 📈 Melhorias futuras

* Autenticação JWT
* Controle de usuários
* Dashboard (Grafana)
* Swagger (documentação automática)

---

## 👨‍💻 Autor

**Acrisson Sidney Nascimento Andrade**
