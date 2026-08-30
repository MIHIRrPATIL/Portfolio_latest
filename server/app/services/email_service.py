import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from app.config import settings

class EmailService:
    """
    Automated Email Notification Service for Visitor Inquiries & Leads.
    Sends responsive, dark-mode HTML notifications to Mihir's inbox.
    Non-blocking and fail-safe: failures are logged without disrupting client requests.
    """

    def _build_html_template(
        self,
        visitor_name: str,
        email: str,
        project_scope: str,
        message: str,
        lead_id: Optional[int] = None
    ) -> str:
        lead_ref = f"#{lead_id}" if lead_id else "LIVE"
        admin_url = f"{settings.PORTFOLIO_URL.rstrip('/')}/admin"
        reply_mailto = f"mailto:{email}?subject=Re:%20Collaboration%20with%20Mihir%20Patil%20(Ref%20{lead_ref})"

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Collaboration Inquiry</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050508; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050508; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0d0d14; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 36px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(0, 0, 0, 0) 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: bold; color: #fca5a5; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 8px;">
                // INCOMING COLLABORATION INQUIRY {lead_ref}
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.02em; text-transform: uppercase;">
                New Lead Alert
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.5); line-height: 1.4;">
                A visitor submitted an inquiry via your portfolio terminal / AI Copilot.
              </p>
            </td>
          </tr>

          <!-- Core Details Card -->
          <tr>
            <td style="padding: 32px 36px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="padding-bottom: 16px;">
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 0.15em;">
                      VISITOR NAME
                    </div>
                    <div style="font-size: 16px; font-weight: bold; color: #ffffff; margin-top: 4px;">
                      {visitor_name or 'Anonymous Visitor'}
                    </div>
                  </td>
                  <td width="50%" style="padding-bottom: 16px;">
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 0.15em;">
                      CONTACT EMAIL
                    </div>
                    <div style="font-size: 15px; font-weight: bold; color: #fca5a5; margin-top: 4px;">
                      <a href="{reply_mailto}" style="color: #fca5a5; text-decoration: none;">{email}</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 8px;">
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 0.15em;">
                      PROJECT SCOPE
                    </div>
                    <div style="display: inline-block; margin-top: 6px; padding: 4px 12px; background-color: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; font-size: 12px; font-weight: bold; color: #fca5a5; font-family: 'Courier New', Courier, monospace;">
                      {project_scope or 'General Collaboration'}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Message Body Box -->
              <div style="background-color: rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 20px; margin-bottom: 28px;">
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 10px;">
                  INQUIRY MESSAGE
                </div>
                <div style="font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.9); white-space: pre-wrap; font-family: inherit;">
{message}
                </div>
              </div>

              <!-- Action Buttons -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="border-radius: 12px; background-color: #ffffff;">
                          <a href="{reply_mailto}" target="_blank" style="font-size: 13px; font-family: inherit; font-weight: 800; color: #000000; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 12px; letter-spacing: 0.05em; text-transform: uppercase;">
                            Reply to {visitor_name.split()[0] if visitor_name else 'Visitor'} &rarr;
                          </a>
                        </td>
                        <td width="12"></td>
                        <td align="center" style="border-radius: 12px; background-color: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15);">
                          <a href="{admin_url}" target="_blank" style="font-size: 12px; font-family: 'Courier New', Courier, monospace; font-weight: bold; color: #ffffff; text-decoration: none; padding: 13px 20px; display: inline-block; border-radius: 12px; letter-spacing: 0.08em; text-transform: uppercase;">
                            Admin Inbox
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: rgba(0, 0, 0, 0.4); border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: rgba(255, 255, 255, 0.35); letter-spacing: 0.15em; text-transform: uppercase;">
                MIHIR PATIL PORTFOLIO // AUTONOMOUS NOTIFICATION ENGINE
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    def _send_smtp_sync(
        self,
        recipient: str,
        subject: str,
        html_body: str,
        text_body: str
    ) -> bool:
        """Synchronous SMTP worker executed inside an async thread pool."""
        smtp_user = (settings.SMTP_USER or "").strip()
        smtp_pass = settings.clean_smtp_password
        smtp_host = settings.SMTP_HOST
        smtp_port = settings.SMTP_PORT

        if not smtp_user or not smtp_pass:
            print(f"ℹ️ [EMAIL NOTIFICATION] SMTP credentials not configured in .env. Notification logged to console for '{recipient}': {subject}")
            return False

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.effective_smtp_from
        msg["To"] = recipient
        msg["Reply-To"] = recipient

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        try:
            if smtp_port == 465:
                server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15)
            else:
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
                server.starttls()

            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, [recipient], msg.as_string())
            server.quit()
            print(f"✅ [EMAIL NOTIFICATION] Sent inquiry alert to {recipient}!")
            return True
        except Exception as e:
            print(f"⚠️ [EMAIL NOTIFICATION ERROR] Failed sending SMTP email to {recipient}: {str(e)}")
            return False

    async def send_lead_notification(
        self,
        visitor_name: str,
        email: str,
        project_scope: str,
        message: str,
        lead_id: Optional[int] = None
    ):
        """
        Asynchronously sends an email alert when a new lead/inquiry is captured.
        Guaranteed non-blocking and safe for client request lifecycles.
        """
        lead_ref = f"#{lead_id}" if lead_id else ""
        subject = f"⚡ New Lead {lead_ref}: {visitor_name or 'Visitor'} ({project_scope or 'Collaboration'})"
        
        text_body = f"""New Collaboration Inquiry {lead_ref}

Visitor: {visitor_name}
Email: {email}
Project Scope: {project_scope}

Message:
{message}

Review in Admin Portal: {settings.PORTFOLIO_URL}/admin
"""
        html_body = self._build_html_template(
            visitor_name=visitor_name,
            email=email,
            project_scope=project_scope,
            message=message,
            lead_id=lead_id
        )

        recipient = settings.NOTIFICATION_EMAIL or settings.SMTP_USER or "mihirpatil2505@gmail.com"

        # Execute SMTP network transmission in thread pool so it never blocks event loop
        await asyncio.to_thread(
            self._send_smtp_sync,
            recipient=recipient,
            subject=subject,
            html_body=html_body,
            text_body=text_body
        )

email_service = EmailService()
