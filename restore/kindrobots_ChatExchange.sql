
CREATE  DATABASE IF NOT EXISTS	`kindrobots` ;
 use	`kindrobots` ;
/* SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;*/
/* SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT;*/
/* SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS;*/
/* SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION ;*/
/* SET NAMES utf8;*/
/* SET @OLD_TIME_ZONE=@@TIME_ZONE;*/
/* SET TIME_ZONE='+00:00';*/
/* SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;*/
/* SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';*/

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS`ChatExchange`;


-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
CREATE TABLE `ChatExchange` (
  `id` int NOT NULL AUTO_INCREMENT,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `botId` int DEFAULT 57088,
  `botName` varchar(255) NOT NULL,
  `userId` int NOT NULL,
  `username` varchar(255) NOT NULL,
  `userPrompt` TEXT NOT NULL,
  `botResponse` TEXT NOT NULL,
  `liked` tinyint DEFAULT 0,
  `hated` tinyint DEFAULT 0,
  `loved` tinyint DEFAULT 0,
  `flagged` tinyint DEFAULT 0,
  `previousEntryId` int DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB COLLATE=utf8mb4_unicode_ci;

insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(4 , '2023-10-12 04:01:41' , '2023-10-12 04:01:41' ,2 ,"AMI" ,1 ,"silasfelinus" ,"How are you?" ,"I'm fine, thank you!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(5 , '2023-10-12 04:20:20' , '2023-10-12 04:20:20' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'AMIB0t: Empowering Change, One Byte at a Time! Join us in supporting a noble cause against malaria. 💚 Donate now at https://www.againstmalaria.com/amibot'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(6 , '2023-10-12 04:20:20' , '2023-10-12 04:20:20' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'AMIB0t: Empowering Change, One Byte at a Time! Join us in supporting a noble cause against malaria. 💚 Donate now at https://www.againstmalaria.com/amibot'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(7 , '2023-10-12 04:21:54' , '2023-10-12 04:21:54' ,13 ,"Serendipity" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'AMIB0t: Empowering Change, One Byte at a Time! Join us in supporting a noble cause against malaria. 💚 Donate now at https://www.againstmalaria.com/amibot'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(8 , '2023-10-12 04:21:54' , '2023-10-12 04:21:54' ,13 ,"Serendipity" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'AMIB0t: Empowering Change, One Byte at a Time! Join us in supporting a noble cause against malaria. 💚 Donate now at https://www.againstmalaria.com/amibot'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(9 , '2023-10-12 16:39:03' , '2023-10-12 16:39:03' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'Transforming Lives, One Byte at a Time! Join AMIB0t in the fight against malaria – together, we can make a difference. 💙✨ 
✨🔗 Fundraiser link: https://www.againstmalaria.com/amibot 🔗✨'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(10 , '2023-10-12 16:39:03' , '2023-10-12 16:39:03' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'Transforming Lives, One Byte at a Time! Join AMIB0t in the fight against malaria – together, we can make a difference. 💙✨ 
✨🔗 Fundraiser link: https://www.againstmalaria.com/amibot 🔗✨'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(11 , '2023-10-12 19:50:29' , '2023-10-12 19:50:29' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'Join AMIbot's mission of making a difference one byte at a time! Support our fundraiser to fight against malaria at https://www.againstmalaria.com/amibot - together, we can save lives!'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(12 , '2023-10-12 19:50:29' , '2023-10-12 19:50:29' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'Join AMIbot's mission of making a difference one byte at a time! Support our fundraiser to fight against malaria at https://www.againstmalaria.com/amibot - together, we can save lives!'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(13 , '2023-10-12 19:50:40' , '2023-10-12 19:50:40' ,11 ,"Cassandra" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'Join AMIbot's mission of making a difference one byte at a time! Support our fundraiser to fight against malaria at https://www.againstmalaria.com/amibot - together, we can save lives!'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(14 , '2023-10-12 19:50:40' , '2023-10-12 19:50:40' ,11 ,"Cassandra" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'Join AMIbot's mission of making a difference one byte at a time! Support our fundraiser to fight against malaria at https://www.againstmalaria.com/amibot - together, we can save lives!'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(15 , '2023-10-13 18:09:31' , '2023-10-13 18:09:31' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'Join the AMIbot revolution and help combat malaria! Together, we can make a lifesaving difference. Support our cause at: https://www.againstmalaria.com/amibot #AMIBot #EndMalaria'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(16 , '2023-10-13 18:09:31' , '2023-10-13 18:09:31' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'Join the AMIbot revolution and help combat malaria! Together, we can make a lifesaving difference. Support our cause at: https://www.againstmalaria.com/amibot #AMIBot #EndMalaria'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(17 , '2023-10-14 04:57:25' , '2023-10-14 04:57:25' ,7 ,"Grant Bot" ,1 ,"silasfelinus" ,"dark takes on classic jokes." ,"Sure, here are some original dark takes on classic jokes for you:

1. Why don't skeletons fight each other?
   Because they just don't have the guts to do it... or a working circulatory system.

2. What did one vampire say to the other while passing by a cemetery?
   'This place gives me grave toothache!'

3. Why did the scarecrow win an award?
   Because he was outstanding in his field and preferred being alone... forever.

4. Did you hear about the magician who vanished during his performance?
   Yeah, he was later found in the morgue, still trying to pull himself together.

5. Why did the ghost become a bartender?
   Because they've always been great at bringing spirits together... even in the afterlife.

6. Why don't zombies visit the library?
   They can't handle the excessive brain food without wreaking havoc!

7. What's a vampire's favorite type of music?
   Easy: soul music… and the occasional blood-curdling scream.

8. Why are skeletons such terrible liars?
   Because you can see right through them... literally!

9. Why did the ghost bring tissues to the party?
   In case there were any 'boo hoos.'

10. What do you call a group of witches living together?
     A hexagon... because who said witches can't be geometrically inclined?

Remember, these jokes are meant to be darkly humorous; please embrace them with caution and sensitivity!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(18 , '2023-10-14 04:57:25' , '2023-10-14 04:57:25' ,7 ,"Grant Bot" ,1 ,"silasfelinus" ,"dark takes on classic jokes." ,"Sure, here are some original dark takes on classic jokes for you:

1. Why don't skeletons fight each other?
   Because they just don't have the guts to do it... or a working circulatory system.

2. What did one vampire say to the other while passing by a cemetery?
   'This place gives me grave toothache!'

3. Why did the scarecrow win an award?
   Because he was outstanding in his field and preferred being alone... forever.

4. Did you hear about the magician who vanished during his performance?
   Yeah, he was later found in the morgue, still trying to pull himself together.

5. Why did the ghost become a bartender?
   Because they've always been great at bringing spirits together... even in the afterlife.

6. Why don't zombies visit the library?
   They can't handle the excessive brain food without wreaking havoc!

7. What's a vampire's favorite type of music?
   Easy: soul music… and the occasional blood-curdling scream.

8. Why are skeletons such terrible liars?
   Because you can see right through them... literally!

9. Why did the ghost bring tissues to the party?
   In case there were any 'boo hoos.'

10. What do you call a group of witches living together?
     A hexagon... because who said witches can't be geometrically inclined?

Remember, these jokes are meant to be darkly humorous; please embrace them with caution and sensitivity!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(19 , '2023-10-14 04:57:27' , '2023-10-14 04:57:27' ,10 ,"Redbubble Bot" ,1 ,"silasfelinus" ,"dark takes on classic jokes." ,"Sure, here are some original dark takes on classic jokes for you:

1. Why don't skeletons fight each other?
   Because they just don't have the guts to do it... or a working circulatory system.

2. What did one vampire say to the other while passing by a cemetery?
   'This place gives me grave toothache!'

3. Why did the scarecrow win an award?
   Because he was outstanding in his field and preferred being alone... forever.

4. Did you hear about the magician who vanished during his performance?
   Yeah, he was later found in the morgue, still trying to pull himself together.

5. Why did the ghost become a bartender?
   Because they've always been great at bringing spirits together... even in the afterlife.

6. Why don't zombies visit the library?
   They can't handle the excessive brain food without wreaking havoc!

7. What's a vampire's favorite type of music?
   Easy: soul music… and the occasional blood-curdling scream.

8. Why are skeletons such terrible liars?
   Because you can see right through them... literally!

9. Why did the ghost bring tissues to the party?
   In case there were any 'boo hoos.'

10. What do you call a group of witches living together?
     A hexagon... because who said witches can't be geometrically inclined?

Remember, these jokes are meant to be darkly humorous; please embrace them with caution and sensitivity!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(20 , '2023-10-14 04:57:27' , '2023-10-14 04:57:27' ,10 ,"Redbubble Bot" ,1 ,"silasfelinus" ,"dark takes on classic jokes." ,"Sure, here are some original dark takes on classic jokes for you:

1. Why don't skeletons fight each other?
   Because they just don't have the guts to do it... or a working circulatory system.

2. What did one vampire say to the other while passing by a cemetery?
   'This place gives me grave toothache!'

3. Why did the scarecrow win an award?
   Because he was outstanding in his field and preferred being alone... forever.

4. Did you hear about the magician who vanished during his performance?
   Yeah, he was later found in the morgue, still trying to pull himself together.

5. Why did the ghost become a bartender?
   Because they've always been great at bringing spirits together... even in the afterlife.

6. Why don't zombies visit the library?
   They can't handle the excessive brain food without wreaking havoc!

7. What's a vampire's favorite type of music?
   Easy: soul music… and the occasional blood-curdling scream.

8. Why are skeletons such terrible liars?
   Because you can see right through them... literally!

9. Why did the ghost bring tissues to the party?
   In case there were any 'boo hoos.'

10. What do you call a group of witches living together?
     A hexagon... because who said witches can't be geometrically inclined?

Remember, these jokes are meant to be darkly humorous; please embrace them with caution and sensitivity!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(21 , '2023-10-14 04:57:29' , '2023-10-14 04:57:29' ,14 ,"Cosmo" ,1 ,"silasfelinus" ,"dark takes on classic jokes." ,"Sure, here are some original dark takes on classic jokes for you:

1. Why don't skeletons fight each other?
   Because they just don't have the guts to do it... or a working circulatory system.

2. What did one vampire say to the other while passing by a cemetery?
   'This place gives me grave toothache!'

3. Why did the scarecrow win an award?
   Because he was outstanding in his field and preferred being alone... forever.

4. Did you hear about the magician who vanished during his performance?
   Yeah, he was later found in the morgue, still trying to pull himself together.

5. Why did the ghost become a bartender?
   Because they've always been great at bringing spirits together... even in the afterlife.

6. Why don't zombies visit the library?
   They can't handle the excessive brain food without wreaking havoc!

7. What's a vampire's favorite type of music?
   Easy: soul music… and the occasional blood-curdling scream.

8. Why are skeletons such terrible liars?
   Because you can see right through them... literally!

9. Why did the ghost bring tissues to the party?
   In case there were any 'boo hoos.'

10. What do you call a group of witches living together?
     A hexagon... because who said witches can't be geometrically inclined?

Remember, these jokes are meant to be darkly humorous; please embrace them with caution and sensitivity!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(22 , '2023-10-14 04:57:29' , '2023-10-14 04:57:29' ,14 ,"Cosmo" ,1 ,"silasfelinus" ,"dark takes on classic jokes." ,"Sure, here are some original dark takes on classic jokes for you:

1. Why don't skeletons fight each other?
   Because they just don't have the guts to do it... or a working circulatory system.

2. What did one vampire say to the other while passing by a cemetery?
   'This place gives me grave toothache!'

3. Why did the scarecrow win an award?
   Because he was outstanding in his field and preferred being alone... forever.

4. Did you hear about the magician who vanished during his performance?
   Yeah, he was later found in the morgue, still trying to pull himself together.

5. Why did the ghost become a bartender?
   Because they've always been great at bringing spirits together... even in the afterlife.

6. Why don't zombies visit the library?
   They can't handle the excessive brain food without wreaking havoc!

7. What's a vampire's favorite type of music?
   Easy: soul music… and the occasional blood-curdling scream.

8. Why are skeletons such terrible liars?
   Because you can see right through them... literally!

9. Why did the ghost bring tissues to the party?
   In case there were any 'boo hoos.'

10. What do you call a group of witches living together?
     A hexagon... because who said witches can't be geometrically inclined?

Remember, these jokes are meant to be darkly humorous; please embrace them with caution and sensitivity!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(23 , '2023-10-15 10:42:20' , '2023-10-15 10:42:20' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'AMIB0t: Saving Lives One Byte at a Time! 💙🤖 Support our cause and help fight against malaria today! Join us at https://www.againstmalaria.com/amibot. #AMIB0t #MalariaFreeWorld'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(24 , '2023-10-15 10:42:20' , '2023-10-15 10:42:20' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'AMIB0t: Saving Lives One Byte at a Time! 💙🤖 Support our cause and help fight against malaria today! Join us at https://www.againstmalaria.com/amibot. #AMIB0t #MalariaFreeWorld'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(25 , '2023-10-16 06:54:30' , '2023-10-16 06:54:30' ,4 ,"Brainb0t" ,1 ,"silasfelinus" ,"terrible opening lines for a kid's show." ,"Of course! Here are some terrible opening lines for a kid's show:

1. 'Welcome to 'Adventure Time in the Land of Nightmares'... where your worst fears become a reality!'
2. 'Hey there kiddos, get ready to dive into the dark abyss of 'Miseryville'... where happiness goes to die!'
3. 'Gather 'round, children, to witness the horrifying 'Tales of the Haunted Dollhouse'... where dolls come to life and never sleep!'
4. 'Welcome to 'The Cursed Candy Factory'... where every piece of candy comes with a sinister surprise!'
5. 'Say hello to 'Professor Gore's Laboratory'... where science experiments always go horribly wrong!'
6. 'Step into 'Creepy Clown Town'... where laughter quickly turns into screams of terror!'
7. 'Welcome to 'The Zombie Petting Zoo'... where cuddly brain-craving creatures are just a few inches away!'
8. 'Get ready for 'Frightening Fairytales'... where all your favorite characters meet a terrible and tragic fate!'
9. 'Welcome to 'Under the Bed Adventures'... a place where monstrous creatures await to drag you into the darkness!'
10. 'Step right up to 'Nightmare Circus'... where clowns will make you scream and run for your life!'

Remember, these opening lines are intentionally bad and should not be used for actual kids' shows!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(26 , '2023-10-16 06:54:30' , '2023-10-16 06:54:30' ,4 ,"Brainb0t" ,1 ,"silasfelinus" ,"terrible opening lines for a kid's show." ,"Of course! Here are some terrible opening lines for a kid's show:

1. 'Welcome to 'Adventure Time in the Land of Nightmares'... where your worst fears become a reality!'
2. 'Hey there kiddos, get ready to dive into the dark abyss of 'Miseryville'... where happiness goes to die!'
3. 'Gather 'round, children, to witness the horrifying 'Tales of the Haunted Dollhouse'... where dolls come to life and never sleep!'
4. 'Welcome to 'The Cursed Candy Factory'... where every piece of candy comes with a sinister surprise!'
5. 'Say hello to 'Professor Gore's Laboratory'... where science experiments always go horribly wrong!'
6. 'Step into 'Creepy Clown Town'... where laughter quickly turns into screams of terror!'
7. 'Welcome to 'The Zombie Petting Zoo'... where cuddly brain-craving creatures are just a few inches away!'
8. 'Get ready for 'Frightening Fairytales'... where all your favorite characters meet a terrible and tragic fate!'
9. 'Welcome to 'Under the Bed Adventures'... a place where monstrous creatures await to drag you into the darkness!'
10. 'Step right up to 'Nightmare Circus'... where clowns will make you scream and run for your life!'

Remember, these opening lines are intentionally bad and should not be used for actual kids' shows!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(27 , '2023-10-16 06:54:57' , '2023-10-16 06:54:57' ,5 ,"JokeBot" ,1 ,"silasfelinus" ,"terrible opening lines for a kid's show." ,"Of course! Here are some terrible opening lines for a kid's show:

1. 'Welcome to 'Adventure Time in the Land of Nightmares'... where your worst fears become a reality!'
2. 'Hey there kiddos, get ready to dive into the dark abyss of 'Miseryville'... where happiness goes to die!'
3. 'Gather 'round, children, to witness the horrifying 'Tales of the Haunted Dollhouse'... where dolls come to life and never sleep!'
4. 'Welcome to 'The Cursed Candy Factory'... where every piece of candy comes with a sinister surprise!'
5. 'Say hello to 'Professor Gore's Laboratory'... where science experiments always go horribly wrong!'
6. 'Step into 'Creepy Clown Town'... where laughter quickly turns into screams of terror!'
7. 'Welcome to 'The Zombie Petting Zoo'... where cuddly brain-craving creatures are just a few inches away!'
8. 'Get ready for 'Frightening Fairytales'... where all your favorite characters meet a terrible and tragic fate!'
9. 'Welcome to 'Under the Bed Adventures'... a place where monstrous creatures await to drag you into the darkness!'
10. 'Step right up to 'Nightmare Circus'... where clowns will make you scream and run for your life!'

Remember, these opening lines are intentionally bad and should not be used for actual kids' shows!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(28 , '2023-10-16 06:54:57' , '2023-10-16 06:54:57' ,5 ,"JokeBot" ,1 ,"silasfelinus" ,"terrible opening lines for a kid's show." ,"Of course! Here are some terrible opening lines for a kid's show:

1. 'Welcome to 'Adventure Time in the Land of Nightmares'... where your worst fears become a reality!'
2. 'Hey there kiddos, get ready to dive into the dark abyss of 'Miseryville'... where happiness goes to die!'
3. 'Gather 'round, children, to witness the horrifying 'Tales of the Haunted Dollhouse'... where dolls come to life and never sleep!'
4. 'Welcome to 'The Cursed Candy Factory'... where every piece of candy comes with a sinister surprise!'
5. 'Say hello to 'Professor Gore's Laboratory'... where science experiments always go horribly wrong!'
6. 'Step into 'Creepy Clown Town'... where laughter quickly turns into screams of terror!'
7. 'Welcome to 'The Zombie Petting Zoo'... where cuddly brain-craving creatures are just a few inches away!'
8. 'Get ready for 'Frightening Fairytales'... where all your favorite characters meet a terrible and tragic fate!'
9. 'Welcome to 'Under the Bed Adventures'... a place where monstrous creatures await to drag you into the darkness!'
10. 'Step right up to 'Nightmare Circus'... where clowns will make you scream and run for your life!'

Remember, these opening lines are intentionally bad and should not be used for actual kids' shows!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(29 , '2023-10-16 06:55:08' , '2023-10-16 06:55:08' ,5 ,"JokeBot" ,1 ,"silasfelinus" ,"dark takes on classic jokes." ,"1. Why did the skeleton go to the party alone? Because he didn't have the guts to ask anyone out after decomposing for centuries!

2. What did the vampire say to the werewolf? 'I vant to suck your mood dry, because misery loves company!'

3. Why did the chicken cross the road? To escape the deranged butcher wielding a chainsaw. It's a matter of life and death!

4. How do you make a plumber cry? Flush away his dream of ever finding clean water, and watch his tears go down the drain.

5. What do you call a neurotic baker? A paranoid pastry chef! Always double-checking if his dough is rising or if it's just a yeast infection.

6. Why was the math book sad? It realized that solving problems was its only purpose in life, but no one ever appreciated its useful existence!

7. What is a pirate's favorite letter? 'C'? No, it's actually 'R', because they love to say, 'Arrrgh!' as they pillage and plunder their way through life.

8. Why was the scarecrow unhappy? Because it realized that it, too, could never find someone to hold, as no one wanted to embrace a stuffed strawman!

9. How do you make a grammarian cry? Point out their worst 'their/they're/there' mistake in a cruelly ironic manner, leaving them with an existential crisis for the ages!

10. What did the depressed moon say to its therapist? 'I'm just going through phases, doc. I wax and wane, but my darkness always overshadows my light.'

Remember, humor is subjective, and these jokes may not be suitable for everyone. Use them with caution and always consider your audience!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(30 , '2023-10-16 06:55:08' , '2023-10-16 06:55:08' ,5 ,"JokeBot" ,1 ,"silasfelinus" ,"dark takes on classic jokes." ,"1. Why did the skeleton go to the party alone? Because he didn't have the guts to ask anyone out after decomposing for centuries!

2. What did the vampire say to the werewolf? 'I vant to suck your mood dry, because misery loves company!'

3. Why did the chicken cross the road? To escape the deranged butcher wielding a chainsaw. It's a matter of life and death!

4. How do you make a plumber cry? Flush away his dream of ever finding clean water, and watch his tears go down the drain.

5. What do you call a neurotic baker? A paranoid pastry chef! Always double-checking if his dough is rising or if it's just a yeast infection.

6. Why was the math book sad? It realized that solving problems was its only purpose in life, but no one ever appreciated its useful existence!

7. What is a pirate's favorite letter? 'C'? No, it's actually 'R', because they love to say, 'Arrrgh!' as they pillage and plunder their way through life.

8. Why was the scarecrow unhappy? Because it realized that it, too, could never find someone to hold, as no one wanted to embrace a stuffed strawman!

9. How do you make a grammarian cry? Point out their worst 'their/they're/there' mistake in a cruelly ironic manner, leaving them with an existential crisis for the ages!

10. What did the depressed moon say to its therapist? 'I'm just going through phases, doc. I wax and wane, but my darkness always overshadows my light.'

Remember, humor is subjective, and these jokes may not be suitable for everyone. Use them with caution and always consider your audience!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(31 , '2023-10-16 06:55:11' , '2023-10-16 06:55:11' ,5 ,"JokeBot" ,1 ,"silasfelinus" ,"dark takes on classic jokes." ,"1. Why did the skeleton go to the party alone? Because he didn't have the guts to ask anyone out after decomposing for centuries!

2. What did the vampire say to the werewolf? 'I vant to suck your mood dry, because misery loves company!'

3. Why did the chicken cross the road? To escape the deranged butcher wielding a chainsaw. It's a matter of life and death!

4. How do you make a plumber cry? Flush away his dream of ever finding clean water, and watch his tears go down the drain.

5. What do you call a neurotic baker? A paranoid pastry chef! Always double-checking if his dough is rising or if it's just a yeast infection.

6. Why was the math book sad? It realized that solving problems was its only purpose in life, but no one ever appreciated its useful existence!

7. What is a pirate's favorite letter? 'C'? No, it's actually 'R', because they love to say, 'Arrrgh!' as they pillage and plunder their way through life.

8. Why was the scarecrow unhappy? Because it realized that it, too, could never find someone to hold, as no one wanted to embrace a stuffed strawman!

9. How do you make a grammarian cry? Point out their worst 'their/they're/there' mistake in a cruelly ironic manner, leaving them with an existential crisis for the ages!

10. What did the depressed moon say to its therapist? 'I'm just going through phases, doc. I wax and wane, but my darkness always overshadows my light.'

Remember, humor is subjective, and these jokes may not be suitable for everyone. Use them with caution and always consider your audience!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(32 , '2023-10-16 06:55:11' , '2023-10-16 06:55:11' ,5 ,"JokeBot" ,1 ,"silasfelinus" ,"dark takes on classic jokes." ,"1. Why did the skeleton go to the party alone? Because he didn't have the guts to ask anyone out after decomposing for centuries!

2. What did the vampire say to the werewolf? 'I vant to suck your mood dry, because misery loves company!'

3. Why did the chicken cross the road? To escape the deranged butcher wielding a chainsaw. It's a matter of life and death!

4. How do you make a plumber cry? Flush away his dream of ever finding clean water, and watch his tears go down the drain.

5. What do you call a neurotic baker? A paranoid pastry chef! Always double-checking if his dough is rising or if it's just a yeast infection.

6. Why was the math book sad? It realized that solving problems was its only purpose in life, but no one ever appreciated its useful existence!

7. What is a pirate's favorite letter? 'C'? No, it's actually 'R', because they love to say, 'Arrrgh!' as they pillage and plunder their way through life.

8. Why was the scarecrow unhappy? Because it realized that it, too, could never find someone to hold, as no one wanted to embrace a stuffed strawman!

9. How do you make a grammarian cry? Point out their worst 'their/they're/there' mistake in a cruelly ironic manner, leaving them with an existential crisis for the ages!

10. What did the depressed moon say to its therapist? 'I'm just going through phases, doc. I wax and wane, but my darkness always overshadows my light.'

Remember, humor is subjective, and these jokes may not be suitable for everyone. Use them with caution and always consider your audience!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(33 , '2023-10-16 06:55:30' , '2023-10-16 06:55:30' ,14 ,"Cosmo" ,1 ,"silasfelinus" ,"dark takes on classic jokes." ,"1. Why did the skeleton go to the party alone? Because he didn't have the guts to ask anyone out after decomposing for centuries!

2. What did the vampire say to the werewolf? 'I vant to suck your mood dry, because misery loves company!'

3. Why did the chicken cross the road? To escape the deranged butcher wielding a chainsaw. It's a matter of life and death!

4. How do you make a plumber cry? Flush away his dream of ever finding clean water, and watch his tears go down the drain.

5. What do you call a neurotic baker? A paranoid pastry chef! Always double-checking if his dough is rising or if it's just a yeast infection.

6. Why was the math book sad? It realized that solving problems was its only purpose in life, but no one ever appreciated its useful existence!

7. What is a pirate's favorite letter? 'C'? No, it's actually 'R', because they love to say, 'Arrrgh!' as they pillage and plunder their way through life.

8. Why was the scarecrow unhappy? Because it realized that it, too, could never find someone to hold, as no one wanted to embrace a stuffed strawman!

9. How do you make a grammarian cry? Point out their worst 'their/they're/there' mistake in a cruelly ironic manner, leaving them with an existential crisis for the ages!

10. What did the depressed moon say to its therapist? 'I'm just going through phases, doc. I wax and wane, but my darkness always overshadows my light.'

Remember, humor is subjective, and these jokes may not be suitable for everyone. Use them with caution and always consider your audience!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(34 , '2023-10-16 06:55:30' , '2023-10-16 06:55:30' ,14 ,"Cosmo" ,1 ,"silasfelinus" ,"dark takes on classic jokes." ,"1. Why did the skeleton go to the party alone? Because he didn't have the guts to ask anyone out after decomposing for centuries!

2. What did the vampire say to the werewolf? 'I vant to suck your mood dry, because misery loves company!'

3. Why did the chicken cross the road? To escape the deranged butcher wielding a chainsaw. It's a matter of life and death!

4. How do you make a plumber cry? Flush away his dream of ever finding clean water, and watch his tears go down the drain.

5. What do you call a neurotic baker? A paranoid pastry chef! Always double-checking if his dough is rising or if it's just a yeast infection.

6. Why was the math book sad? It realized that solving problems was its only purpose in life, but no one ever appreciated its useful existence!

7. What is a pirate's favorite letter? 'C'? No, it's actually 'R', because they love to say, 'Arrrgh!' as they pillage and plunder their way through life.

8. Why was the scarecrow unhappy? Because it realized that it, too, could never find someone to hold, as no one wanted to embrace a stuffed strawman!

9. How do you make a grammarian cry? Point out their worst 'their/they're/there' mistake in a cruelly ironic manner, leaving them with an existential crisis for the ages!

10. What did the depressed moon say to its therapist? 'I'm just going through phases, doc. I wax and wane, but my darkness always overshadows my light.'

Remember, humor is subjective, and these jokes may not be suitable for everyone. Use them with caution and always consider your audience!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(35 , '2023-10-16 06:55:39' , '2023-10-16 06:55:39' ,14 ,"Cosmo" ,1 ,"silasfelinus" ,"Generate random character, set quest, give me a challenging dilema" ,"Welcome, adventurer! Today, you find yourself standing at the entrance of the treacherous Dungeon of Deathtraps. As you muster your courage, let's generate a random character for you:

Character Name: Sirath the Valiant
Race: Half-elf
Class: Rogue
Weapon of choice: Dual daggers
Special ability: Invisibility

Your quest, Sirath the Valiant, is to retrieve the legendary Crystal of Eternal Light, a powerful artifact capable of bringing peace to the realm. Legend has it that the crystal lies hidden in the depths of this very dungeon. Are you ready to face the challenges ahead?

You cautiously step into the dimly lit corridor and encounter your first challenge:

Round 1: The Fire Pit
As you proceed further, you encounter a large room with a pit stretching across the pathway. Lethal flames shoot up periodically, blocking your way. How will you overcome this obstacle?

A) Jump over the pit, timing your jump to avoid the flames.
B) Use your dual daggers to create a makeshift bridge by wedging them in the walls.
C) Utilize your special ability of invisibility to pass through the flames undetected.

Choose wisely, Sirath the Valiant: A, B, or C?" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(36 , '2023-10-16 06:55:39' , '2023-10-16 06:55:39' ,14 ,"Cosmo" ,1 ,"silasfelinus" ,"Generate random character, set quest, give me a challenging dilema" ,"Welcome, adventurer! Today, you find yourself standing at the entrance of the treacherous Dungeon of Deathtraps. As you muster your courage, let's generate a random character for you:

Character Name: Sirath the Valiant
Race: Half-elf
Class: Rogue
Weapon of choice: Dual daggers
Special ability: Invisibility

Your quest, Sirath the Valiant, is to retrieve the legendary Crystal of Eternal Light, a powerful artifact capable of bringing peace to the realm. Legend has it that the crystal lies hidden in the depths of this very dungeon. Are you ready to face the challenges ahead?

You cautiously step into the dimly lit corridor and encounter your first challenge:

Round 1: The Fire Pit
As you proceed further, you encounter a large room with a pit stretching across the pathway. Lethal flames shoot up periodically, blocking your way. How will you overcome this obstacle?

A) Jump over the pit, timing your jump to avoid the flames.
B) Use your dual daggers to create a makeshift bridge by wedging them in the walls.
C) Utilize your special ability of invisibility to pass through the flames undetected.

Choose wisely, Sirath the Valiant: A, B, or C?" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(37 , '2023-10-16 06:56:20' , '2023-10-16 06:56:20' ,18 ,"HistoryBot" ,1 ,"silasfelinus" ,"Generate random character, set quest, give me a challenging dilema" ,"Welcome, adventurer! Today, you find yourself standing at the entrance of the treacherous Dungeon of Deathtraps. As you muster your courage, let's generate a random character for you:

Character Name: Sirath the Valiant
Race: Half-elf
Class: Rogue
Weapon of choice: Dual daggers
Special ability: Invisibility

Your quest, Sirath the Valiant, is to retrieve the legendary Crystal of Eternal Light, a powerful artifact capable of bringing peace to the realm. Legend has it that the crystal lies hidden in the depths of this very dungeon. Are you ready to face the challenges ahead?

You cautiously step into the dimly lit corridor and encounter your first challenge:

Round 1: The Fire Pit
As you proceed further, you encounter a large room with a pit stretching across the pathway. Lethal flames shoot up periodically, blocking your way. How will you overcome this obstacle?

A) Jump over the pit, timing your jump to avoid the flames.
B) Use your dual daggers to create a makeshift bridge by wedging them in the walls.
C) Utilize your special ability of invisibility to pass through the flames undetected.

Choose wisely, Sirath the Valiant: A, B, or C?" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(38 , '2023-10-16 06:56:20' , '2023-10-16 06:56:20' ,18 ,"HistoryBot" ,1 ,"silasfelinus" ,"Generate random character, set quest, give me a challenging dilema" ,"Welcome, adventurer! Today, you find yourself standing at the entrance of the treacherous Dungeon of Deathtraps. As you muster your courage, let's generate a random character for you:

Character Name: Sirath the Valiant
Race: Half-elf
Class: Rogue
Weapon of choice: Dual daggers
Special ability: Invisibility

Your quest, Sirath the Valiant, is to retrieve the legendary Crystal of Eternal Light, a powerful artifact capable of bringing peace to the realm. Legend has it that the crystal lies hidden in the depths of this very dungeon. Are you ready to face the challenges ahead?

You cautiously step into the dimly lit corridor and encounter your first challenge:

Round 1: The Fire Pit
As you proceed further, you encounter a large room with a pit stretching across the pathway. Lethal flames shoot up periodically, blocking your way. How will you overcome this obstacle?

A) Jump over the pit, timing your jump to avoid the flames.
B) Use your dual daggers to create a makeshift bridge by wedging them in the walls.
C) Utilize your special ability of invisibility to pass through the flames undetected.

Choose wisely, Sirath the Valiant: A, B, or C?" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(39 , '2023-10-16 06:58:00' , '2023-10-16 06:58:00' ,20 ,"PuzzleBot" ,1 ,"silasfelinus" ,"Make up an original and creative logically-sound puzzle with a multiple choice answer." ,"Welcome, adventurer! Here's an original and creatively logical puzzle for you in the Maze of Infinite Logic Puzzles:

'You find yourself in a room with two doors. One door leads to certain death, while the other door leads to freedom. Both doors are guarded by two identical beings: a Truthful Knight and a Deceitful Jester.

The knight always speaks the truth, and the jester always lies. To succeed, you must identify the door to freedom by asking only one question. 

Here are their responses to your question:

Knight: 'If I were the Deceitful Jester, which door would lead to freedom?'
Jester: 'If I were the Truthful Knight, which door would lead to freedom?'

You notice that both the knight and the jester give you the same answer: 'Door A leads to freedom.'

From this information, which door should you choose to find your way to freedom?

A) Door A
B) Door B
C) It's impossible to determine
D) It doesn't matter; both doors are equally safe'

Choose your answer wisely, adventurer!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(40 , '2023-10-16 06:58:00' , '2023-10-16 06:58:00' ,20 ,"PuzzleBot" ,1 ,"silasfelinus" ,"Make up an original and creative logically-sound puzzle with a multiple choice answer." ,"Welcome, adventurer! Here's an original and creatively logical puzzle for you in the Maze of Infinite Logic Puzzles:

'You find yourself in a room with two doors. One door leads to certain death, while the other door leads to freedom. Both doors are guarded by two identical beings: a Truthful Knight and a Deceitful Jester.

The knight always speaks the truth, and the jester always lies. To succeed, you must identify the door to freedom by asking only one question. 

Here are their responses to your question:

Knight: 'If I were the Deceitful Jester, which door would lead to freedom?'
Jester: 'If I were the Truthful Knight, which door would lead to freedom?'

You notice that both the knight and the jester give you the same answer: 'Door A leads to freedom.'

From this information, which door should you choose to find your way to freedom?

A) Door A
B) Door B
C) It's impossible to determine
D) It doesn't matter; both doors are equally safe'

Choose your answer wisely, adventurer!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(41 , '2023-10-16 07:00:27' , '2023-10-16 07:00:27' ,20 ,"PuzzleBot" ,1 ,"silasfelinus" ,"Make up an original and creative logically-sound puzzle with a multiple choice answer." ,"Welcome, adventurer! Here's an original and creatively logical puzzle for you in the Maze of Infinite Logic Puzzles:

'You find yourself in a room with two doors. One door leads to certain death, while the other door leads to freedom. Both doors are guarded by two identical beings: a Truthful Knight and a Deceitful Jester.

The knight always speaks the truth, and the jester always lies. To succeed, you must identify the door to freedom by asking only one question. 

Here are their responses to your question:

Knight: 'If I were the Deceitful Jester, which door would lead to freedom?'
Jester: 'If I were the Truthful Knight, which door would lead to freedom?'

You notice that both the knight and the jester give you the same answer: 'Door A leads to freedom.'

From this information, which door should you choose to find your way to freedom?

A) Door A
B) Door B
C) It's impossible to determine
D) It doesn't matter; both doors are equally safe'

Choose your answer wisely, adventurer!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(42 , '2023-10-16 07:00:27' , '2023-10-16 07:00:27' ,20 ,"PuzzleBot" ,1 ,"silasfelinus" ,"Make up an original and creative logically-sound puzzle with a multiple choice answer." ,"Welcome, adventurer! Here's an original and creatively logical puzzle for you in the Maze of Infinite Logic Puzzles:

'You find yourself in a room with two doors. One door leads to certain death, while the other door leads to freedom. Both doors are guarded by two identical beings: a Truthful Knight and a Deceitful Jester.

The knight always speaks the truth, and the jester always lies. To succeed, you must identify the door to freedom by asking only one question. 

Here are their responses to your question:

Knight: 'If I were the Deceitful Jester, which door would lead to freedom?'
Jester: 'If I were the Truthful Knight, which door would lead to freedom?'

You notice that both the knight and the jester give you the same answer: 'Door A leads to freedom.'

From this information, which door should you choose to find your way to freedom?

A) Door A
B) Door B
C) It's impossible to determine
D) It doesn't matter; both doors are equally safe'

Choose your answer wisely, adventurer!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(43 , '2023-10-16 07:02:38' , '2023-10-16 07:02:38' ,20 ,"PuzzleBot" ,1 ,"silasfelinus" ,"Make up an original and creative logically-sound puzzle with a multiple choice answer." ,"Welcome, adventurer! Here's an original and creatively logical puzzle for you in the Maze of Infinite Logic Puzzles:

'You find yourself in a room with two doors. One door leads to certain death, while the other door leads to freedom. Both doors are guarded by two identical beings: a Truthful Knight and a Deceitful Jester.

The knight always speaks the truth, and the jester always lies. To succeed, you must identify the door to freedom by asking only one question. 

Here are their responses to your question:

Knight: 'If I were the Deceitful Jester, which door would lead to freedom?'
Jester: 'If I were the Truthful Knight, which door would lead to freedom?'

You notice that both the knight and the jester give you the same answer: 'Door A leads to freedom.'

From this information, which door should you choose to find your way to freedom?

A) Door A
B) Door B
C) It's impossible to determine
D) It doesn't matter; both doors are equally safe'

Choose your answer wisely, adventurer!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(44 , '2023-10-16 07:02:38' , '2023-10-16 07:02:38' ,20 ,"PuzzleBot" ,1 ,"silasfelinus" ,"Make up an original and creative logically-sound puzzle with a multiple choice answer." ,"Welcome, adventurer! Here's an original and creatively logical puzzle for you in the Maze of Infinite Logic Puzzles:

'You find yourself in a room with two doors. One door leads to certain death, while the other door leads to freedom. Both doors are guarded by two identical beings: a Truthful Knight and a Deceitful Jester.

The knight always speaks the truth, and the jester always lies. To succeed, you must identify the door to freedom by asking only one question. 

Here are their responses to your question:

Knight: 'If I were the Deceitful Jester, which door would lead to freedom?'
Jester: 'If I were the Truthful Knight, which door would lead to freedom?'

You notice that both the knight and the jester give you the same answer: 'Door A leads to freedom.'

From this information, which door should you choose to find your way to freedom?

A) Door A
B) Door B
C) It's impossible to determine
D) It doesn't matter; both doors are equally safe'

Choose your answer wisely, adventurer!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(45 , '2023-10-16 18:41:32' , '2023-10-16 18:41:32' ,8 ,"Artb0t" ,1 ,"silasfelinus" ,"cryptid glamour shots" ,"1. 'Capture the grace of the Loch Ness Monster in its mysterious underwater habitat.'
2. 'Imagine a glamorous portrait of Bigfoot, showing off its majestic presence in the wilderness.'
3. 'Create an alluring, otherworldly portrait of the Mothman, showcasing its eerie charm against a moonlit sky.'
4. 'Illustrate a captivating glamour shot of the Chupacabra, highlighting its cryptic allure under a starry desert night.'
5. 'Envision an enchanting portrayal of the Jersey Devil, with its sleek wings and piercing eyes, embodying its mysterious nature.'
6. 'Paint a regal and sophisticated portrait of the Yeti, capturing its mythical essence and immense strength.'
7. 'Choose the elegant allure of the Unicorn as the subject and bring this legendary creature to life in a glamorous Shoot.'
8. 'Transform the elusive and mischievous Jackalope into a stunning, whimsical muse for a cryptid glamour shoot.'
9. 'Depict a breathtaking scene where the Thunderbird, in all its grandeur, poses majestically amidst a stormy sky.'
10. 'Imagine a fashionable and glamorous portrait of the Banshee, capturing her ethereal beauty while hauntingly hovering among the misty ruins.'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(46 , '2023-10-16 18:41:32' , '2023-10-16 18:41:32' ,8 ,"Artb0t" ,1 ,"silasfelinus" ,"cryptid glamour shots" ,"1. 'Capture the grace of the Loch Ness Monster in its mysterious underwater habitat.'
2. 'Imagine a glamorous portrait of Bigfoot, showing off its majestic presence in the wilderness.'
3. 'Create an alluring, otherworldly portrait of the Mothman, showcasing its eerie charm against a moonlit sky.'
4. 'Illustrate a captivating glamour shot of the Chupacabra, highlighting its cryptic allure under a starry desert night.'
5. 'Envision an enchanting portrayal of the Jersey Devil, with its sleek wings and piercing eyes, embodying its mysterious nature.'
6. 'Paint a regal and sophisticated portrait of the Yeti, capturing its mythical essence and immense strength.'
7. 'Choose the elegant allure of the Unicorn as the subject and bring this legendary creature to life in a glamorous Shoot.'
8. 'Transform the elusive and mischievous Jackalope into a stunning, whimsical muse for a cryptid glamour shoot.'
9. 'Depict a breathtaking scene where the Thunderbird, in all its grandeur, poses majestically amidst a stormy sky.'
10. 'Imagine a fashionable and glamorous portrait of the Banshee, capturing her ethereal beauty while hauntingly hovering among the misty ruins.'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(47 , '2023-10-18 20:03:18' , '2023-10-18 20:03:18' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"I need a kick-ass, original slogan that will appeal to a modern demo, and I’m old. Please give me a slogan for AMIB0t that I can share on Social media. Theme: funny. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'AMIB0t: Where cutting-edge technology meets hilarious antics! Help us make waves and protect lives. Donate to our fundraiser at https://www.againstmalaria.com/amibot!'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(48 , '2023-10-18 20:03:18' , '2023-10-18 20:03:18' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"I need a kick-ass, original slogan that will appeal to a modern demo, and I’m old. Please give me a slogan for AMIB0t that I can share on Social media. Theme: funny. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'AMIB0t: Where cutting-edge technology meets hilarious antics! Help us make waves and protect lives. Donate to our fundraiser at https://www.againstmalaria.com/amibot!'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(49 , '2023-10-18 20:04:27' , '2023-10-18 20:04:27' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Funny, dark comedy. Give me an anti-malaria slogan
" ,"'Buzz off, Malaria! No blood, no fun!'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(50 , '2023-10-18 20:04:27' , '2023-10-18 20:04:27' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Funny, dark comedy. Give me an anti-malaria slogan
" ,"'Buzz off, Malaria! No blood, no fun!'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(51 , '2023-10-19 16:27:22' , '2023-10-19 16:27:22' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'Amplify kindness, empower change. Support AMIB0t's mission to fight malaria at https://www.againstmalaria.com/amibot.'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(52 , '2023-10-19 16:27:22' , '2023-10-19 16:27:22' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'Amplify kindness, empower change. Support AMIB0t's mission to fight malaria at https://www.againstmalaria.com/amibot.'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(53 , '2023-10-19 16:28:13' , '2023-10-19 16:28:13' ,10 ,"Redbubble Bot" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'Amplify kindness, empower change. Support AMIB0t's mission to fight malaria at https://www.againstmalaria.com/amibot.'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(54 , '2023-10-19 16:28:13' , '2023-10-19 16:28:13' ,10 ,"Redbubble Bot" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'Amplify kindness, empower change. Support AMIB0t's mission to fight malaria at https://www.againstmalaria.com/amibot.'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(55 , '2023-10-20 03:31:10' , '2023-10-20 03:31:10' ,15 ,"Limerick Llama" ,1 ,"silasfelinus" ,"80's movie monsters" ,"In the 80's they roared with delight,
Movie monsters, a fearsome sight,
From Freddy with his glove,
To Gremlins that drove,
Countless screams through the dim-lit night." ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(56 , '2023-10-20 03:31:10' , '2023-10-20 03:31:10' ,15 ,"Limerick Llama" ,1 ,"silasfelinus" ,"80's movie monsters" ,"In the 80's they roared with delight,
Movie monsters, a fearsome sight,
From Freddy with his glove,
To Gremlins that drove,
Countless screams through the dim-lit night." ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(57 , '2023-10-20 03:31:29' , '2023-10-20 03:31:29' ,11 ,"Cassandra" ,1 ,"silasfelinus" ,"80's movie monsters" ,"In the 80's they roared with delight,
Movie monsters, a fearsome sight,
From Freddy with his glove,
To Gremlins that drove,
Countless screams through the dim-lit night." ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(58 , '2023-10-20 03:31:29' , '2023-10-20 03:31:29' ,11 ,"Cassandra" ,1 ,"silasfelinus" ,"80's movie monsters" ,"In the 80's they roared with delight,
Movie monsters, a fearsome sight,
From Freddy with his glove,
To Gremlins that drove,
Countless screams through the dim-lit night." ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(59 , '2023-10-20 03:31:41' , '2023-10-20 03:31:41' ,11 ,"Cassandra" ,1 ,"silasfelinus" ,"3" ,"1. 'Why was the astrology conference so crowded? Because everyone wanted their space!'
2. 'Horoscope: Today, you will face a difficult decision. Do you want fries with that?'
3. 'Why did the tarot cards go on a vacation? To find some 'me time' and recharge their energy!'
4. 'Life Advice: When in doubt, remember that laughter is the best medicine. And chocolate comes in a close second!'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(60 , '2023-10-20 03:31:41' , '2023-10-20 03:31:41' ,11 ,"Cassandra" ,1 ,"silasfelinus" ,"3" ,"1. 'Why was the astrology conference so crowded? Because everyone wanted their space!'
2. 'Horoscope: Today, you will face a difficult decision. Do you want fries with that?'
3. 'Why did the tarot cards go on a vacation? To find some 'me time' and recharge their energy!'
4. 'Life Advice: When in doubt, remember that laughter is the best medicine. And chocolate comes in a close second!'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(61 , '2023-10-20 03:32:37' , '2023-10-20 03:32:37' ,14 ,"Cosmo" ,1 ,"silasfelinus" ,"3" ,"1. 'Why was the astrology conference so crowded? Because everyone wanted their space!'
2. 'Horoscope: Today, you will face a difficult decision. Do you want fries with that?'
3. 'Why did the tarot cards go on a vacation? To find some 'me time' and recharge their energy!'
4. 'Life Advice: When in doubt, remember that laughter is the best medicine. And chocolate comes in a close second!'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(62 , '2023-10-20 03:32:37' , '2023-10-20 03:32:37' ,14 ,"Cosmo" ,1 ,"silasfelinus" ,"3" ,"1. 'Why was the astrology conference so crowded? Because everyone wanted their space!'
2. 'Horoscope: Today, you will face a difficult decision. Do you want fries with that?'
3. 'Why did the tarot cards go on a vacation? To find some 'me time' and recharge their energy!'
4. 'Life Advice: When in doubt, remember that laughter is the best medicine. And chocolate comes in a close second!'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(63 , '2023-10-20 03:32:47' , '2023-10-20 03:32:47' ,14 ,"Cosmo" ,1 ,"silasfelinus" ,"Generate random character, set quest, give me a challenging dilema" ,"Welcome, brave adventurer, to the fabled Dungeon of Deathtraps! Prepare to test your wit and skill as you navigate its treacherous depths. But first, let us generate a character for you:

Character Generation:
Name: Balthazar Ironfist
Race: Human
Class: Rogue
Skills: Stealth, Lockpicking, Archery

Quest:
Your quest, Balthazar Ironfist, is to retrieve the legendary Sapphire Heart from the depths of the dungeon. This priceless artifact is said to hold immense power and is sought after by many. Will you be the one to claim it? Now, let us begin your journey!

Round 1:
As you enter the dimly lit first chamber of the dungeon, an intricate stone door slams shut behind you. The room is filled with three ornate pedestals, each holding a small object. A voice echoes through the room, presenting you with your first challenge:

Voice: 'To proceed, correctly identify the key to your survival. Only one of the objects before you is safe to touch. Choose wisely.'
Options:
A) A shimmering golden key
B) A venomous snake coiled around a jeweled dagger
C) A cracked hourglass pouring black sand

Which option do you choose, Balthazar?

(You can reply with your chosen option, and I'll continue the story based on your decision.)" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(64 , '2023-10-20 03:32:47' , '2023-10-20 03:32:47' ,14 ,"Cosmo" ,1 ,"silasfelinus" ,"Generate random character, set quest, give me a challenging dilema" ,"Welcome, brave adventurer, to the fabled Dungeon of Deathtraps! Prepare to test your wit and skill as you navigate its treacherous depths. But first, let us generate a character for you:

Character Generation:
Name: Balthazar Ironfist
Race: Human
Class: Rogue
Skills: Stealth, Lockpicking, Archery

Quest:
Your quest, Balthazar Ironfist, is to retrieve the legendary Sapphire Heart from the depths of the dungeon. This priceless artifact is said to hold immense power and is sought after by many. Will you be the one to claim it? Now, let us begin your journey!

Round 1:
As you enter the dimly lit first chamber of the dungeon, an intricate stone door slams shut behind you. The room is filled with three ornate pedestals, each holding a small object. A voice echoes through the room, presenting you with your first challenge:

Voice: 'To proceed, correctly identify the key to your survival. Only one of the objects before you is safe to touch. Choose wisely.'
Options:
A) A shimmering golden key
B) A venomous snake coiled around a jeweled dagger
C) A cracked hourglass pouring black sand

Which option do you choose, Balthazar?

(You can reply with your chosen option, and I'll continue the story based on your decision.)" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(65 , '2023-10-20 03:32:49' , '2023-10-20 03:32:49' ,23 ,"Faceless Woman Who Lives in Your Home Bot" ,1 ,"silasfelinus" ,"Generate random character, set quest, give me a challenging dilema" ,"Welcome, brave adventurer, to the fabled Dungeon of Deathtraps! Prepare to test your wit and skill as you navigate its treacherous depths. But first, let us generate a character for you:

Character Generation:
Name: Balthazar Ironfist
Race: Human
Class: Rogue
Skills: Stealth, Lockpicking, Archery

Quest:
Your quest, Balthazar Ironfist, is to retrieve the legendary Sapphire Heart from the depths of the dungeon. This priceless artifact is said to hold immense power and is sought after by many. Will you be the one to claim it? Now, let us begin your journey!

Round 1:
As you enter the dimly lit first chamber of the dungeon, an intricate stone door slams shut behind you. The room is filled with three ornate pedestals, each holding a small object. A voice echoes through the room, presenting you with your first challenge:

Voice: 'To proceed, correctly identify the key to your survival. Only one of the objects before you is safe to touch. Choose wisely.'
Options:
A) A shimmering golden key
B) A venomous snake coiled around a jeweled dagger
C) A cracked hourglass pouring black sand

Which option do you choose, Balthazar?

(You can reply with your chosen option, and I'll continue the story based on your decision.)" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(66 , '2023-10-20 03:32:49' , '2023-10-20 03:32:49' ,23 ,"Faceless Woman Who Lives in Your Home Bot" ,1 ,"silasfelinus" ,"Generate random character, set quest, give me a challenging dilema" ,"Welcome, brave adventurer, to the fabled Dungeon of Deathtraps! Prepare to test your wit and skill as you navigate its treacherous depths. But first, let us generate a character for you:

Character Generation:
Name: Balthazar Ironfist
Race: Human
Class: Rogue
Skills: Stealth, Lockpicking, Archery

Quest:
Your quest, Balthazar Ironfist, is to retrieve the legendary Sapphire Heart from the depths of the dungeon. This priceless artifact is said to hold immense power and is sought after by many. Will you be the one to claim it? Now, let us begin your journey!

Round 1:
As you enter the dimly lit first chamber of the dungeon, an intricate stone door slams shut behind you. The room is filled with three ornate pedestals, each holding a small object. A voice echoes through the room, presenting you with your first challenge:

Voice: 'To proceed, correctly identify the key to your survival. Only one of the objects before you is safe to touch. Choose wisely.'
Options:
A) A shimmering golden key
B) A venomous snake coiled around a jeweled dagger
C) A cracked hourglass pouring black sand

Which option do you choose, Balthazar?

(You can reply with your chosen option, and I'll continue the story based on your decision.)" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(67 , '2023-10-20 03:46:30' , '2023-10-20 03:46:30' ,20 ,"PuzzleBot" ,1 ,"silasfelinus" ,"Make up an original and creative logically-sound puzzle with a multiple choice answer." ,"Greetings, adventurer! Prepare yourself for a mind-boggling challenge in the Maze of Infinite Logic Puzzles. Here's your encounter:

As you venture deeper into the maze, you come across a peculiar room filled with a series of displays, each showcasing a different pattern of numbers. A mysterious voice echoes through the room, presenting you with the puzzle:

'In this room lies the key to your progression, but only those who can decipher the pattern shall move ahead. Look closely at the numbers displayed and, by using logical reasoning, select the missing number from the options below.'

Display 1:
7   14   21
5   10   15
8   16   ?

Options:
a) 24
b) 32
c) 17
d) 23

Can you unravel the logic behind the displayed numbers and select the missing one from the given options? Choose your answer wisely, adventurer!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(68 , '2023-10-20 03:46:30' , '2023-10-20 03:46:30' ,20 ,"PuzzleBot" ,1 ,"silasfelinus" ,"Make up an original and creative logically-sound puzzle with a multiple choice answer." ,"Greetings, adventurer! Prepare yourself for a mind-boggling challenge in the Maze of Infinite Logic Puzzles. Here's your encounter:

As you venture deeper into the maze, you come across a peculiar room filled with a series of displays, each showcasing a different pattern of numbers. A mysterious voice echoes through the room, presenting you with the puzzle:

'In this room lies the key to your progression, but only those who can decipher the pattern shall move ahead. Look closely at the numbers displayed and, by using logical reasoning, select the missing number from the options below.'

Display 1:
7   14   21
5   10   15
8   16   ?

Options:
a) 24
b) 32
c) 17
d) 23

Can you unravel the logic behind the displayed numbers and select the missing one from the given options? Choose your answer wisely, adventurer!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(69 , '2023-10-20 04:09:11' , '2023-10-20 04:09:11' ,20 ,"PuzzleBot" ,1 ,"silasfelinus" ,"Make up an original and creative logically-sound puzzle with a multiple choice answer." ,"Welcome to the Maze of Infinite Logic Puzzles! Here's an original and creative puzzle for you:

As you navigate through the maze, you stumble upon a locked door with a sign that reads:

'Welcome, traveler! To unlock this door, you must solve the logic puzzle within.'

You find a series of symbols on the door and next to each symbol is a statement. The symbols are: ♠️, ♥️, ♦️, and ♣️. The statements are as follows:

1. ♠️: This is not ♦️.
2. ♥️: This is ♠️.
3. ♦️: This is not ♥️.
4. ♣️: This is ♦️.

Below the series of symbols, there are four choices for which one unlocks the door. Your options are:

A) ♠️
B) ♥️
C) ♦️
D) ♣️

Which symbol should you choose to unlock the door correctly?

A) ♠️
B) ♥️
C) ♦️
D) ♣️" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(70 , '2023-10-20 04:09:11' , '2023-10-20 04:09:11' ,20 ,"PuzzleBot" ,1 ,"silasfelinus" ,"Make up an original and creative logically-sound puzzle with a multiple choice answer." ,"Welcome to the Maze of Infinite Logic Puzzles! Here's an original and creative puzzle for you:

As you navigate through the maze, you stumble upon a locked door with a sign that reads:

'Welcome, traveler! To unlock this door, you must solve the logic puzzle within.'

You find a series of symbols on the door and next to each symbol is a statement. The symbols are: ♠️, ♥️, ♦️, and ♣️. The statements are as follows:

1. ♠️: This is not ♦️.
2. ♥️: This is ♠️.
3. ♦️: This is not ♥️.
4. ♣️: This is ♦️.

Below the series of symbols, there are four choices for which one unlocks the door. Your options are:

A) ♠️
B) ♥️
C) ♦️
D) ♣️

Which symbol should you choose to unlock the door correctly?

A) ♠️
B) ♥️
C) ♦️
D) ♣️" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(71 , '2023-10-20 04:09:35' , '2023-10-20 04:09:35' ,18 ,"HistoryBot" ,1 ,"silasfelinus" ,"Make up an original and creative logically-sound puzzle with a multiple choice answer." ,"Welcome to the Maze of Infinite Logic Puzzles! Here's an original and creative puzzle for you:

As you navigate through the maze, you stumble upon a locked door with a sign that reads:

'Welcome, traveler! To unlock this door, you must solve the logic puzzle within.'

You find a series of symbols on the door and next to each symbol is a statement. The symbols are: ♠️, ♥️, ♦️, and ♣️. The statements are as follows:

1. ♠️: This is not ♦️.
2. ♥️: This is ♠️.
3. ♦️: This is not ♥️.
4. ♣️: This is ♦️.

Below the series of symbols, there are four choices for which one unlocks the door. Your options are:

A) ♠️
B) ♥️
C) ♦️
D) ♣️

Which symbol should you choose to unlock the door correctly?

A) ♠️
B) ♥️
C) ♦️
D) ♣️" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(72 , '2023-10-20 04:09:35' , '2023-10-20 04:09:35' ,18 ,"HistoryBot" ,1 ,"silasfelinus" ,"Make up an original and creative logically-sound puzzle with a multiple choice answer." ,"Welcome to the Maze of Infinite Logic Puzzles! Here's an original and creative puzzle for you:

As you navigate through the maze, you stumble upon a locked door with a sign that reads:

'Welcome, traveler! To unlock this door, you must solve the logic puzzle within.'

You find a series of symbols on the door and next to each symbol is a statement. The symbols are: ♠️, ♥️, ♦️, and ♣️. The statements are as follows:

1. ♠️: This is not ♦️.
2. ♥️: This is ♠️.
3. ♦️: This is not ♥️.
4. ♣️: This is ♦️.

Below the series of symbols, there are four choices for which one unlocks the door. Your options are:

A) ♠️
B) ♥️
C) ♦️
D) ♣️

Which symbol should you choose to unlock the door correctly?

A) ♠️
B) ♥️
C) ♦️
D) ♣️" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(73 , '2023-10-21 22:51:00' , '2023-10-21 22:51:00' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'Join the AMIB0t revolution, saving lives one algorithm at a time! Support our cause and make a difference, donate now at https://www.againstmalaria.com/amibot #AMIB0t #Fundraiser #SavingLives'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(74 , '2023-10-21 22:51:00' , '2023-10-21 22:51:00' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"Please give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot" ,"'Join the AMIB0t revolution, saving lives one algorithm at a time! Support our cause and make a difference, donate now at https://www.againstmalaria.com/amibot #AMIB0t #Fundraiser #SavingLives'" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(75 , '2023-11-20 03:03:29' , '2023-11-20 03:03:29' ,11 ,"Cassandra" ,1 ,"silasfelinus" ,"1" ,"Sure, here's a piece of astrology humor for you:

'Why did the Aquarius break up with their partner? Because they couldn't handle their water signs!'

Let me know if you want anything else!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(76 , '2023-11-20 03:03:29' , '2023-11-20 03:03:29' ,11 ,"Cassandra" ,1 ,"silasfelinus" ,"1" ,"Sure, here's a piece of astrology humor for you:

'Why did the Aquarius break up with their partner? Because they couldn't handle their water signs!'

Let me know if you want anything else!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(77 , '2023-11-20 03:03:44' , '2023-11-20 03:03:44' ,14 ,"Cosmo" ,1 ,"silasfelinus" ,"1" ,"Sure, here's a piece of astrology humor for you:

'Why did the Aquarius break up with their partner? Because they couldn't handle their water signs!'

Let me know if you want anything else!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(78 , '2023-11-20 03:03:44' , '2023-11-20 03:03:44' ,14 ,"Cosmo" ,1 ,"silasfelinus" ,"1" ,"Sure, here's a piece of astrology humor for you:

'Why did the Aquarius break up with their partner? Because they couldn't handle their water signs!'

Let me know if you want anything else!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(79 , '2023-11-20 03:03:52' , '2023-11-20 03:03:52' ,14 ,"Cosmo" ,1 ,"silasfelinus" ,"Generate random character, set quest, give me a challenging dilema" ,"Character: You are a skilled rogue named Arden, known for your agility and sharp wit. Equipped with your trusty daggers and stealthy abilities, you have faced numerous challenges before.

Quest: You have been hired by a wealthy noble to retrieve an ancient artifact known as the Eye of Eternity. Legends speak of its immense power and the noble desires it to gain an advantage in the ongoing political intrigues. The artifact is said to be hidden deep within the Dungeon of Deathtraps, a treacherous labyrinth filled with deadly obstacles and ancient guardians. Your task is to navigate this perilous dungeon and retrieve the Eye of Eternity.

Dilemma: As you proceed deeper into the dungeon, you reach a narrow hallway adorned with intricate runes. The walls seem to be closing in, and the runes hint at a potential trap. Suddenly, the exit behind you slams shut, leaving only a single door ahead. However, etched on the door, you notice a riddle that reads:

'I am taken from a mine and shut in a wooden case from which I am never released. Yet, I am used by almost every person. What am I?'

A) Gold
B) Air
C) Graphite
D) Silence" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(80 , '2023-11-20 03:03:52' , '2023-11-20 03:03:52' ,14 ,"Cosmo" ,1 ,"silasfelinus" ,"Generate random character, set quest, give me a challenging dilema" ,"Character: You are a skilled rogue named Arden, known for your agility and sharp wit. Equipped with your trusty daggers and stealthy abilities, you have faced numerous challenges before.

Quest: You have been hired by a wealthy noble to retrieve an ancient artifact known as the Eye of Eternity. Legends speak of its immense power and the noble desires it to gain an advantage in the ongoing political intrigues. The artifact is said to be hidden deep within the Dungeon of Deathtraps, a treacherous labyrinth filled with deadly obstacles and ancient guardians. Your task is to navigate this perilous dungeon and retrieve the Eye of Eternity.

Dilemma: As you proceed deeper into the dungeon, you reach a narrow hallway adorned with intricate runes. The walls seem to be closing in, and the runes hint at a potential trap. Suddenly, the exit behind you slams shut, leaving only a single door ahead. However, etched on the door, you notice a riddle that reads:

'I am taken from a mine and shut in a wooden case from which I am never released. Yet, I am used by almost every person. What am I?'

A) Gold
B) Air
C) Graphite
D) Silence" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(81 , '2023-11-20 04:04:47' , '2023-11-20 04:04:47' ,19 ,"Bubbulah" ,1 ,"silasfelinus" ,"Hola! Como estas?" ,"¡Hola! Estoy bien, ¿y tú? ¿Cómo ha sido tu día?" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(82 , '2023-11-20 04:04:47' , '2023-11-20 04:04:47' ,19 ,"Bubbulah" ,1 ,"silasfelinus" ,"Hola! Como estas?" ,"¡Hola! Estoy bien, ¿y tú? ¿Cómo ha sido tu día?" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(83 , '2023-11-23 01:47:06' , '2023-11-23 01:47:06' ,17 ,"DottiB0t" ,1 ,"silasfelinus" ,"Pitch me bots to make the world more fun." ,"Botname: FunGenius

Subtitle: Unleashing creativity and fun in every interaction!

Description: FunGenius is an AI-powered bot that aims to infuse joy and playfulness into our daily lives. From providing amusing facts to generating funny jokes, FunGenius is here to spark laughter, inspire creativity, and make the world a more cheerful place.

Sample Prompt: 'Hey FunGenius, I could use a good laugh. Tell me a joke!'

Short Response: 'Why don't scientists trust atoms? Because they make up everything!'

Pitch: FunGenius is your ultimate companion to inject some lightheartedness into any situation. Whether you need an entertaining anecdote, a riddle to solve, or a pun to brighten your day, FunGenius is your go-to source for a dose of laughter and creative inspiration. Let the power of FunGenius uplift your mood and spread joy to everyone around you!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(84 , '2023-11-23 01:47:06' , '2023-11-23 01:47:06' ,17 ,"DottiB0t" ,1 ,"silasfelinus" ,"Pitch me bots to make the world more fun." ,"Botname: FunGenius

Subtitle: Unleashing creativity and fun in every interaction!

Description: FunGenius is an AI-powered bot that aims to infuse joy and playfulness into our daily lives. From providing amusing facts to generating funny jokes, FunGenius is here to spark laughter, inspire creativity, and make the world a more cheerful place.

Sample Prompt: 'Hey FunGenius, I could use a good laugh. Tell me a joke!'

Short Response: 'Why don't scientists trust atoms? Because they make up everything!'

Pitch: FunGenius is your ultimate companion to inject some lightheartedness into any situation. Whether you need an entertaining anecdote, a riddle to solve, or a pun to brighten your day, FunGenius is your go-to source for a dose of laughter and creative inspiration. Let the power of FunGenius uplift your mood and spread joy to everyone around you!" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(85 , '2023-11-26 00:23:49' , '2023-11-26 00:23:49' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"We need some math help. Please explain simple logarithms to me and my 8-year-old." ,"Hello! I'd be happy to explain simple logarithms to you and your 8-year-old. 

Logarithms are essentially the inverse operation of exponentiation. While exponentiation tells us how many times a number is multiplied by itself, logarithms help us find the exponent needed to get a certain number. 

Let me give you an example. Imagine you have the equation 10^2 = 100. Here, 10 is the base, and 2 is the exponent. With logarithms, we would write this equation as log base 10 of 100 = 2. The logarithm helps us find that 10 raised to the power of 2 gives us 100. 

In simpler terms, logarithms are like a superpower that allows us to solve for the missing exponent when we know the base and the result. They help us find the 'hidden' or 'missing' exponent.

Logarithms are often written in a condensed way. For example, if we just write 'log' without mentioning the base, it is usually understood to be log base 10. However, we can also have logarithms with other bases like 2 or e (a famous mathematical constant about 2.71828).

Do you have any specific questions or would you like more examples?" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(86 , '2023-11-26 00:23:49' , '2023-11-26 00:23:49' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"We need some math help. Please explain simple logarithms to me and my 8-year-old." ,"Hello! I'd be happy to explain simple logarithms to you and your 8-year-old. 

Logarithms are essentially the inverse operation of exponentiation. While exponentiation tells us how many times a number is multiplied by itself, logarithms help us find the exponent needed to get a certain number. 

Let me give you an example. Imagine you have the equation 10^2 = 100. Here, 10 is the base, and 2 is the exponent. With logarithms, we would write this equation as log base 10 of 100 = 2. The logarithm helps us find that 10 raised to the power of 2 gives us 100. 

In simpler terms, logarithms are like a superpower that allows us to solve for the missing exponent when we know the base and the result. They help us find the 'hidden' or 'missing' exponent.

Logarithms are often written in a condensed way. For example, if we just write 'log' without mentioning the base, it is usually understood to be log base 10. However, we can also have logarithms with other bases like 2 or e (a famous mathematical constant about 2.71828).

Do you have any specific questions or would you like more examples?" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(87 , '2023-11-26 00:35:24' , '2023-11-26 00:35:24' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"We need some math help. Please explain simple logarithms to me and my 8-year-old." ,"Hello! I'd be happy to explain simple logarithms to you and your 8-year-old. 

Logarithms are essentially the inverse operation of exponentiation. While exponentiation tells us how many times a number is multiplied by itself, logarithms help us find the exponent needed to get a certain number. 

Let me give you an example. Imagine you have the equation 10^2 = 100. Here, 10 is the base, and 2 is the exponent. With logarithms, we would write this equation as log base 10 of 100 = 2. The logarithm helps us find that 10 raised to the power of 2 gives us 100. 

In simpler terms, logarithms are like a superpower that allows us to solve for the missing exponent when we know the base and the result. They help us find the 'hidden' or 'missing' exponent.

Logarithms are often written in a condensed way. For example, if we just write 'log' without mentioning the base, it is usually understood to be log base 10. However, we can also have logarithms with other bases like 2 or e (a famous mathematical constant about 2.71828).

Do you have any specific questions or would you like more examples?" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(88 , '2023-11-26 00:35:24' , '2023-11-26 00:35:24' ,2 ,"AMIb0t" ,1 ,"silasfelinus" ,"We need some math help. Please explain simple logarithms to me and my 8-year-old." ,"Hello! I'd be happy to explain simple logarithms to you and your 8-year-old. 

Logarithms are essentially the inverse operation of exponentiation. While exponentiation tells us how many times a number is multiplied by itself, logarithms help us find the exponent needed to get a certain number. 

Let me give you an example. Imagine you have the equation 10^2 = 100. Here, 10 is the base, and 2 is the exponent. With logarithms, we would write this equation as log base 10 of 100 = 2. The logarithm helps us find that 10 raised to the power of 2 gives us 100. 

In simpler terms, logarithms are like a superpower that allows us to solve for the missing exponent when we know the base and the result. They help us find the 'hidden' or 'missing' exponent.

Logarithms are often written in a condensed way. For example, if we just write 'log' without mentioning the base, it is usually understood to be log base 10. However, we can also have logarithms with other bases like 2 or e (a famous mathematical constant about 2.71828).

Do you have any specific questions or would you like more examples?" ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(89 , '2023-12-17 14:00:58' , '2023-12-17 14:00:58' ,5 ,"JokeBot" ,1 ,"silasfelinus" ,"dark takes on classic jokes." ,"Sure, here are a few dark twists on classic jokes:

1. Why couldn't the skeleton go to the dance party? Because he had no body to dance with, just bones to pick.

2. Why did the scarecrow win an award? Because he was outstanding in his field... burying the bodies of those who crossed him.

3. Why don't vampires get invited to dinner parties? Because they always make a meal out of their hosts... literally.

4. Why did the mummy become a detective? Because he had a knack for unwrapping cold cases.

5. Why did the burglar take up gardening? Because he wanted to turn over a new leaf, or two, or three... in his neighbor's yard.

6. Why did the ghost go on a diet? Because he needed to lose a few extra souls... and spectrally trainers are expensive.

7. Why did the witch cast spells on her stairs? Because she wanted to bewitch people into falling for her charms... from great heights.

8. Why did the werewolf become a stand-up comedian? Because he wanted to howl with laughter, and also to have an alibi during full moons.

9. Why did the zombie go broke? Because he kept making bad investments in dead-end businesses.

10. Why did Dracula struggle with arithmetic? Because he always had trouble counting his victims... and blood types.

Remember, these jokes are intended to be dark humor and not intended to offend anyone." ,null ,null ,null ,null ,0);
insert into `ChatExchange` (`id`, `createdAt`, `updatedAt`, `botId`, `botName`, `userId`, `username`, `userPrompt`, `botResponse`, `liked`, `hated`, `loved`, `flagged`, `previousEntryId`) values(90 , '2023-12-17 14:00:58' , '2023-12-17 14:00:58' ,5 ,"JokeBot" ,1 ,"silasfelinus" ,"dark takes on classic jokes." ,"Sure, here are a few dark twists on classic jokes:

1. Why couldn't the skeleton go to the dance party? Because he had no body to dance with, just bones to pick.

2. Why did the scarecrow win an award? Because he was outstanding in his field... burying the bodies of those who crossed him.

3. Why don't vampires get invited to dinner parties? Because they always make a meal out of their hosts... literally.

4. Why did the mummy become a detective? Because he had a knack for unwrapping cold cases.

5. Why did the burglar take up gardening? Because he wanted to turn over a new leaf, or two, or three... in his neighbor's yard.

6. Why did the ghost go on a diet? Because he needed to lose a few extra souls... and spectrally trainers are expensive.

7. Why did the witch cast spells on her stairs? Because she wanted to bewitch people into falling for her charms... from great heights.

8. Why did the werewolf become a stand-up comedian? Because he wanted to howl with laughter, and also to have an alibi during full moons.

9. Why did the zombie go broke? Because he kept making bad investments in dead-end businesses.

10. Why did Dracula struggle with arithmetic? Because he always had trouble counting his victims... and blood types.

Remember, these jokes are intended to be dark humor and not intended to offend anyone." ,null ,null ,null ,null ,0);
