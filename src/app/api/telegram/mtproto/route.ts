import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NextResponse } from 'next/server';
import { Api } from 'telegram/tl';

const apiId = parseInt(process.env.TELEGRAM_API_ID || '');
const apiHash = process.env.TELEGRAM_API_HASH || '';

let client: TelegramClient | null = null;

async function getClient(sessionString?: string) {
  if (!client) {
    const stringSession = new StringSession(sessionString || '');
    client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
      useWSS: false,
    });
    await client.connect();
  }
  return client;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, code, session } = body;

    const client = await getClient(session);

    switch (action) {
      case 'sendCode':
        if (!phone) {
          return NextResponse.json(
            { success: false, error: 'Phone number is required' },
            { status: 400 }
          );
        }

        try {
          const { phoneCodeHash } = await client.sendCode({
            apiId,
            apiHash,
        },phone.toString());

          return NextResponse.json({
            success: true,
            phone_code_hash: phoneCodeHash,
          });
        } catch (error: any) {
          console.error('Send code error:', error);
          return NextResponse.json({
            success: false,
            error: error.message || 'Failed to send code',
          });
        }

      case 'signIn':
        if (!phone || !code || !body.phone_code_hash) {
          return NextResponse.json(
            { success: false, error: 'Phone number, code and hash are required' },
            { status: 400 }
          );
        }

        try {
          const signInResult = await client.invoke(new Api.auth.SignIn({
            phoneNumber: phone.toString(),
            phoneCode: code.toString(),
            phoneCodeHash: body.phone_code_hash,
          }));

          const sessionString = client.session.save() as string;
          
          return NextResponse.json({ 
            success: true, 
            user: signInResult,
            session: sessionString
          });
        } catch (error: any) {
          if (error.message?.includes('SESSION_PASSWORD_NEEDED')) {
            return NextResponse.json({ success: false, error: 'PASSWORD_REQUIRED' });
          }
          console.error('Sign in error:', error);
          return NextResponse.json({
            success: false,
            error: error.message || 'Failed to sign in',
          });
        }

      case 'getChats':
        try {
          const dialogs = await client.getDialogs({});
          const chats = await Promise.all(
            dialogs.map(async (dialog) => {
              let type = 'contact';
              let title = dialog.title || dialog.name || 'Unnamed';
              
              if (dialog.entity) {
                const entity = dialog.entity;
                
                // Check if it's a channel or group
                if (entity.className === 'Channel') {
                  // Channels can be either broadcast channels or megagroups (supergroups)
                  type = entity.megagroup ? 'group' : 'channel';
                } else if (entity.className === 'Chat') {
                  type = 'group';
                } else if (entity.className === 'User' && entity.bot) {
                  type = 'bot';
                }

                // Get additional info for title
                if (entity.className === 'User') {
                  title = [entity.firstName, entity.lastName].filter(Boolean).join(' ') || entity.username || 'Unnamed';
                }
              }

              return {
                id: dialog.id?.toString() || '',
                title,
                type,
                entityType: dialog.entity?.className || 'Unknown',
                isBroadcast: dialog.entity?.broadcast || false,
                isMegagroup: dialog.entity?.megagroup || false,
              };
            })
          );

          return NextResponse.json({ success: true, chats });
        } catch (error: any) {
          console.error('Get chats error:', error);
          return NextResponse.json({
            success: false,
            error: error.message || 'Failed to get chats',
          });
        }

      case 'getEntityDetails':
        try {
          const { id } = body;
          const dialogs = await client.getDialogs({});
          const dialog = dialogs.find(d => d.id?.toString() === id);
          
          if (!dialog) {
            return NextResponse.json({ 
              success: false, 
              error: 'Entity not found' 
            }, { status: 404 });
          }

          const entity = dialog.entity;
          const details: any = {
            id: dialog.id?.toString(),
            title: dialog.title || dialog.name || 'Unnamed',
            type: dialog.isChannel ? 'channel' : dialog.isGroup ? 'group' : 
                  (entity?.className === 'User' && entity.bot) ? 'bot' : 'contact',
          };

          // Add additional details based on entity type
          if (entity) {
            if ('username' in entity) details.username = entity.username;
            if ('phone' in entity) details.phone = entity.phone;
            if ('participantsCount' in entity) details.participantsCount = entity.participantsCount;
            if ('about' in entity) details.about = entity.about;
            if ('verified' in entity) details.isVerified = entity.verified;
            if ('restricted' in entity) details.isRestricted = entity.restricted;
            if ('fake' in entity) details.isFake = entity.fake;
            if ('scam' in entity) details.isScam = entity.scam;
          }

          return NextResponse.json({ success: true, details });
        } catch (error: any) {
          console.error('Get entity details error:', error);
          return NextResponse.json({
            success: false,
            error: error.message || 'Failed to get entity details',
          });
        }

      case 'createChannel':
        try {
          const { title, about } = body;
          
          if (!title) {
            return NextResponse.json(
              { success: false, error: 'Channel title is required' },
              { status: 400 }
            );
          }

          const result = await client.invoke(new Api.channels.CreateChannel({
            title,
            about: about || '',
            broadcast: true,
            megagroup: false,
          }));

          return NextResponse.json({ 
            success: true, 
            channel: {
              id: result.chats[0].id.toString(),
              title: result.chats[0].title,
            }
          });
        } catch (error: any) {
          console.error('Create channel error:', error);
          return NextResponse.json({
            success: false,
            error: error.message || 'Failed to create channel',
          });
        }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Telegram API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        details: error.stack,
      },
      { status: 500 }
    );
  }
} 