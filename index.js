require('dotenv').config();
const express = require('express');
const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Machining Helper Bot 2 is online!');
});

app.listen(PORT, () => {
    console.log(`Helper Bot 2 Server listening on port ${PORT}`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// เก็บข้อมูลเจ้าของเธรดแต่ละโพสต์
const threadOwnerMap = new Map();

client.once('ready', () => {
    console.log(`Helper Bot 2 Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.channel.isThread()) {
        const threadId = message.channel.id;
        
        // ถ้าเป็นข้อความแรกในเธรด ให้บันทึกเจ้าของโพสต์และส่ง 2 ปุ่มสอบถาม
        if (!threadOwnerMap.has(threadId)) {
            threadOwnerMap.set(threadId, message.author.id);

            const askRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ask_job_details_bot2')
                    .setLabel('📋 ขอรายละเอียดงาน')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('ask_missing_info_bot2')
                    .setLabel('❓ ข้อมูลไม่ครบถ้วน')
                    .setStyle(ButtonStyle.Secondary)
            );

            await message.reply({
                content: `💬 **หากต้องการสอบถามข้อมูลเพิ่มเติมจากเจ้าของโพสต์** สามารถเลือกกดปุ่มด้านล่างได้เลยครับ`,
                components: [askRow]
            });
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const threadId = interaction.channel.id;
    const ownerId = threadOwnerMap.get(threadId);

    // กรณีเป็นเจ้าของโพสต์กดเอง
    if (interaction.user.id === ownerId) {
        return interaction.reply({ 
            content: '💡 คุณเป็นเจ้าของโพสต์ สามารถพิมพ์รายละเอียดงาน ชื่อลูกค้า หรือข้อมูลเพิ่มเติมลงในเธรดนี้ได้เลยครับ', 
            ephemeral: true 
        });
    }

    let requestMessageText = '';

    if (interaction.customId === 'ask_job_details_bot2') {
        requestMessageText = '**รบกวนพิมพ์รายละเอียดงานเพิ่มเติมให้หน่อยครับ**';
    } else if (interaction.customId === 'ask_missing_info_bot2') {
        requestMessageText = '**ขอรายละเอียดข้อมูลที่ไม่ครบหน่อยครับ**';
    } else {
        return;
    }

    // แจ้งเตือนคนกดแบบเห็นคนเดียว (Ephemeral)
    await interaction.reply({ 
        content: '✅ ส่งข้อความแจ้งเตือนไปยังเจ้าของโพสต์เรียบร้อยแล้วครับ', 
        ephemeral: true 
    });

    // ส่งข้อความแท็กเรียกเจ้าของโพสต์ในเธรดสาธารณะ (ไม่แสดงชื่อคนกด)
    if (ownerId) {
        await interaction.channel.send({
            content: `📢 <@${ownerId}> มีผู้สอบถามข้อมูลครับ: ${requestMessageText}`
        });
    } else {
        await interaction.channel.send({
            content: `📢 **เจ้าของโพสต์ครับ**: ${requestMessageText}`
        });
    }

    // ลบข้อความปุ่มกดทิ้งทันทีหลังมีคนกดใช้งาน
    try {
        await interaction.message.delete();
    } catch (error) {
        console.error('ไม่สามารถลบข้อความปุ่มได้:', error);
    }
});

client.login(process.env.DISCORD_TOKEN);