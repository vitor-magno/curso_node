const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;

router.get('/', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                error: 'Erro ao conectar ao banco de dados.',
            });
        }

        conn.query(`
            SELECT pedidos.id_pedido, pedidos.quantidade, produtos.id_produto, produtos.nome 
            FROM pedidos 
            INNER JOIN produtos ON produtos.id_produto = pedidos.id_produto 
            `, 
            (error, rows, fields) => {
            conn.release();
            if (error) {
                return res.status(500).send({
                    error: error,
                    response: null,
                });
            }
            const response = {
                quantidade: rows.length,
                pedidos: rows.map(prod => {
                    return {
                        id_pedido: prod.id_pedido,
                        quantidade: prod.quantidade,
                        produto: {
                            id_produto: prod.id_produto,
                            nome: prod.nome,
                            preco: prod.preco
                        },                 
                        request: {
                            tipo:'GET',
                            descricao: 'Retorna os detalhes dos pedidos',
                            url: 'http://localhost:3000/pedidos' + prod.id_pedido
                        }
                    }
                })
            }
            res.status(200).send(response);
        });
    });
})

router.get('/:id_pedido', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                error: 'Erro ao conectar ao banco de dados.',
            });
        }

        conn.query('SELECT * FROM pedidos WHERE id_produto = ?', 
            [req.params.id_pedido], 
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
                    error: 'Pedido não encontrado com este ID',
                    response: null,
                });
            }

            const response = {
                pedido: {
                    id_pedido: rows[0].id_pedido,
                    id_produto: rows[0].id_produto,
                    quantidade: rows[0].quantidade,
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
})

router.post('/', (req, res, next) => {
    const { id_pedido, id_produto, quantidade } = req.body;
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                error: error,
                response: null,
            });
        }

        conn.query('SELECT * FROM produtos WHERE id_produto = ?', 
            [id_produto], 
             (error, rows, fields) => {
                if (error) {
                    return res.status(500).send({
                        error: error,
                        response: null,
                    });
                }
                if (rows.length === 0) {
                    return res.status(404).send({
                        error: 'Produto nao encontrado com este ID',
                        response: null,
                    });
                }
                conn.query(
                    'INSERT INTO pedidos (id_produto, quantidade) VALUES (?, ?)',
                    [id_produto, quantidade],
                    (error, result, fields) => {
                        conn.release(); 
        
                        if (error) {
                            return res.status(500).send({
                                error: error,
                                response: null,
                            });
                        }
                        const response = {
                            mensagem: 'Pedido inserido com sucesso!',
                            pedidoCriado: {
                                id_pedido: id_pedido,
                                id_produto: id_produto,
                                quantidade: quantidade,
                                request: {
                                    tipo:'GET',
                                    descricao: 'Retorna todos os pedidos',
                                    url: 'http://localhost:3000/pedidos'
                                }   
                            }
                        }
                        return res.status(201).send(response);
                    }
                );
            })
    })

})

router.patch('/', (req, res, next) => {
    const { id_pedido, id_produto, quantidade } = req.body;
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                error: 'Erro ao conectar ao banco de dados.',
            });
        }

        conn.query(
            'UPDATE pedidos SET id_produto = ?, quantidade = ? WHERE id_pedido = ?',
            [id_pedido, id_produto, quantidade],
            (error, result, fields) => {
                conn.release(); 

                if (error) {
                    return res.status(500).send({
                        error: error,
                        response: null,
                    });
                }

                const response = {
                    mensagem: 'Pedido atualizado com sucesso!',
                    pedidoAtualizado: {
                        id_pedido: id_pedido,
                        id_produto: id_produto,
                        quantidade: quantidade,
                        request: {
                            tipo:'GET',
                            descricao: 'Atualiza um produto',
                            url: 'http://localhost:3000/produtos/' + id_pedido
                        }   
                    }
                }

                return res.status(202).send(response);
            }
        );
    });
})

router.delete('/', (req, res, next) => {
    const { id_pedido } = req.body;
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                error: 'Erro ao conectar ao banco de dados.',
            });
        }

        conn.query(
            'DELETE FROM pedidos WHERE id_pedido = ?',
            [id_pedido],
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
                            tipo:'POST',
                            descricao: 'Insere um pedido',
                            url: 'http://localhost:3000/pedidos/' + id_pedido,
                            body: {
                               id_produto: 'Number',  
                               quantidade: 'Number'
                            }
                        }   

                }

                return res.status(202).send(response);
            }
        );
    });
})

module.exports = router;