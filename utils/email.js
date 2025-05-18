const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Gary Kono <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        console.log(process.env.BREVO_LOGIN, process.env.BREVO_PASSWORD)
        if(process.env.NODE_ENV === 'production') {
            return nodemailer.createTransport({

                host: 'smtp-relay.brevo.com', // or other Brevo SMTP host if applicable
                port: 587, // or other Brevo SMTP port if applicable
                secure: false, // true for 465, false for other ports
                auth: {
                  user: process.env.BREVO_LOGIN, // Your Brevo username (usually your email address)
                  pass: process.env.BREVO_PASSWORD // Your Brevo password or API key
                }
              });
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        })
    }

    // Send the actual email
    async send(template, subject) {
        // 1) Render HTML based on pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });

        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText(html)
        }

        // 3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
        // Maybe use this to implement checking whether email was properly send
        // console.log(await this.newTransport().sendMail(mailOptions));
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours Family!');
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes).');
    }
}