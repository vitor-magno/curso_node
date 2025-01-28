const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname + '-' + Date.now())
    }
});

const fileFilter = (req, file, cb) => {
    cb(null, file.mimetype === 'image/jpeg' || file.mimetype === 'image/png');
}

const upload = multer({
    storage: storage, 
    limits: {fileSize: 1024 * 1024 * 5},
    fileFilter: fileFilter
});



router.get('/', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                error: 'Erro ao conectar ao banco de dados.',
            });
        }

        conn.query('SELECT * FROM produtos', (error, rows, fields) => {
            conn.release();
            if (error) {
                return res.status(500).send({
                    error: error,
                    response: null,
                });
            }
            const response = {
                quantidade: rows.length,
                produtos: rows.map(prod => {
                    return {
                        id_produto: prod.id_produto,
                        nome: prod.nome,
                        preco: prod.preco,
                        request: {
                            tipo:'GET',
                            descricao: 'Retorna os detalhes dos produto',
                            url: 'http://localhost:3000/produtos' + prod.id_produto
                        }
                    }
                })
            }
            res.status(200).send(response);
        });
    });
})

router.get('/:id_produto', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                error: 'Erro ao conectar ao banco de dados.',
            });
        }

        conn.query('SELECT * FROM produtos WHERE id_produto = ?', 
            [req.params.id_produto], 
             (error, rows, fields) => {
            conn.release();
            if (error) {
                return res.status(500).send({
                    error: error,
                    response: null,
                });
            }

            if (rows.length === 0) {
                return res.status(404).send({
                    error: 'Produto não encontrado',
                    response: null,
                });
            }

            const response = {
                produto: {
                    id_produto: rows[0].id_produto,
                    nome: rows[0].nome,
                    preco: rows[0].preco,
                    request: {
                        tipo: 'GET',
                        descricao: 'Retorna os detalhes de um produto',
                        url: 'http://localhost:3000/produtos/' + rows[0].id_produto
                    }
                }
            };
            res.status(200).send(response);
        });
    });
});


router.post('/', upload.single('produtoImagem'), (req, res, next) => {
    console.log(req.file);
    const { nome, preco } = req.body;
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                error: 'Erro ao conectar ao banco de dados.',
            });
        }
        conn.query(
            'INSERT INTO produtos (nome, preco, produtoImagem) VALUES (?, ?, ?)',
            [nome, preco, req.file.path.replace(/\\/g, '/')], // Normaliza as barras
            (error, result, fields) => {
                conn.release();
        
                if (error) {
                    return res.status(500).send({
                        error: error,
                        response: null,
                    });
                }
                const response = {
                    mensagem: 'Produto inserido com sucesso!',
                    produtoCriado: {
                        id_produto: result.insertId,
                        nome: nome,
                        preco: preco,
                        produtoImagem: req.file.path.replace(/\\/g, '/'), // Garante a consistência no retorno
                        request: {
                            tipo: 'POST',
                            descricao: 'Insere um produto',
                            url: 'http://localhost:3000/produtos',
                        },
                    },
                };
                return res.status(201).send(response);
            }
        );
    });
});


router.patch('/', (req, res, next) => {
    const { nome, preco, id_produto } = req.body;
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                error: 'Erro ao conectar ao banco de dados.',
            });
        }

        conn.query(
            'UPDATE produtos SET nome = ?, preco = ? WHERE id_produto = ?',
            [nome, preco, id_produto],
            (error, result, fields) => {
                conn.release(); 

                if (error) {
                    return res.status(500).send({
                        error: error,
                        response: null,
                    });
                }

                const response = {
                    mensagem: 'Produto atualizado com sucesso!',
                    produtoAtualizado: {
                        id_produto: result.insertId,
                        nome: nome,
                        preco: preco,
                        request: {
                            tipo:'GET',
                            descricao: 'Atualiza um produto',
                            url: 'http://localhost:3000/produtos/' + id_produto
                        }   
                    }
                }

                return res.status(202).send(response);
            }
        );
    });
})

router.delete('/', (req, res, next) => {
    const { id_produto } = req.body;
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                error: 'Erro ao conectar ao banco de dados.',
            });
        }

        conn.query(
            'DELETE FROM produtos WHERE id_produto = ?',
            [id_produto],
            (error, result, fields) => {
                conn.release(); 

                if (error) {
                    return res.status(500).send({
                        error: error,
                        response: null,
                    });
                }

                const response = {
                    mensagem: 'Produto removido com sucesso!',
                        request: {
                            tipo:'GET',
                            descricao: 'Atualiza um produto',
                            url: 'http://localhost:3000/produtos/' + id_produto,
                            body: {
                               nome: 'String',  
                               preco: 'Number'
                            }
                        }   

                }

                return res.status(202).send(response);
            }
        );
    });
})


module.exports = router;