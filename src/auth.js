const bcrypt = require('bcrypt')  
const LocalStrategy = require('passport-local').Strategy
const db = require ('./database/db')
 
module.exports = function(passport){
   //configuraremos o passport aqui
    console.log("OKAAAAAAAAAAAAAAAAAAY");

    function findUser(username, callback){
        db.get(`SELECT * FROM users WHERE usermane = ?`, [username], function(err, rows){     
            callback(err, rows);
        });
    }
    
    function findUserById(id, callback){
        db.get(`SELECT * FROM users WHERE id = ?`, [id], function(err, rows){     
            callback(err, rows);
        });
    }

    passport.serializeUser(function(user, done){
        done(null,user.id);
    });

    passport.deserializeUser(function(id, done){
        findUserById(id, function(err,user){
            done(err, user);
        });
    });

    passport.use('local', new LocalStrategy( { 
        usernameField: 'username',
        passwordField: 'password'
    },
    (username, password, done) => {
        findUser(username, (err, user) => {
        if (err) { return done(err) }

        // usuário inexistente
        if (!user) { return done(null, false) }

        // comparando as senhas
        bcrypt.compare(password, user.password, (err, isValid) => {
            if (err) { return done(err) }
            if (!isValid) { return done(null, false) }
            return done(null, user)
        })
        })
    }
    ));

}