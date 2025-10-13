const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const {
  TOKEN,
  GUILD_ID,
  BOOSTER_ROLE_ID,
  CLAIMED_ROLE_ID
} = process.env;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

const DATA_DIR = path.join(__dirname, '..');
const KEYS_FILE = path.join(DATA_DIR, 'entregar.txt');
const CLAIMED_FILE = path.join(DATA_DIR, 'claimed.json');

function readKeys() {
  if (!fs.existsSync(KEYS_FILE)) return [];
  const raw = fs.readFileSync(KEYS_FILE, 'utf8');
  return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
}

function popKey() {
  const keys = readKeys();
  if (keys.length === 0) return null;
  const key = keys.shift();
  fs.writeFileSync(KEYS_FILE, keys.join('\n'));
  return key;
}

function readClaimed() {
  if (!fs.existsSync(CLAIMED_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(CLAIMED_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function hasClaimed(id) {
  return readClaimed().some(x => x.userId === id);
}

function markClaimed(id) {
  const data = readClaimed();
  data.push({ userId: id, at: new Date().toISOString() });
  fs.writeFileSync(CLAIMED_FILE, JSON.stringify(data, null, 2));
}

client.once('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const content = message.content.trim();

  // Painel bonito
  if (content.toLowerCase() === '.setup') {

  const member = message.member;
  const canManage = member.permissions.has(PermissionsBitField.Flags.ManageGuild) || member.permissions.has(PermissionsBitField.Flags.Administrator);
  if (!canManage) {
    return message.reply('Você precisa de permissão de **Gerenciar Servidor** para usar `.setup`.');
  }

const embed = new EmbedBuilder()
  .setColor(0x2f3136) // Cor cinza escuro padrão do Discord
  .setThumbnail('https://cdn.discordapp.com/icons/952572168041009202/a_a4e7503b795e327345c0fbceb328442a.gif?size=80&quality=lossless')
  .setDescription(
    '<:bola:1426034298045206538> Ajude nosso discord **Impulsionando** e ganhe **Vantagens** dentro do nosso Servidor, não perca essa chance.\n\n' +
    'Selecione sua recompensa no menu abaixo:\n' +
    '• VALORANT\n• FIVEM\n• FREE FIRE\n• CS2\n\n' +
    '<:cadeadoaberto:1426035679321784362> *É necessário estar com o boost ativo no servidor para resgatar.*'
  )
  .setFooter({ text: 'Atenciosamente: ZIMO STORE' });

const rowSelect = new ActionRowBuilder().addComponents(
  new StringSelectMenuBuilder()
    .setCustomId('select_reward')
    .setPlaceholder('Escolha sua recompensa')
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel('VALORANT').setValue('valorant').setDescription('Desfrute do ZIMO VALORANT'),
      new StringSelectMenuOptionBuilder().setLabel('FIVEM').setValue('fivem').setDescription('Desfrute do ZIMO FIVEM'),
      new StringSelectMenuOptionBuilder().setLabel('FREE FIRE').setValue('freefire').setDescription('Desfrute do ZIMO FREE FIRE'),
      new StringSelectMenuOptionBuilder().setLabel('CS2').setValue('cs2').setDescription('Desfrute do ZIMO CS2')
    )
);

const rowLink = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Dúvidas')
    .setStyle(ButtonStyle.Link)
    .setURL('https://discord.com/channels/952572168041009202/1290474277518180384')
    .setEmoji('<:1413707443418173503:1421997731764764702>')
);

  await message.channel.send({ embeds: [embed], components: [rowSelect, rowLink] });
  return;
  }

  
});

client.on('interactionCreate', async (interaction) => {
  // Trata seleção do menu de recompensas
  if (!interaction.isStringSelectMenu() || interaction.customId !== 'select_reward') return;
  await interaction.deferReply({ ephemeral: true });

  try {
    const guild = client.guilds.cache.get(GUILD_ID || interaction.guildId);
    const member = await guild.members.fetch(interaction.user.id);

    if (hasClaimed(member.id)) {
      return interaction.editReply('Você já resgatou seu benefício de boost anteriormente.');
    }

    const hasBooster = BOOSTER_ROLE_ID ? member.roles.cache.has(BOOSTER_ROLE_ID) : (member.premiumSince !== null);
    if (!hasBooster) {
      return interaction.editReply('Para resgatar, você precisa estar **boostando** o servidor.');
    }

    const selected = interaction.values[0];
    const fileMap = {
      valorant: path.join(DATA_DIR, 'stock', 'valorant.txt'),
      fivem: path.join(DATA_DIR, 'stock', 'fivem.txt'),
      freefire: path.join(DATA_DIR, 'stock', 'freefire.txt'),
      cs2: path.join(DATA_DIR, 'stock', 'cs2.txt')
    };
    const STOCK_FILE = fileMap[selected];
    function popKeyFrom(file) {
      if (!fs.existsSync(file)) return null;
      const raw = fs.readFileSync(file, 'utf8');
      const keys = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (keys.length === 0) return null;
      const key = keys.shift();
      fs.writeFileSync(file, keys.join('\n'));
      return key;
    }

    const key = popKeyFrom(STOCK_FILE);
    if (!key) {
      return interaction.editReply('Sem stock disponível para o produto selecionado. Tente novamente mais tarde.');
    }

    // Tenta enviar por DM
    let dmSent = true;
    try {
      const dm = await interaction.user.createDM();
      await dm.send(`<:caixa:1426038153046655067> Produto: ${selected.toUpperCase()}\n<:chave:1426038260043350148> Key: \`${key}\``);
    } catch (err) {
      dmSent = false;
    }

    // Marca como claim e adiciona papel de bloqueio
    const data = readClaimed();
    data.push({ userId: member.id, product: selected, key, at: new Date().toISOString() });
    fs.writeFileSync(CLAIMED_FILE, JSON.stringify(data, null, 2));
    if (CLAIMED_ROLE_ID) {
      try { await member.roles.add(CLAIMED_ROLE_ID); } catch {}
    }

    if (dmSent) {
      await interaction.editReply('Recompensa enviada por DM! Você não poderá resgatar novamente.');
    } else {
      await interaction.editReply(`Não consegui enviar DM. Aqui está sua key: \`${key}\` para ${selected.toUpperCase()}. Você foi marcado e não poderá resgatar novamente.`);
    }
  } catch (err) {
    console.error(err);
    await interaction.editReply('Ocorreu um erro ao processar seu resgate. Tente novamente mais tarde.');
  }
});

if (!TOKEN) {
  console.error('Falta TOKEN no .env');
  process.exit(1);
}

client.login(TOKEN);