import { FACEBOOK_LINK, INSTAGRAM_LINK, TWITTER_LINK } from "../../../../config/config.service.js";

export const emailTemplate = ({ code, title }) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Saraha</title></head>
<body style="margin:0;background:#f2f4f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr><td align="center">
<table width="500" style="background:#ffffff;margin-top:40px;border-radius:10px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);">
<tr>
  <td style="background:linear-gradient(135deg,#6a11cb,#2575fc);padding:30px;text-align:center;color:white;">
    <h1 style="margin:0;font-size:30px;">Saraha</h1>
    <p style="margin:5px 0 0 0;">Email Verification</p>
  </td>
</tr>
<tr>
  <td style="padding:40px;text-align:center;">
    <h2 style="color:#333;">${title}</h2>
    <p style="color:#777;font-size:15px;">Use the verification code below to complete your action.</p>
    <div style="font-size:35px;letter-spacing:8px;background:#f4f6ff;padding:15px;border-radius:8px;display:inline-block;margin:20px 0;color:#6a11cb;font-weight:bold;">
      ${code}
    </div>
    <p style="color:#888;font-size:14px;">This code will expire in 5 minutes.</p>
  </td>
</tr>
<tr>
  <td style="background:#fafafa;padding:25px;text-align:center;">
    <p style="margin:0 0 10px 0;color:#555;">Stay connected</p>
    <a href="${FACEBOOK_LINK}"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="30"></a>
    <a href="${INSTAGRAM_LINK}"><img src="https://cdn-icons-png.flaticon.com/512/733/733558.png" width="30"></a>
    <a href="${TWITTER_LINK}"><img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" width="30"></a>
    <p style="margin-top:15px;font-size:12px;color:#aaa;">© 2026 Saraha. All rights reserved</p>
  </td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
