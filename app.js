const express = require('express');
const app = express();
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const  multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const grid = require('gridfs-stream');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const { Grid } = require('gridfs-stream');
//mongo uri

const mongouri = process.env.mongouri;
const conn = mongoose.createConnection(mongouri,
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true  
    }
)

const User = require('./models/user');
require('dotenv').config();
app.set("view engine","ejs")


//middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(methodOverride('_method'));


//init gfs

let gfs;

conn.once('open',()=>{
    gfs = grid(conn.db,mongoose.mongo)
    gfs.collection('media')
})


//create storage engine
const storage = new GridFsStorage({
  url: mongouri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'media'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

app.post('/upload',upload.single('file'),async(req,res,next)=>{
    const {email,password} = req.body;
    const user = new User({email,password,fileid:req.file.id})
    await user.save()
    res.redirect('/')
})

//@get all /files
//@display all files in json
app.get('/files',async(req,res,next)=>{
            gfs.file.find().toArray((err,files)=>{
                if(!files || files.length === 0)
                {
                    res.status(404).json({
                        err:'No files exist'
                    })
                }
                return res.json(files);
            })
   
})


//display a single file 
app.get('/files/:filename',async(req,res,next)=>{
            gfs.file.findOne({filename:req.params.filename},(err,file)=>{
                if(!file || file.length === 0)
                {
                    res.status(404).json({
                        err:"file does't exist"
                    })
                }
                return res.json(file);
            })
   
})
function authenticatetoken(req,res,next)
{
    console.log(req.headers);   
    const authheader= req.headers['authorization'];
    console.log(authheader);
    const token = authheader && authheader.split(' ')[1];
   next();
}
//dsiplay an image
app.get('/image/:filename',authenticatetoken,async(req,res,next)=>{
    
            gfs.files.findOne({filename:req.params.filename},(err,file)=>{
                if(!file || file.length === 0)
                {
                    res.status(404).json({
                        err:"file does't exist"
                    })
                }
                if(file.contentType === 'video/mp4')
                {
                    if (req.headers['range']) {
                        var parts = req.headers['range'].replace(/bytes=/, "").split("-");
                        var partialstart = parts[0];
                        var partialend = parts[1];
            
                        var start = parseInt(partialstart, 10);
                        var end = partialend ? parseInt(partialend, 10) : file.length - 1;
                        var chunksize = (end - start) + 1;
            
                        res.writeHead(206, {
                            'Accept-Ranges': 'bytes',
                            'Content-Length': chunksize,
                            'Content-Range': 'bytes ' + start + '-' + end + '/' + file.length,
                            'Content-Type': file.contentType
                        });
            
                        gfs.createReadStream({
                            _id: file._id,
                            range: {
                                startPos: start,
                                endPos: end
                            }
                        }).pipe(res);
                    } else {
                        res.header('Content-Length', file.length);
                        res.header('Content-Type', file.contentType);
            
                        gfs.createReadStream({
                            _id: file._id
                        }).pipe(res);
                    }
                }
                else if(file.contentType === 'image/jpg' || file.contentType === 'image/png')
                {
                    const readstream = gfs.createReadStream(file.filename);
                    readstream.pipe(res)
                }
                else{
                    res.status(404).json({
                        err:"not an image"
                    })
                }
            })
})



app.get('/',async(req,res,next)=>{
    gfs.files.find().toArray((err,files)=>{
        if(!files || files.length === 0)
        {
           res.render('index',{files:false});
        }
        else {
            files.map(file =>{
                if(file.contentType === 'image/jpg' || file.contentType === 'image/png')
                {
                    file.isImage = true;
                    console.log("this is an imgae");
                }
                else if(file.contentType === 'video/mp4')
                {
                    file.isVideo = true;
                    console.log("this is video");
                }
                else{
                    file.isImage = false;
                    file.isVideo = false;
                }
            })
            res.header('authorization','Bearer e8r94983421');
            res.render('index',{files:files})
        }
    })
})



app.delete('/files/:id',async(req,res,next)=>{
    console.log('camehere 1')
    gfs.remove({_id:req.params.id,root:'media'},(err,gridStore)=>{
        if(err)
        {
            return res.status(404).json({err:err})
        }
        res.redirect('/')
    })
})

app.listen(process.env.port,()=>{
    console.log(`server running on the port ${process.env.port}`)
});