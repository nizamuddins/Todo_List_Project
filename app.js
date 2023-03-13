require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const date = require('./app2')
const flash = require('connect-flash');
const nocache = require('node-nocache');
const port = 4000;
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const config = require("./config");
const session = require('express-session');
const passport = require("passport");
const local = require("passport-local")
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');
const {mongo} = require("mongoose");
const { url } = require("inspector");

const app = express();

var items;
var defaultItems = [
    {
        text: "Welcome to your todolist!"
    }, {
        text: "Hit the + to add new item"
    }, {
        text: "<-- Hit this to delete item."
    }
];
let data;
mess = [];
const oneDay = 1000 * 60 * 60 * 24;

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(nocache);
app.use(flash());

//session

app.use(session({
    secret: "thisisresso2.0project096",
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: oneDay
    }

}))

// passport

app.use(passport.initialize());
app.use(passport.session());

// **************************************

const userInfo = mongoose.Schema(
    {username: String, email: String, password: String, text: String, name: String}
)

userInfo.plugin(passportLocalMongoose);
userInfo.plugin(findOrCreate);

let db = mongoose.model("userinfo", userInfo);

passport.use(db.createStrategy());

passport.serializeUser((user, done) => {
    done(null, user.id)
});
passport.deserializeUser((id, done) => {
    db.findById(id, (err, user) => {
        done(err, user);
    })
});

app.get("/login", nocache, (req, res) => {

    res.render("login", {message: mess});
    mess = [];
})

app.get("/signup", nocache, (req, res) => {

    res.render("signup", {message: req.flash("message")})

})

app.get("/",nocache, (req, res) => {
    res.render("home");
})

// signup
app.post("/signup", async (req, res) => {
    const {username, mail, password} = req.body;
    if (username && mail && password) {
        let find = await db.findOne({username: username})

        if (find !== null) {
            req.flash("message", [
                {
                    message: "A user with the given email is already registered"
                }
            ])
            res.redirect("/signup");
        } else {

            db.register({
                username: username,
                email: mail,
                active: false
            }, password, (err, user) => {
                if (err) {
                    req.flash("message", err)
                    res.redirect("/signup");
                } else {
                    passport.authenticate("local")(req, res, () => {
                        res.redirect("/" + date.day());
                    });
                }

            })

        }
    } else {
        req.flash("message", [
            {
                message: 'All fields are required'
            }
        ])
        res.redirect("/signup");
    }
})

// login

app.post("/login", async (req, res) => {
    let user = new db({email: req.body.mail, password: req.body.password})
    const {username, password} = req.body;

    if (username && password) {
        const find = await db.findOne({username: username});
        if (find !== null) {
            if (find.username === username) {
                req.login(user, (err) => {
                    if (err) {
                        console.log(err)
                        res.redirect("/");
                    } else {

                        passport.authenticate("local")(req, res, () => {
                            res.redirect("/" + date.day());
                        });
                    }

                })
            } else {
                mess = [
                    {
                        message: 'username or password is incorrect'
                    }
                ]
                res.redirect("/login");
            }
        } else {
            mess = [
                {
                    message: 'username or password is incorrect'
                }
            ]
            res.redirect("/login");
        }
    } else {
        mess = [
            {
                message: 'All fields are required'
            }
        ]
        res.redirect("/login");
    }

})

app.get('/' + date.day(), async (req, res) => {

    if (req.isAuthenticated()) {
        let user1 = req.user.username;
        const day = date.day();
        let find = await db.find({username: user1});
        find.shift();

        let arr2 = find.filter((a, i) => {
            return (a.name === undefined || a.name == date.day())

        })

        if (arr2.length !== 0) {
            items = arr2
        } else {
            let arr = find.filter((a, i) => {
                return (a.name === undefined)

            })
            console.log(arr)
            arr.length === 0
                ? items = []
                : items = find
            console.log(items)
        }

        if (items.length === 0) {
            let listItems = new db({username: user1, text: "Welcome to your todolist!"});
            let listItems1 = new db({username: user1, text: "Hit the + to add new item"});
            let listItems2 = new db(
                {username: user1, text: "<-- Hit this to delete item."}
            );
            let result1 = await listItems.save();
            let result2 = await listItems1.save();
            let result3 = await listItems2.save();
            let find = await db.find({username: user1});
            find.shift();
            let arr = find.filter((a, i) => {
                return (a.name === undefined)

            })
            res.render('list', {
                user: user1,
                days: day,
                newItem: arr
            });

        } else {
            arr2.length !== 0
                ? res.render('list', {
                    user: user1,
                    days: day,
                    newItem: arr2
                })
                : res.render('list', {
                    user: user1,
                    days: day,
                    newItem: find
                });

        }
    } else {
        res.redirect("/")
    }
})
app.post('/list', async (req, res) => {
    if (req.isAuthenticated()) {
        let user1 = req.user.username;
        let btn = req.body.button;
        const {text} = req.body
        if (text) {
            if (btn === date.day()) {

                let listItems = new db({username: user1, text: req.body.text, name: btn});
                let result = await listItems.save();
                res.redirect('/' + date.day());
            } else {
                let listItems = new db({username: user1, text: req.body.text, name: btn});
                let result = await listItems.save();
                if(btn == "Home" || "Work"||"ToPurchase"||'ToStudy'||"Meeting"){
                    let btn2 = btn.toLowerCase();
                    console.log(btn2)
                res.redirect('/' + btn2);

                }else{
                    res.redirect('/'+btn);
                }
            }

        } else {
            res.send("eamty")
        }
    } else {
        res.redirect("/")
    }

})

// Activities****************
app.get("/home",async(req,res)=>{
    if (req.isAuthenticated()) {
        let user1 = req.user.username;
        let find = await db.find({name:'Home'});
        let arr = find.filter((a)=>{
            return (a.name == "Home" && a.username == user1)
        })
        res.render('list', {
            user: user1,
            days: "Home",
            newItem: arr
        })
    }else{
        res.redirect("/")
    }    
})

app.get("/work",async(req,res)=>{
    if (req.isAuthenticated()) {
        let user1 = req.user.username;
        let find = await db.find({name:'Work'})
        let arr = find.filter((a)=>{
            return (a.name == "Work" && a.username == user1)
        })
        res.render('list', {
            user: user1,
            days: "Work",
            newItem: arr
        })
    }else{
        res.redirect("/")
    } 
})
app.get("/meeting",async(req,res)=>{
    if (req.isAuthenticated()) {
        let user1 = req.user.username;
        let find = await db.find({name:'Meeting'})
        let arr = find.filter((a)=>{
            return (a.name == "Meeting" && a.username == user1)
        })
        res.render('list', {
            user: user1,
            days: "Meeting",
            newItem: arr
        })
    }else{
        res.redirect("/")
    } 
})
app.get("/topurchase",async(req,res)=>{
    if (req.isAuthenticated()) {
        let user1 = req.user.username;
        let find = await db.find({name:'ToPurchase'})
        let arr = find.filter((a)=>{
            return (a.name == "ToPurchase" && a.username == user1)
        })
        res.render('list', {
            user: user1,
            days: "ToPurchase",
            newItem: arr
        })
    }else{
        res.redirect("/")
    } 
})
app.get("/tostudy",async(req,res)=>{
    if (req.isAuthenticated()) {
        let user1 = req.user.username;
        let find = await db.find({name:'ToStudy'})
        let arr = find.filter((a)=>{
            return (a.name == "ToStudy" && a.username == user1)
        })
        res.render('list', {
            user: user1,
            days: "ToStudy",
            newItem: arr
        })
    }else{
        res.redirect("/")
    } 
})




app.post("/delete", async (req, res) => {
    if (req.isAuthenticated()) {
        let header = req.rawHeaders
        let url = header[header.length-7]
        let path = url.split("/");
        let name2 = path[path.length-1]
        if(name2 == 0){
        name2 = date.day();
        }
        let user1 = req.user.username
        let id = req.body.checkbox;
        let find = await db.find({_id: id});
 
        if (find.length !== 0) {

            if (find[0].name === date.day && find[0].username === user1) {
                await db.deleteOne({_id: id});
                res.redirect("/" + date.day())
            } else if (find[0].name !== undefined &&find[0].username === user1) {
                await db.deleteOne({_id: id});
                res.redirect("/" + find[0].name)
            } else {
                await db.deleteOne({_id: id});
                res.redirect("/" + name2)
            }

        }
    } else {
        res.redirect("/")
    }

})
// logout**********************
app.get("/logout",nocache,(req,res)=>{
    req.logout((err)=>{
          if(err){
              console.log(err)
          }
    res.redirect("/");
});

})
app.get("/delete",nocache,async(req,res)=>{
    if(req.isAuthenticated()){
        let userName = req.user.username
        let data1 = await db.deleteMany({username:userName});
        res.redirect("/")
       }else{
           res.redirect("/");
    } 
       
   
});

// ________________________________________________


// url*******************************
app.get("/:name", async (req, res) => {
    
    if (req.isAuthenticated()) {
        let user1 = req.user.username;
        let param = req.params.name;
        if(param !== "logout"){


             if (param !== 'app2.js' && param !== "favicon.ico") {
                 data = param
             }
             let find1 = await db.find({name: param})
             if (find1.length === 0) {
                 res.render('list', {
                     user: user1,
                     days: param,
                     newItem: find1
                 });
             } else {
                let arr2 = find1.filter((a)=>{
                     return a.username === user1
                 })
                 res.render('list', {
                     user: user1,
                     days: param,
                     newItem: arr2
                 });

             }
        }    

    } else {
        res.redirect("/")
    }

})




app.listen(port, () => {
    console.log("server is started");
})
