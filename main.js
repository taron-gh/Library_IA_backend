const fs = require('fs');
const path = require('path');
const cors = require("cors")

const express = require('express');
let db = require('./db.json');
parseJsonDb();
const server = express();


const whitelist = ["http://localhost:3000"]
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
}
server.use(cors(corsOptions))


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
//DONE
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

//DONE
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
    }).then(() => { 
        res.send() 
    })
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
//at user - DONE 
//at admin - 
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
            res.send('{"accessDenied": "true"}');
        }
    })
})

//*************USER REQUESTS**************
//DONE
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

//DONE
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

//DONE
server.get('/user/addBook/:email/:password/:bookName', (req, res) => {
    let result = false;
    parseJsonDb().then(() => {
        let authorized = false;
        let index = 0;
        db.users.forEach((user, i) => {
            if (user.email == req.params['email'] && user.password == req.params['password']) {
                authorized = true;
                index = i;
            }
        });
        if (authorized) {
            db.books.forEach((b, i) => {
                if(b.name == req.params['bookName'] && b.count > 0 ){
                    db.users[index].booksOwned.push(req.params['bookName'])
                    result = true;
                    b.count--;
                }
            })
        }
        return updateJsonDb(db);
    }).then(() => JSON.stringify({isAdded: result}))
    .then((r) => { res.send(r) })
})

//DONE
server.get('/user/returnBook/:email/:password/:bookName', (req, res) => {
    let result = false;
    parseJsonDb().then(() => {
        let authorized = false;
        let index = 0;
        db.users.forEach((user, i) => {
            if (user.email == req.params['email'] && user.password == req.params['password']) {
                authorized = true;
                index = i;
            }
        });
        if (authorized) {
            db.books.forEach((b, i) => {
                if(b.name == req.params['bookName']){
                    db.users[index].booksOwned = db.users[index].booksOwned.filter(elem => elem != req.params['bookName'])
                    result = true;
                    b.count++;
                }
            })
        }
        return updateJsonDb(db);
    }).then(() => JSON.stringify({isReturned: result}))
    .then((r) => { res.send(r) })
})

//DONE
server.get('/user/getMyBooks/:email/:password', (req, res) => { 
    parseJsonDb().then(() => JSON.stringify(db.books)).then((r) => {
        // console.log(r, db.books);
        let isRegistered = false;
        let arr = [];
        db.users.forEach(user => {
            if (user.email == req.params['email'] && user.password == req.params['password']) {
                isRegistered = true;
                arr = user.booksOwned;
            }
        });

        if(!isRegistered){
            res.send("Access Denied!");
        }
        return JSON.stringify(arr);
    }).then((r) => res.send(r))
})
//hello
//*************UTILITIES**************
async function parseJsonDb() {
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

    db = await JSON.parse(fs.readFileSync('./db.json', 'utf-8'))

}

async function updateJsonDb(d) {
    await fs.promises.writeFile('db.json', JSON.stringify(d))
}

server.listen(8000);