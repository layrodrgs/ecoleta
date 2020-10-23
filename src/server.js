const passport = require('passport')
const express = require("express")
const session = require("express-session")
const server = express()

//pegar o banco de dados
const db = require("./database/db")

//configurar pasta pública
server.use(express.static("public"))

//habilitar o uso do req.body na aplicação
server.use(express.urlencoded({extended: true}))

require('./auth')(passport);
server.set('trust proxy', 1) // trust first proxy
server.use(session({
  secret: 'mySecretPhrase',
  resave: false,
  saveUninitialized: true,
  cookie: {
     // secure: true // requires HTTPS connection
  }
}))

server.use(passport.initialize());
server.use(passport.session());

//utilizando template engine
const nunjucks = require("nunjucks")
nunjucks.configure("src/views",{
    express: server,
    noCache: true
})

function authenticationMiddleware () {  
  return function (req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/login')
  }
}

//configurar caminhos da minha aplicação
//página inicial
//req: requisão
//res: resposta
server.get("/", (req, res) => {
  return  res.render("index.html", { title: "um titulo"})
})

server.get("/create-point", authenticationMiddleware (), (req, res) => {
      //req.query: query strings da url
      //console.log(req.query)
   return res.render("create-point.html")
})

server.get("/restrict", authenticationMiddleware (), (req, res) => {
  //req.query: query strings da url
  //console.log(req.query)
return res.render("restrict.html")
})

server.post("/savepoint", authenticationMiddleware (), (req, res) =>{
  //req.body: corpo do formulário
  //console.log(req.body)
  //inserir dados no banco de dados
    const query = `
        INSERT INTO places (
            image,
            name,
            address,
            address2,
            state,
            city,
            itens
       ) VALUES (?,?,?,?,?,?,?);
    `
     const values =  [
       req.body.image,
       req.body.name,
       req.body.address,
       req.body.address2,
       req.body.state,
       req.body.city,
       req.body.itens
    ]

    function afterInsertData(err){
        if(err){
          console.log(err)
          return res.send("Erro no cadastro!")
        }

        console.log("Cadastrado com sucesso")
        console.log(this)

        return res.render("create-point.html", { saved: true })
    }

    db.run(query, values, afterInsertData)

})

server.get("/search", (req, res) => {

    const search = req.query.search
    /*if(search == "") {
      //pesquisa vazia
    
        return res.render("search-results.html", {total: 0})
     
    }*/
    //pegar os dados do banco de dados

      db.all(`SELECT * FROM places WHERE city LIKE '%${search}%'`, function(err, rows){
        if(err){
            return console.log(err)
        }

        const total = rows.length

        //mostrar a página html com os dados do banco de dados
        return res.render("search-results.html", {places: rows, total: total})
    })
   
 })

server.get('/login', function(req, res){
  if(req.query.fail)
    res.render('login.html', { message: 'Usuário e/ou senha incorretos!' });
  else
    res.render('login.html', { message: null });
})

server.post('/login',
  passport.authenticate('local', { successRedirect: '/restrict', failureRedirect: '/login?fail=true' })
);

//ligar o servidor
server.listen(3000) 
