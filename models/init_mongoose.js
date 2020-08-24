const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.mongouri2)
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);