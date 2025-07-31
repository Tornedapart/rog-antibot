import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Telegraf, Markup } from 'telegraf';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID;

if (!BOT_TOKEN || !TELEGRAM_ADMIN_ID) {
    console.error('Error: Missing BOT_TOKEN or TELEGRAM_ADMIN_ID');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const pendingCredentials = new Map();
const userSelectedPlan = new Map();

const plans = {
    plan_week: {
        label: 'Weekly Plan ($22 ≈ Rp350.000)',
        text: '✅ You selected: Weekly Plan ($22 ≈ Rp350.000)',
    },
    plan_month: {
        label: 'Monthly Plan ($61 ≈ Rp970.000)',
        text: '✅ You selected: Monthly Plan ($61 ≈ Rp970.000)',
    },
};

function planButtons() {
    return Markup.inlineKeyboard([
        Markup.button.callback(plans.plan_week.label, 'select_plan_plan_week'),
        Markup.button.callback(plans.plan_month.label, 'select_plan_plan_month'),
    ]);
}

function paymentButtons(planKey) {
    return Markup.inlineKeyboard([
        // Optional Gopay
        // Markup.button.callback('GoPay', `pay_gopay_${planKey}`),
        Markup.button.callback('Bank Transfer', `pay_bank_${planKey}`),
        Markup.button.callback('Cancel', 'cancel'),
    ]);
}

function escapeMarkdown(text = '') {
    return text
        .replace(/[_*[\]()~`>#+\-=|{}.!]/g, (match) => '\\' + match);
}

bot.start(async (ctx) => {
    const payload = ctx.startPayload;
    const user = ctx.from;

    if (payload && plans[payload]) {
        await ctx.reply(
            `Hello ${user.first_name}!\n${plans[payload].text}\n\nPlease confirm your plan:`,
            Markup.inlineKeyboard([
                Markup.button.callback('✅ Confirm', `confirm_plan_${payload}`),
                Markup.button.callback('❌ Cancel', 'cancel'),
            ])
        );
    } else {
        await ctx.reply(
            `👋 Welcome to ROG Antibot!\nPlease choose a plan to get access:\nhttps://rog-antibot.vercel.app`,
            planButtons()
        );
    }
});

// Handle callback queries
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const user = ctx.from;

    try {
        if (data.startsWith('select_plan_')) {
            const planKey = data.replace('select_plan_', '');
            await ctx.editMessageText(
                `You selected: ${plans[planKey].label}\n\nConfirm your plan:`,
                Markup.inlineKeyboard([
                    Markup.button.callback('✅ Confirm', `confirm_plan_${planKey}`),
                    Markup.button.callback('❌ Cancel', 'cancel'),
                ])
            );
        } else if (data.startsWith('confirm_plan_')) {
            const planKey = data.replace('confirm_plan_', '');
            userSelectedPlan.set(user.id, planKey);
            await ctx.editMessageText(
                `Great! You confirmed *${plans[planKey].label}*.\n\nPlease transfer to the following account and upload proof:`,
                {
                    parse_mode: 'Markdown',
                    ...paymentButtons(planKey),
                }
            );
        } else if (data.startsWith('pay_bank_')) {
            const planKey = data.replace('pay_bank_', '');
            await ctx.editMessageText(
                `🏦 *Bank Transfer Instructions for ${plans[planKey].label}:*\n\n` +
                `Account Name : *Irna Waulandri*\n` +
                `Bank : *BRI*\n` +
                `Account Number: *370201056292533*\n\n` +
                `📸 After transferring, please upload a screenshot of your payment confirmation.`,
                { parse_mode: 'Markdown' }
            );
        } else if (data === 'cancel') {
            await ctx.editMessageText('❌ Action cancelled. If you want to try again, please select a plan:', planButtons());
            await ctx.answerCbQuery('Cancelled.');
        } else if (data.startsWith('admin_confirm_') || data.startsWith('admin_cancel_')) {
            const [, action, userId] = data.split('_');
            const message = ctx.callbackQuery.message;
            const rawCaption = message.caption || '📬 Payment proof';
            const escapedCaption = escapeMarkdown(rawCaption);
            const extraNote = action === 'confirm'
                ? escapeMarkdown('✅ *Payment confirmed.*')
                : escapeMarkdown('❌ *Payment rejected.*');

            try {
                if (action === 'confirm') {
                    const creds = pendingCredentials.get(userId);
                    const username = creds?.username || 'none';
                    const password = creds?.password || 'none';

                    await ctx.telegram.sendMessage(
                        userId,
                        `✅ Payment confirmed\\! Your plan is now active\\.\n\n` +
                        `Here are your access credentials:\n` +
                        `👤 *USER* : \`${username}\`\n` +
                        `🔐 *KEY* : \`${password}\``,
                        { parse_mode: 'MarkdownV2' }
                    );
                } else {
                    await ctx.telegram.sendMessage(userId, '❌ Payment Declined.');
                }

                await ctx.editMessageCaption(
                    `${escapedCaption}\n\n${extraNote}`,
                    { parse_mode: 'MarkdownV2' }
                );

                await ctx.answerCbQuery('Action completed.');
            } catch (err) {
                console.error('Admin confirm/cancel error:', err);
                await ctx.answerCbQuery('⚠️ Something went wrong while updating the message.');
            }
        } else {
            await ctx.answerCbQuery('Unknown action.');
        }
    } catch (err) {
        console.error('Callback error:', err);
        await ctx.answerCbQuery('⚠️ Something went wrong.');
    }
});

// File upload handling (photo)
bot.on('photo', async (ctx) => {
    const user = ctx.from;
    const planKey = userSelectedPlan.get(user.id);
    const planLabel = planKey ? plans[planKey]?.label : 'Unknown Plan';
    const photo = ctx.message.photo.pop();
    const caption = escapeMarkdown(ctx.message.caption || '');
    const username = escapeMarkdown(user.username || user.first_name);

    try {
        await ctx.telegram.sendPhoto(
            TELEGRAM_ADMIN_ID,
            photo.file_id,
            {
                caption:
                    `📬 *SUBSCRIPTION*: ${escapeMarkdown(planLabel)}\n` +
                    `📬 Payment proof from: @${username}\n` +
                    `🆔 ID: \`${user.id}\`\n\n${caption}`,
                parse_mode: 'MarkdownV2',
                ...Markup.inlineKeyboard([
                    Markup.button.callback('✅ Confirm', `admin_confirm_${user.id}`),
                    Markup.button.callback('❌ Cancel', `admin_cancel_${user.id}`)
                ])
            }
        );
        await ctx.reply('✅ Thanks! We received your proof. Please wait up to 10 minutes.');
    } catch (error) {
        console.error('Send photo error:', error);
        await ctx.reply('❌ Failed to send your proof. Please try again later.');
    }
});

// Document upload fallback
bot.on('document', async (ctx) => {
    const user = ctx.from;
    const doc = ctx.message.document;
    const caption = escapeMarkdown(ctx.message.caption || '');
    const username = escapeMarkdown(user.username || user.first_name);

    const isImage = ['image/png', 'image/jpeg'].includes(doc.mime_type);
    if (!isImage) {
        return ctx.reply('⚠️ Please upload a valid image file (JPG or PNG).');
    }

    const planKey = userSelectedPlan.get(user.id);
    const planLabel = planKey ? plans[planKey]?.label : 'Unknown Plan';

    try {
        await ctx.telegram.sendPhoto(
            TELEGRAM_ADMIN_ID,
            doc.file_id,
            {
                caption:
                    `📬 *SUBSCRIPTION*: ${escapeMarkdown(planLabel)}\n` +
                    `📬 Payment proof from: @${username}\n` +
                    `🆔 ID: \`${user.id}\`\n\n${caption}`,
                parse_mode: 'MarkdownV2',
                ...Markup.inlineKeyboard([
                    Markup.button.callback('✅ Confirm', `admin_confirm_${user.id}`),
                    Markup.button.callback('❌ Cancel', `admin_cancel_${user.id}`)
                ])
            }
        );
        await ctx.reply('✅ Thanks! We received your file. Please wait up to 10 minutes.');
    } catch (error) {
        console.error('Send document error:', error);
        await ctx.reply('❌ Failed to send your file. Please try again later.');
    }
});

// Admin credentials injection command
bot.command('give', async (ctx) => {
    if (ctx.from.id.toString() !== TELEGRAM_ADMIN_ID) {
        return ctx.reply('❌ You are not authorized to use this command.');
    }

    const args = ctx.message.text.split(' ').slice(1);
    const [userId, username, password] = args;

    if (!userId || !username || !password) {
        return ctx.reply('⚠️ Usage: /give <userId> <username> <password>');
    }

    pendingCredentials.set(userId, { username, password });
    await ctx.reply(`✅ Credentials saved for user ID ${userId}`);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

bot.launch().then(() => {
    console.log('🤖 Bot is running...');
});
