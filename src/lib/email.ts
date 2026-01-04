import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

import { env } from '@/env.mjs'

import { ocean } from '@/styles/colors'

const { AMAZON_REGION, AMAZON_SES_FROM_EMAIL } = env

const ses = new SESClient({ region: AMAZON_REGION })

interface WelcomeEmailParams {
  recipientEmail: string
  recipientName: string
}

interface TreeInvitationEmailParams {
  recipientEmail: string
  recipientName: string
  inviterName: string
  treeName: string
  treeSlug: string
  role: string
}

interface NewsletterEmailParams {
  recipientEmail: string
  recipientName: string
  treeName: string
  treeSlug: string
  recentAdditions: Array<{
    name: string
    addedDate: string
  }>
  events: Array<{
    name: string
    eventType: 'birthday' | 'anniversary'
    date: string
    yearsAgo?: number
  }>
  totalMembers: number
}

/**
 * Sends a welcome email to a new user
 * @param params {WelcomeEmailParams} - Email parameters
 * @returns Promise<boolean> - True if email was sent successfully
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<boolean> {
  const { recipientEmail, recipientName } = params

  const appUrl = env.AUTH_URL

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Roots</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="border-radius: 16px; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background-color: ${ocean[400]}; border-radius: 16px;">
              <h1 style="margin: 0 0 8px; color: ${ocean[0]}; font-size: 28px; font-weight: 700;">
                Welcome to Roots!
              </h1>
              <p style="margin: 0; color: ${ocean[50]}; font-size: 16px; font-weight: 500;">
                Start preserving your family's story
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: ${ocean[400]}; font-size: 18px; line-height: 1.6; font-weight: 600;">
                Hi ${recipientName},
              </p>
              
              <p style="margin: 0 0 24px; color: ${ocean[400]}; font-size: 16px; line-height: 1.7;">
                Thank you for joining Roots! We're thrilled to help you preserve and share your family's story.
              </p>
              
              <div style="background-color: ${ocean[50]}; border-left: 6px solid ${ocean[400]}; padding: 20px; margin: 32px 0; border-radius: 0px 16px 16px 0px;">
                <h3 style="margin: 0 0 12px; color: ${ocean[400]}; font-size: 18px; font-weight: 600;">
                  Getting started
                </h3>
                <ul style="margin: 0; padding-left: 24px; color: ${ocean[300]}; font-size: 15px; line-height: 1.8;">
                  <li style="margin-bottom: 8px;">Create your first family tree</li>
                  <li style="margin-bottom: 8px;">Add family members and their stories</li>
                  <li style="margin-bottom: 8px;">Upload and organize photos</li>
                  <li>Invite relatives to collaborate</li>
                </ul>
              </div>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 32px 0;">
                    <a href="${appUrl}" style="display: inline-block; padding: 16px 40px; background-color: ${ocean[400]}; color: ${ocean[0]}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 16px; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);">
                      Start building your tree
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: ${ocean[300]}; font-size: 14px; line-height: 1.6;">
                If you have any questions or need assistance, feel free to reach out. We're here to help you every step of the way.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 2px solid ${ocean[200]};">
              <p style="margin: 0; color: ${ocean[200]}; font-size: 12px; text-align: center; line-height: 1.6;">
                You're receiving this email because you created an account on Roots.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer Text -->
        <p style="margin: 24px 0 0; color: ${ocean[100]}; font-size: 12px; text-align: center;">
          ©${new Date().getFullYear()} Roots. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  const textBody = `
Welcome to Roots!

Hi ${recipientName},

Thank you for joining Roots! We're thrilled to help you preserve and share your family's story.

Getting Started:
• Create your first family tree
• Add family members and their stories
• Upload and organize photos
• Invite relatives to collaborate

Start building your tree: ${appUrl}

If you have any questions or need assistance, feel free to reach out. We're here to help you every step of the way.

---
You're receiving this email because you created an account on Roots.

©${new Date().getFullYear()} Roots. All rights reserved.
  `.trim()

  try {
    const command = new SendEmailCommand({
      Source: `Roots <${AMAZON_SES_FROM_EMAIL}>`,
      Destination: { ToAddresses: [recipientEmail] },
      Message: {
        Subject: { Data: `Welcome to Roots, ${recipientName}!`, Charset: 'UTF-8' },
        Body: {
          Html: { Data: htmlBody, Charset: 'UTF-8' },
          Text: { Data: textBody, Charset: 'UTF-8' },
        },
      },
    })

    await ses.send(command)
    return true
  } catch (_) {
    return false
  }
}

/**
 * Sends a tree invitation email using AWS SES
 * @param params {TreeInvitationEmailParams} - Email parameters
 * @returns Promise<boolean> - True if email was sent successfully
 */
export async function sendTreeInvitationEmail(params: TreeInvitationEmailParams): Promise<boolean> {
  const { recipientEmail, recipientName, inviterName, treeName, treeSlug, role } = params

  const appUrl = env.AUTH_URL
  const treeUrl = `${appUrl}/trees/${treeSlug}`

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tree invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="border-radius: 16px; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background-color: ${ocean[400]}; border-radius: 16px;">
              <h1 style="margin: 0 0 8px; color: ${ocean[0]}; font-size: 28px; font-weight: 700;">You've been invited!</h1>
              <p style="margin: 0; color: ${ocean[50]}; font-size: 16px; font-weight: 500;">
                Join a family tree collaboration
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px; color: ${ocean[400]}; font-size: 16px; line-height: 1.6;">
                Hi ${recipientName},
              </p>
              
              <p style="margin: 0 0 24px; color: ${ocean[400]}; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to collaborate on the family tree <strong>"${treeName}"</strong> as a <strong>${role.toLowerCase()}</strong>.
              </p>
              
              <p style="margin: 0 0 32px; color: ${ocean[300]}; font-size: 14px; line-height: 1.6;">
                You can now view and ${role === 'VIEWER' ? 'explore' : 'contribute to'} this family tree. Click the button below to get started.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 32px;">
                    <a href="${treeUrl}" style="display: inline-block; padding: 16px 40px; background-color: ${ocean[400]}; color: ${ocean[0]}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 16px; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);">
                      View family tree
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 8px; color: ${ocean[300]}; font-size: 14px; line-height: 1.5;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin: 0; color: ${ocean[400]}; font-size: 14px; word-break: break-all;">
                ${treeUrl}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 2px solid ${ocean[200]};">
              <p style="margin: 0; color: ${ocean[200]}; font-size: 12px; text-align: center; line-height: 1.6;">
                This invitation was sent by ${inviterName}. If you weren't expecting this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer Text -->
        <p style="margin: 24px 0 0; color: ${ocean[100]}; font-size: 12px; text-align: center;">
          ©${new Date().getFullYear()} Roots. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  const textBody = `
Hi ${recipientName},

${inviterName} has invited you to collaborate on the family tree "${treeName}" as a ${role.toLowerCase()}.

You can now view and ${role === 'VIEWER' ? 'explore' : 'contribute to'} this family tree.

Visit the tree here: ${treeUrl}

---
This invitation was sent by ${inviterName}. If you weren't expecting this email, you can safely ignore it.

©${new Date().getFullYear()} Roots. All rights reserved.
  `.trim()

  try {
    const command = new SendEmailCommand({
      Source: `Roots <${AMAZON_SES_FROM_EMAIL}>`,
      Destination: { ToAddresses: [recipientEmail] },
      Message: {
        Subject: { Data: `You've been invited to "${treeName}"`, Charset: 'UTF-8' },
        Body: {
          Html: { Data: htmlBody, Charset: 'UTF-8' },
          Text: { Data: textBody, Charset: 'UTF-8' },
        },
      },
    })

    await ses.send(command)
    return true
  } catch (_) {
    return false
  }
}

/**
 * Sends a weekly newsletter email with family tree updates
 * @param params {NewsletterEmailParams} - Email parameters
 * @returns Promise<boolean> - True if email was sent successfully
 */
export async function sendWeeklyNewsletter(params: NewsletterEmailParams): Promise<boolean> {
  const {
    recipientEmail,
    recipientName,
    treeName,
    treeSlug,
    recentAdditions,
    events,
    totalMembers,
  } = params

  const appUrl = env.AUTH_URL
  const treeUrl = `${appUrl}/trees/${treeSlug}`
  const profileUrl = `${appUrl}/profile`

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly update - ${treeName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="border-radius: 16px; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background-color: ${ocean[400]}; border-radius: 16px;">
              <h1 style="margin: 0 0 8px; color: ${ocean[0]}; font-size: 28px; font-weight: 700;">
                ${treeName}
              </h1>
              <p style="margin: 0; color: ${ocean[50]}; font-size: 16px; font-weight: 500;">
                Weekly family tree update
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: ${ocean[400]}; font-size: 18px; line-height: 1.6; font-weight: 600;">
                Hi ${recipientName},
              </p>
              
              <p style="margin: 0 0 32px; color: ${ocean[400]}; font-size: 16px; line-height: 1.7;">
                Here's what's new with your <strong>${treeName}</strong> family tree this week.
              </p>

              <!-- Stats -->
              <div style="background: ${ocean[50]}; border-radius: 0px 0px 16px 16px; border-top: 6px solid ${ocean[400]}; padding: 24px; margin-bottom: 32px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align: center; padding: 8px;">
                      <div style="font-size: 32px; font-weight: 700; color: ${ocean[400]}; margin-bottom: 4px;">${recentAdditions.length}</div>
                      <div style="font-size: 14px; color: ${ocean[300]}; font-weight: 500;">New this week</div>
                    </td>  
                    <td style="text-align: center; padding: 8px; border-left: 2px solid ${ocean[100]};">
                      <div style="font-size: 32px; font-weight: 700; color: ${ocean[400]}; margin-bottom: 4px;">${totalMembers}</div>
                      <div style="font-size: 14px; color: ${ocean[300]}; font-weight: 500;">Total members</div>
                    </td>
                  </tr>
                </table>
              </div>

              ${
                recentAdditions.length > 0
                  ? `
              <!-- Recent Additions -->
              <div style="margin-bottom: 32px;">
                <h2 style="margin: 0 0 20px; color: ${ocean[400]}; font-size: 20px; font-weight: 600; border-bottom: 2px solid ${ocean[200]}; padding-bottom: 12px;">
                  Recently added
                </h2>
                ${recentAdditions
                  .map(
                    (member) => `
                  <div style="background-color: ${ocean[50]}; border-left: 6px solid ${ocean[400]}; padding: 16px; margin-bottom: 12px; border-radius: 0px 16px 16px 0px;">
                    <p style="margin: 0; color: ${ocean[400]}; font-size: 16px; font-weight: 600;">
                      ${member.name}
                    </p>
                    <p style="margin: 4px 0 0; color: ${ocean[300]}; font-size: 14px;">
                      Added on ${new Date(member.addedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                `
                  )
                  .join('')}
              </div>
              `
                  : ''
              }

              ${
                events.length > 0
                  ? `
              <!-- Events -->
              <div style="margin-bottom: 32px;">
                <h2 style="margin: 0 0 20px; color: ${ocean[400]}; font-size: 20px; font-weight: 600; border-bottom: 2px solid ${ocean[200]}; padding-bottom: 12px;">
                  This week's dates
                </h2>
                ${events
                  .map(
                    (event) => `
                  <div style="background-color: ${ocean[50]}; border-left: 6px solid ${ocean[400]}; padding: 16px; margin-bottom: 12px;border-radius: 0px 16px 16px 0px;">
                    <p style="margin: 0; color: ${ocean[400]}; font-size: 16px; font-weight: 600;">
                        ${event.name}
                    </p>
                    <p style="margin: 4px 0 0; color: ${ocean[300]}; font-size: 14px;">
                      ${event.eventType === 'birthday' ? 'Birthday' : 'Anniversary'} - ${new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      ${event.yearsAgo ? ` (${event.yearsAgo} years${event.eventType === 'birthday' ? '' : ' ago'})` : ''}
                    </p>
                  </div>
                `
                  )
                  .join('')}
              </div>
              `
                  : ''
              }
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="${treeUrl}" style="display: inline-block; padding: 16px 40px; background-color: ${ocean[400]}; color: ${ocean[0]}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 16px; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);">
                      View your family tree
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 2px solid ${ocean[200]};">
              <p style="margin: 0; color: ${ocean[200]}; font-size: 12px; text-align: center; line-height: 1.6;">
                You're receiving this weekly update because you have newsletters enabled for this family tree.
                <br>
                <a href="${profileUrl}" style="color: ${ocean[300]}; text-decoration: underline;">Manage your preferences</a>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer Text -->
        <p style="margin: 24px 0 0; color: ${ocean[100]}; font-size: 12px; text-align: center;">
          ©${new Date().getFullYear()} Roots. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  const textBody = `
${treeName} - Weekly family tree update

Hi ${recipientName},

Here's what's new with your ${treeName} family tree this week.

Total members: ${totalMembers}
New this week: ${recentAdditions.length}

${
  recentAdditions.length > 0
    ? `
Recently added:
${recentAdditions.map((member) => `• ${member.name} (Added on ${new Date(member.addedDate).toLocaleDateString()})`).join('\n')}
`
    : ''
}

${
  events.length > 0
    ? `
This week's dates:
${events.map((event) => `• ${event.name} - ${event.eventType === 'birthday' ? 'Birthday' : 'Anniversary'} - ${new Date(event.date).toLocaleDateString()}${event.yearsAgo ? ` (${event.yearsAgo} years${event.eventType === 'birthday' ? '' : ' ago'}` : ''}`).join('\n')}
`
    : ''
}

View your family tree: ${treeUrl}

---
You're receiving this weekly update because you have newsletters enabled for this family tree.
Manage your preferences: ${treeUrl}/edit

©${new Date().getFullYear()} Roots. All rights reserved.
  `.trim()

  try {
    const command = new SendEmailCommand({
      Source: `Roots <${AMAZON_SES_FROM_EMAIL}>`,
      Destination: { ToAddresses: [recipientEmail] },
      Message: {
        Subject: { Data: `${treeName} - Your weekly family tree update`, Charset: 'UTF-8' },
        Body: {
          Html: { Data: htmlBody, Charset: 'UTF-8' },
          Text: { Data: textBody, Charset: 'UTF-8' },
        },
      },
    })

    await ses.send(command)
    return true
  } catch (_) {
    return false
  }
}
