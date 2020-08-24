const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://narendraiiitl:narendra@upload-y1od8.mongodb.net/profile?retryWrites=true&w=majority")
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);