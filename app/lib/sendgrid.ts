import sg = require("@sendgrid/mail");

sg.setApiKey(process.env.SENDGRID_API_KEY || "");

export default sg;
