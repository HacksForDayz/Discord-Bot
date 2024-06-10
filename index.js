const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const noblox = require('noblox.js');
const { token, robloxCookie } = require('./config.json'); // Ensure this file exists and contains the token and robloxCookie

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    partials: ["CHANNEL", "MESSAGE"]
});

const CLIENT_ID = '1248877701910233119'; // Replace with your bot's client ID
const GUILD_ID = '1249068686195556453';   // Replace with your guild ID

const commandChannelMap = {};

const commands = [
    {
        name: 'ping',
        description: 'Replies with Pong!'
    },
    {
        name: 'serverinfo',
        description: 'Provides information about the server'
    },
    {
        name: 'robloxinfo',
        description: 'Provides information about a Roblox user',
        options: [
            {
                name: 'username',
                type: 3, // Correct type for STRING is 3
                description: 'The Roblox username to fetch information for',
                required: true
            }
        ]
    },
    {
        name: 'delete',
        description: 'Deletes a specified number of messages',
        options: [
            {
                name: 'count',
                type: 4, // Correct type for INTEGER is 4
                description: 'The number of messages to delete',
                required: true
            }
        ]
    },
    {
        name: 'kick',
        description: 'Kicks a user from the server',
        options: [
            {
                name: 'user',
                type: 6, // Correct type for USER is 6
                description: 'The user to kick',
                required: true
            },
            {
                name: 'reason',
                type: 3, // Correct type for STRING is 3
                description: 'The reason for kicking the user',
                required: false
            }
        ]
    },
    {
        name: 'ban',
        description: 'Bans a user from the server',
        options: [
            {
                name: 'user',
                type: 6, // Correct type for USER is 6
                description: 'The user to ban',
                required: true
            },
            {
                name: 'reason',
                type: 3, // Correct type for STRING is 3
                description: 'The reason for banning the user',
                required: false
            }
        ]
    },
    {
        name: 'checkrole',
        description: 'Checks the roles of a user',
        options: [
            {
                name: 'user',
                type: 6, // Correct type for USER is 6
                description: 'The user to check roles for',
                required: true
            }
        ]
    },
    {
        name: 'count',
        description: 'Starts a counting game where users must count in sequence'
    },
    {
        name: 'getrank',
        description: 'Gets the rank of a Roblox user in a specified group',
        options: [
            {
                name: 'username',
                type: 3, // Correct type for STRING is 3
                description: 'The Roblox username to fetch rank for',
                required: true
            },
            {
                name: 'groupid',
                type: 4, // Correct type for INTEGER is 4
                description: 'The Roblox group ID',
                required: true
            }
        ]
    },
    {
        name: 'setcommandtochannel',
        description: 'Restricts a command to be run only in a specific channel',
        options: [
            {
                name: 'command',
                type: 3, // Correct type for STRING is 3
                description: 'The command to restrict',
                required: true
            },
            {
                name: 'channel',
                type: 7, // Correct type for CHANNEL is 7
                description: 'The channel to restrict the command to',
                required: true
            }
        ]
    }
];

const rest = new REST({ version: '9' }).setToken(token);

// Log into Roblox
noblox.setCookie(robloxCookie)
    .then((user) => {
        console.log(`Logged in to Roblox as ${user.UserName}`);
    })
    .catch((error) => {
        console.error('Failed to log in to Roblox:', error);
    });

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

let currentCount = 0;
let lastCounter = null;

client.once('ready', () => {
    console.log(`Client has been initiated! ${client.user.username}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options, channelId } = interaction;

    if (commandName !== 'setcommandtochannel' && commandChannelMap[commandName] && commandChannelMap[commandName] !== channelId) {
        return interaction.reply(`The command \`${commandName}\` can only be used in <#${commandChannelMap[commandName]}>.`);
    }

    if (commandName === 'ping') {
        await interaction.reply('Pong!');
        setTimeout(() => interaction.deleteReply(), 10000);
    } else if (commandName === 'serverinfo') {
        const guild = interaction.guild;
        const owner = await guild.fetchOwner();
        const embed = new EmbedBuilder()
            .setTitle('Server Information')
            .addFields(
                { name: 'Server name', value: guild.name, inline: true },
                { name: 'Total members', value: `${guild.memberCount}`, inline: true },
                { name: 'Created on', value: `${guild.createdAt}`, inline: true },
                { name: 'Owned by', value: `@${owner.user.tag}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        setTimeout(() => interaction.deleteReply(), 10000);
    } else if (commandName === 'robloxinfo') {
        const username = options.getString('username');

        try {
            const userId = await noblox.getIdFromUsername(username);
            const userInfo = await noblox.getPlayerInfo(userId);

            const embed = new EmbedBuilder()
                .setTitle('Roblox User Information')
                .addFields(
                    { name: 'Username', value: userInfo.username, inline: true },
                    { name: 'Display Name', value: userInfo.displayName, inline: true },
                    { name: 'User ID', value: `${userInfo.userId}`, inline: true },
                    { name: 'Description', value: userInfo.blurb || 'No description', inline: false },
                    { name: 'Join Date', value: `${userInfo.joinDate}`, inline: true },
                    { name: 'Age', value: `${userInfo.age} days`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            setTimeout(() => interaction.deleteReply(), 10000);
        } catch (error) {
            await interaction.reply(`Failed to fetch Roblox information for username "${username}": ${error.message}`);
            setTimeout(() => interaction.deleteReply(), 10000);
        }
    } else if (commandName === 'delete') {
        const count = options.getInteger('count');

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return await interaction.reply('You do not have permission to delete messages.');
        }

        const messages = await interaction.channel.messages.fetch({ limit: count });
        await interaction.channel.bulkDelete(messages);
        await interaction.reply(`Deleted ${count} messages.`);
        setTimeout(() => interaction.deleteReply(), 10000);
    } else if (commandName === 'kick') {
        const user = options.getUser('user');
        const reason = options.getString('reason') || 'No reason provided';

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return await interaction.reply('You do not have permission to kick members.');
        }

        const member = interaction.guild.members.cache.get(user.id);
        if (member) {
            await member.kick(reason);
            await interaction.reply(`Kicked ${user.tag} for: ${reason}`);
            setTimeout(() => interaction.deleteReply(), 10000);
        } else {
            await interaction.reply('User not found.');
            setTimeout(() => interaction.deleteReply(), 10000);
        }
    } else if (commandName === 'ban') {
        const user = options.getUser('user');
        const reason = options.getString('reason') || 'No reason provided';

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return await interaction.reply('You do not have permission to ban members.');
        }

        const member = interaction.guild.members.cache.get(user.id);
        if (member) {
            await member.ban({ reason });
            await interaction.reply(`Banned ${user.tag} for: ${reason}`);
            setTimeout(() => interaction.deleteReply(), 10000);
        } else {
            await interaction.reply('User not found.');
            setTimeout(() => interaction.deleteReply(), 10000);
        }
    } else if (commandName === 'checkrole') {
        const user = options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);

        if (member) {
            const roles = member.roles.cache.map(role => role.name).join(', ');
            await interaction.reply(`${user.tag} has the following roles: ${roles}`);
            setTimeout(() => interaction.deleteReply(), 10000);
        } else {
            await interaction.reply('User not found.');
            setTimeout(() => interaction.deleteReply(), 10000);
        }
    } else if (commandName === 'count') {
        currentCount = 0;
        lastCounter = null;
        await interaction.reply('Counting game has started! Start with 1.');
    } else if (commandName === 'getrank') {
        const username = options.getString('username');
        const groupId = options.getInteger('groupid');

        try {
            const userId = await noblox.getIdFromUsername(username);
            const rankName = await noblox.getRankNameInGroup(groupId, userId);
            const rank = await noblox.getRankInGroup(groupId, userId);

            await interaction.reply(`User ${username} is ranked ${rankName} (${rank}) in the group ${groupId}.`);
        } catch (error) {
            await interaction.reply(`Failed to fetch rank for username "${username}" in group "${groupId}": ${error.message}`);
        }
    } else if (commandName === 'setcommandtochannel') {
        const command = options.getString('command');
        const channel = options.getChannel('channel');

        commandChannelMap[command] = channel.id;
        await interaction.reply(`The command \`${command}\` can now only be used in <#${channel.id}>.`);
    }
});

client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase() === "test") {
        message.reply("Test successful!");
    }

    if (!message.author.bot && currentCount !== null) {
        const count = parseInt(message.content);

        if (isNaN(count) || count !== currentCount + 1 || (lastCounter && lastCounter.id === message.author.id)) {
            currentCount = 0;
            lastCounter = null;
            await message.reply('Count reset! Start over from 1.');
        } else {
            currentCount = count;
            lastCounter = message.author;
            await message.react('✅');
        }
    }
});

client.login(token);
