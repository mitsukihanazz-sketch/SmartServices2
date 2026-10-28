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
        
        // ถ้าเป็นข้อความแรกในเธรด ให้บันทึกเจ้าของโพสต์และส่งปุ่มสอบถาม
        if (!threadOwnerMap.has(threadId)) {
            threadOwnerMap.set(threadId, message.author.id);

            const askRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ask_missing_info_bot2')
                    .setLabel('❓ ขอรายละเอียดเพิ่มเติม')
                    .setStyle(ButtonStyle.Secondary)
            );

            await message.reply({
                content: `💬 **หากข้อมูลงานไม่ครบถ้วน** สามารถกดปุ่มด้านล่างเพื่อขอรายละเอียดเพิ่มเติมจากเจ้าของโพสต์ได้ครับ`,
                components: [askRow]
            });
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'ask_missing_info_bot2') {
        const threadId = interaction.channel.id;
        const ownerId = threadOwnerMap.get(threadId);

        // กรณีเป็นเจ้าของโพสต์กดเอง
        if (interaction.user.id === ownerId) {
            return interaction.reply({ 
                content: '💡 คุณเป็นเจ้าของโพสต์ สามารถพิมพ์รายละเอียดงาน ชื่อลูกค้า หรือชื่อบริษัทเพิ่มเติมลงในเธรดนี้ได้เลยครับ', 
                ephemeral: true 
            });
        }

        // แจ้งเตือนคนกดแบบเห็นคนเดียว (Ephemeral) - คนโพสต์จะไม่เห็นข้อความนี้
        await interaction.reply({ 
            content: '✅ ส่งข้อความแจ้งเตือนขอรายละเอียดเพิ่มเติมไปยังเจ้าของโพสต์เรียบร้อยแล้วครับ', 
            ephemeral: true 
        });

        // ส่งข้อความแท็กเรียกเจ้าของโพสต์ในเธรดสาธารณะ
        if (ownerId) {
            await interaction.channel.send({
                content: `📢 <@${ownerId}> มีผู้สอบถามข้อมูลครับ: **รบกวนพิมพ์รายละเอียดงาน, ชื่อลูกค้า และชื่อบริษัทเพิ่มเติมให้หน่อยครับ** (กดโดย <@${interaction.user.id}>)`
            });
        } else {
            await interaction.channel.send({
                content: `📢 **รบกวนเจ้าของโพสต์พิมพ์รายละเอียดงาน, ชื่อลูกค้า และชื่อบริษัทเพิ่มเติมให้หน่อยครับ** (กดโดย <@${interaction.user.id}>)`
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);