import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createErrorEmbed } from '../../helpers';

const answers = [
    'My phone battery lasts longer than your relationships.',
    'Oh you’re talking to me, I thought you only talked behind my back.',
    'My name must taste good because it’s always in your mouth.',
    'Don’t you get tired of putting make up on two faces every morning?',
    'Too bad you can’t count jumping to conclusions and running your mouth as exercise.',
    'Is your drama going to an intermission soon?',
    'I’m an acquired taste. If you don’t like me, acquire some taste.',
    'If I wanted a bitch, I would have bought a dog.',
    'My business is my business. Unless you’re a thong, get out of my ass.',
    'It’s a shame you can’t Photoshop your personality.',
    'I don’t sugarcoat shit. I’m not Willy Wonka.',
    'Acting like a prick doesn’t make yours grow bigger.',
    'The smartest thing that ever came out of your mouth was a penis.',
    'Calm down. Take a deep breath and then hold it for about twenty minutes.',
    'Jealousy is a disease. Get well soon, bitch!',
    'When karma comes back to punch you in the face, I want to be there in case it needs help.',
    'You have more faces than Mount Rushmore.',
    'Sorry, sarcasm falls out of my mouth like bullshit falls out of yours.',
    'Don’t mistake my silence for weakness. No one plans a murder out loud.',
    'Yes, I am a bitch — just not yours.',
    'I’m sorry you got offended that one time you were treated the way you treat everyone all the time.',
    'You should wear a condom on your head. If you’re going to be a dick, you might as well dress like one.',
    'Maybe you should eat make-up so you’ll be pretty on the inside too.',
    'Being a bitch is a tough job but someone has to do it.',
    'My middle finger gets a boner every time I see you.',
    'You’re entitled to your incorrect opinion.',
    'You’re so real. A real ass.',
    'Whoever told you to be yourself gave you really bad advice.',
    'If I had a face like yours I’d sue my parents.',
    'Where’s your off button?',
    'I didn’t change. I grew up. You should try it sometime.',
    'I thought I had the flu, but then I realized your face makes me sick to my stomach.',
    'The people who know me the least have the most to say.',
    'I’m jealous of people who don’t know you.',
    'I’m sorry that my brutal honesty inconvenienced your ego.',
    'You sound reasonable… Time to up my medication.',
    'Aww, it’s so cute when you try to talk about things you don’t understand.',
    'Is there an app I can download to make you disappear?',
    'I’m sorry, you seem to have mistaken me with a woman who will take your shit.',
    'I’m visualizing duck tape over your mouth.',
    '90% of your ‘beauty’ could be removed with a Kleenex.',
    'I suggest you do a little soul searching. You might just find one.',
    'Some people should use a glue stick instead of chapstick.',
    'My hair straightener is hotter than you.',
    'I have heels higher than your standards.',
    'I’d smack you, but that would be animal abuse.',
    'Why is it acceptable for you to be an idiot but not for me to point it out?',
    'If you’re offended by my opinion, you should hear the ones I keep to myself.',
    'If you’re going to be a smart ass, first you have to be smart, otherwise you’re just an ass.',
    'Your face is fine but you will have to put a bag over that personality.',
    'Hey, I found your nose, it’s in my business again!',
    'I’m not an astronomer but I am pretty sure the earth revolves around the sun and not you.',
    'I might be crazy, but crazy is better than stupid.',
    'Keep rolling your eyes. Maybe you’ll find your brain back there.',
    'I’m sorry, what language are you speaking? It sounds like bullshit.',
    'Everyone brings happiness to a room. I do when I enter, you do when you leave.',
    'I keep thinking you can’t get any dumber and you keep proving me wrong.',
    'I’m not shy. I just don’t like you.',
    'Your crazy is showing. You might want to tuck it back in.',
    'I am allergic to stupidity, so I break out in sarcasm.',
    'You’re like a plunger. You like to bring up old shit.',
    'I am not ignoring you. I am simply giving you time to reflect on what an idiot you are being.',
    'I hide behind sarcasm because telling you to go fuck yourself is rude in most social situations.',
    'You’re the reason I prefer animals to people.',
    'You’re not pretty enough to have such an ugly personality.',
    'Your birth certificate is an apology letter from the condom manufacturer',
    'I’d like to talk to you but I left my English-to-Dumbass Dictionary at home.',
    'You don’t like me, then fuck off. Problem solved.'
];

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('roast')
        .setDescription('Roast yourself or someone else.')
        .addUserOption((option) => option.setName('user').setDescription('The user to roast').setRequired(true)),
    run: async (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => {
        new Promise<void>(async (done, error) => {
            if (interaction) {
                let i = Math.floor(Math.random() * answers.length);
                let user =
                    interaction instanceof CommandInteraction
                        ? interaction.options.getUser('user')
                        : interaction.member?.user;
                await interaction
                    .reply({
                        content: `${user!} ${answers[i]}`,
                        options: {
                            tts: true
                        }
                    })
                    .then(done)
                    .catch(async (err) => {
                        await interaction.editReply(createErrorEmbed('🚩 Error roasting: `' + err + '`'));
                        error(err);
                    });
            }

            if (message) {
                let author: any = message.author;

                if (args!.length > 0) {
                    if (args![0].toLowerCase() != 'me') author = args![0];

                    let i = Math.floor(Math.random() * answers.length);
                    await message.channel.send({
                        content: `${author} ${answers[i]}`,
                        options: {
                            tts: true
                        }
                    });
                } else {
                    await message.channel.send(`${author} You need to mention someone with *@[name]*`);
                    return;
                }
            }
        });
    }
};
