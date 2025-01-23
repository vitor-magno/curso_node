const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');

const rotaProdutos = require('./routes/produtos');
const rotaPedidos = require('./routes/pedidos')

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json()); //JSON de entrada no body

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if(req.method === 'OPTIONS'){
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).send({});
    }
    next();
})

app.use('/produtos', rotaProdutos);
app.use('/pedidos', rotaPedidos);

//Quando não se e encontra rota e precisa retornar erro
app.use((req, res, next) => {
   const error = new Error('Not Found');
   error.status = 404;
   next(error);
})

//Ou ele pega o status tratado acima ou retorna o erro 500
app.use((error, req, res, next) => { 
    res.status(error.status || 500);
    return res.send({
        error: {
            message: error.message
        }
    })

})

module.exports = app;