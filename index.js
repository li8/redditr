const express = require('express')
const app = express()
const fetchUrl = require("fetch").fetchUrl;
var schedule = require('node-schedule');

// sequelize
const Sequelize = require('sequelize');
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },

  // SQLite only
  storage: 'reddit.sqlite'
});

const Links = sequelize.define('Links', {
  kind :Sequelize.STRING,
  url :Sequelize.TEXT,
  domain : Sequelize.TEXT,
  id : {
    type:Sequelize.INTEGER,
    primaryKey:true,
    autoIncrement:true
  },
  pid:Sequelize.TEXT,
  title : Sequelize.TEXT,
  clicked : Sequelize.BOOLEAN,
  link_flair_text : Sequelize.TEXT,
  pinned : Sequelize.BOOLEAN,
  score : Sequelize.INTEGER,
  gilded : Sequelize.INTEGER,
  downs : Sequelize.INTEGER,
  brand_safe : Sequelize.BOOLEAN,
  created_utc : Sequelize.DATE,
  ups : Sequelize.INTEGER,
  num_comments : Sequelize.INTEGER,
  author :Sequelize.STRING
});



var recur = (count,objArr,cb)=>{
  // source file is iso-8859-15 but it is converted to utf-8 automatically
  var url = "http://www.reddit.com/r/worldnews/new.json";

  if(objArr.length > 0 ){
    console.log("slow ",objArr.length);
    console.log("slow ",JSON.stringify(objArr[objArr.length - 1]) );
    var url = "http://www.reddit.com/r/worldnews/new.json?count="+objArr.length+"&after="+objArr[objArr.length-1].kind+"_"+objArr[objArr.length-1].pid;
  }
  console.log("------------------");
  console.log(url);
  fetchUrl(url, function(error, meta, body){
      var resObj= JSON.parse(body.toString());
      // console.log("slow 2", body.toString());
      resObj.data.children.forEach((child,index)=>{
        var Obj={
          kind : child.kind,
          url : child.data.url,
          domain : child.data.domain,
          pid : child.data.id,
          title : child.data.title,
          clicked : child.data.clicked,
          link_flair_text : child.data.link_flair_text,
          pinned : child.data.pinned,
          score : child.data.score,
          gilded : child.data.gilded,
          downs : child.data.downs,
          brand_safe : child.data.brand_safe,
          created_utc : child.data.created_utc,
          ups : child.data.ups,
          num_comments : child.data.num_comments,
          author : child.data.author
        }

        objArr.push(Obj);
        Links.create(Obj).then(link=>{
        }).catch(err=>console.log("ERr" , err));;

      })
      if(count==objArr.length){
        cb(objArr);
      }else{
        recur(count,objArr,cb);
      }
  });
}


app.get('/', (req, res) =>{
  recur(100,[],(obj)=>{
    console.log(obj.length);
    Links.findAll({
      where:{}
    }).then(links=>{
      res.send(links)
    }).catch(err=>{
      console.log(err);
    })
  })
});

var port = process.env.PORT || 5000;

app.get('/db',(req,res)=>{
  Links.findAll({
    where:{}
  }).then(links=>{
    res.send(links)
  }).catch(err=>{
    console.log(err);
  })
});

app.listen(port, () => {
  Links.sync().then(() => {
  // Table created
  var j = schedule.scheduleJob('*/1 * * * *', function(){
    console.log("-------------------------------------------");
    fetchUrl("http://localhost:"+port, function(error, meta, body){
      console.log(body.toString());
    });
  });


});
})
