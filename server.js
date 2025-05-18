const mongoose = require('mongoose')
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err);
    process.exit(1);
})

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

// These paramaters gives warnings about being deprecated and will throw errors in the future. Just use them for now because we
// use them in the course
mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log('DB connection successful');
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err);
    server.close(() => {
        process.exit(1);
    })
});

process.on('SIGTERM', () => {
    console.log('SIGTERM RECEIVED. Shutting down gracefully.');
    server.close(() => {
        console.log('💥 Process terminated.');
    });
})