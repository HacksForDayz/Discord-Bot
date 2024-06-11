const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const noblox = require('noblox.js');
const express = require('express');
const http = require('http');
const fs = require('fs');

// Read configuration from config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const mycookie = config.robloxCookie;
const mytoken = config.token;

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 80;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: ["CHANNEL", "MESSAGE", "REACTION"]
});

const CLIENT_ID = '1248877701910233119'; // Replace with your bot's client ID
const GUILD_ID = '1249068686195556453';   // Replace with your guild ID
const LEWWY_ID = '1249068686195556453';   // Replace with Lewwy's user ID

let lewwyRep = 0;

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
    },
    {
        name: 'test',
        description: 'Replies with Test successful!'
    },
    {
        name: 'reactrole',
        description: 'Creates a reaction role message',
        options: [
            {
                name: 'rolename',
                type: 3, // Correct type for STRING is 3
                description: 'The name of the role to assign',
                required: true
            }
        ]
    },
    {
        name: 'mute',
        description: 'Mutes a user in the server',
        options: [
            {
                name: 'user',
                type: 6, // Correct type for USER is 6
                description: 'The user to mute',
                required: true
            },
            {
                name: 'reason',
                type: 3, // Correct type for STRING is 3
                description: 'The reason for muting the user',
                required: false
            }
        ]
    },
    {
        name: 'unmute',
        description: 'Unmutes a user in the server',
        options: [
            {
                name: 'user',
                type: 6, // Correct type for USER is 6
                description: 'The user to unmute',
                required: true
            }
        ]
    },
    {
        name: 'postreview',
        description: 'Posts a review message',
        options: [
            {
                name: 'message',
                type: 3, // Correct type for STRING is 3
                description: 'The review message to post',
                required: true
            }
        ]
    },
    {
        name: 'rep',
        description: 'Shows the current reputation of Lewwy'
    },
    {
        name: 'addrep',
        description: 'Adds reputation to Lewwy'
    }
];

const rest = new REST({ version: '9' }).setToken(mytoken);

// Log into Roblox
noblox.setCookie(mycookie)
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
let countingGameActive = false;

client.once('ready', () => {
    console.log(`Client has been initiated! ${client.user.username}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options, channelId } = interaction;

    if (interaction.guildId !== GUILD_ID) {
        return interaction.reply("This command can only be used in the specified server.");
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
        countingGameActive = true;
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
    } else if (commandName === 'reactrole') {
        const roleName = options.getString('rolename');

        const role = interaction.guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            return interaction.reply(`Role \`${roleName}\` not found.`);
        }

        const embed = new EmbedBuilder()
            .setTitle('React Role')
            .setDescription(`React to this message to get the \`${roleName}\` role!`)
            .setColor('#00FF00');

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });
        await message.react('👍');

        const filter = (reaction, user) => {
            return reaction.emoji.name === '👍' && !user.bot;
        };

        const collector = message.createReactionCollector({ filter });

        collector.on('collect', async (reaction, user) => {
            const member = reaction.message.guild.members.cache.get(user.id);
            if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role);
                await user.send(`You have been given the \`${roleName}\` role.`);
                lewwyRep++; // Increment Lewwy's rep when someone reacts
            } else {
                await member.roles.remove(role);
                await user.send(`The \`${roleName}\` role has been removed from you.`);
            }
        });
    } else if (commandName === 'test') {
        await interaction.reply('Test successful!');
    } else if (commandName === 'mute') {
        const user = options.getUser('user');
        const reason = options.getString('reason') || 'No reason provided';

        const member = interaction.guild.members.cache.get(user.id);
        if (member) {
            const muteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
            if (!muteRole) {
                return interaction.reply('Mute role not found. Please create a role named `Muted`.');
            }

            await member.roles.add(muteRole);
            await interaction.reply(`Muted ${user.tag} for: ${reason}`);
            setTimeout(() => interaction.deleteReply(), 10000);
        } else {
            await interaction.reply('User not found.');
            setTimeout(() => interaction.deleteReply(), 10000);
        }
    } else if (commandName === 'unmute') {
        const user = options.getUser('user');

        const member = interaction.guild.members.cache.get(user.id);
        if (member) {
            const muteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
            if (!muteRole) {
                return interaction.reply('Mute role not found. Please create a role named `Muted`.');
            }

            await member.roles.remove(muteRole);
            await interaction.reply(`Unmuted ${user.tag}`);
            setTimeout(() => interaction.deleteReply(), 10000);
        } else {
            await interaction.reply('User not found.');
            setTimeout(() => interaction.deleteReply(), 10000);
        }
    } else if (commandName === 'postreview') {
        const reviewMessage = options.getString('message');

        const embed = new EmbedBuilder()
            .setTitle('New Review')
            .setDescription(reviewMessage)
            .setColor('#00FF00')
            .setTimestamp();

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });
        await message.react('👍');
        lewwyRep++; // Increment Lewwy's rep when a review is posted

        const filter = (reaction, user) => {
            return reaction.emoji.name === '👍' && !user.bot;
        };

        const collector = message.createReactionCollector({ filter });

        collector.on('collect', async (reaction, user) => {
            if (!user.bot) {
                lewwyRep++; // Increment Lewwy's rep when someone reacts
            }
        });
    } else if (commandName === 'rep') {
        await interaction.reply(`Lewwy's current rep: ${lewwyRep}`);
    } else if (commandName === 'addrep') {
        lewwyRep++;
        await interaction.reply('Lewwy has been given 1 rep.');
    }
});

client.on('messageCreate', async (message) => {
    if (!message.author.bot && countingGameActive) {
        const count = parseInt(message.content);

        if (isNaN(count)) return; // Ignore if it's not a number

        if (count !== currentCount + 1 || (lastCounter && lastCounter.id === message.author.id)) {
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

client.login(mytoken);

// Create an HTTP server to keep the bot running
app.get('/', (req, res) => {
    res.send('Bot is running');
});

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
