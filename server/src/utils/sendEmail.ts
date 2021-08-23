import nodemailer from 'nodemailer';

// async..await is not allowed in global scope, must use a wrapper
export const sendEmail = async (to: string, subject: string, html: string) => {
	// Generate test SMTP service account from ethereal.email
	// Only needed if you don't have a real mail account for testing
	// let testAccount = await nodemailer.createTestAccount();
	// console.log('testAccount: ', testAccount);

	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: 'wotm7txwfttep76e@ethereal.email', // generated ethereal user
			pass: 'TDZh9U43zmsVrphB7r', // generated ethereal password
		},
	});

	let info = await transporter.sendMail({
		from: '"No reply Typescript Reddit" <noreply@tsr.com>',
		to,
		subject,
		html,
	});

	console.log('Message sent: %s', info.messageId);
	console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
};
