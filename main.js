const fs = require('fs');
const path = require('path');
const express = require('express');
let db = require('./db.json');
parseJsonDb();


const server = express();

//BOOKS
/* 
{
    name: "",
    quantity: 0
}
*/
//USERS
/*
{
    isAdmin: false,
    email: "blbla@blbl.com",
    password: "qwerty1234",
    booksOwned: ["Book A", "Book B", ...]
}
*/

//*************ADMIN REQUESTS**************
server.get('/admin/authenticate/:email/:password', (req, res) => {
    parseJsonDb().then(() => {
        let result = false;
        db.users.forEach(user => {
            if (user.isAdmin && user.email == req.params['email'] && user.password == req.params['password']) {
                result = true;
            }
        });
        return JSON.stringify({ isAdmin: result })
    }).then((r) => {
        res.send(r);
    })
})
server.get('/admin/addBook/:email/:password/:bookName/:bookCount', (req, res) => {
    parseJsonDb().then(() => {
        let authorized = false;
        db.users.forEach(user => {
            if (user.isAdmin && user.email == req.params['email'] && user.password == req.params['password']) {
                authorized = true;
            }
        });
        if (authorized) {
            db.books.push({
                name: req.params['bookName'],
                count: req.params['bookCount'],
            })
        }
        return updateJsonDb(db);
    }).then(() => { res.send() })
})
server.get('/admin/removeBook/:email/:password/:bookName', (req, res) => {
    parseJsonDb().then(() => {
        let authorized = false;
        db.users.forEach(user => {
            if (user.isAdmin && user.email == req.params['email'] && user.password == req.params['password']) {
                authorized = true;
            }
        });
        if (authorized) {
            db.books = db.books.filter(elem => elem.name != req.params['bookName'])
        }
        return updateJsonDb(db);
    }).then(() => { res.send() })
})


//*************GENERAL REQUESTS**************

server.get('/getBooks/:email/:password', (req, res) => {
    parseJsonDb().then(() => JSON.stringify(db.books)).then((r) => {
        // console.log(r, db.books);
        let isRegistered = false
        db.users.forEach(user => {
            if (user.email == req.params['email'] && user.password == req.params['password']) {
                isRegistered = true;
            }
        });
        if (isRegistered) {
            res.send(r);
        } else {
            res.send("Access Denied!");
        }
    })
})

//*************USER REQUESTS**************

server.get('/user/authenticate/:email/:password', (req, res) => {
    parseJsonDb().then(() => {
        let result = false;
        db.users.forEach(user => {
            if (!user.isAdmin && user.email == req.params['email'] && user.password == req.params['password']) {
                result = true;
            }
        });
        return JSON.stringify({ isUser: result })
    }).then((r) => {
        res.send(r);
    })
})

server.get('/user/register/:email/:password', (req, res) => {
    let result = false;
    parseJsonDb().then(() => {
        db.users.forEach(user => {
            if (user.email != req.params['email']) {
                result = true;
            }
        });
        if (result) {
            db.users.push({
                isAdmin: false,
                email: req.params['email'],
                password: req.params['password'],
                booksOwned: []
            })
        }
        return updateJsonDb(db);
    }).then(() => JSON.stringify({ registered: result }))
        .then((r) => { res.send(r); })
})




//*************UTILITIES**************
async function parseJsonDb() {
    db = await JSON.parse(fs.readFileSync('./db.json', 'utf-8'))
    if (!db.users) {
        db = {
            users: [
                {
                    isAdmin: true,
                    email: "admin@library.com",
                    password: "qwerty1234"
                }
            ],
            books: []
        }
        await updateJsonDb(db);
    }
}

async function updateJsonDb(d) {
    await fs.promises.writeFile('db.json', JSON.stringify(d))
}

server.listen(8000);