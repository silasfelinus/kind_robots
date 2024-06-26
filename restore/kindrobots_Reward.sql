
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

DROP TABLE IF EXISTS`Reward`;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `Reward` (
  `id` int not null auto_increment  ,
  `createdAt` datetime  not null ,
  `updatedAt` datetime  ,
  `icon` varchar(764)  not null ,
  `text` varchar(764)  not null ,
  `power` varchar(764)  not null ,
  `collection` varchar(764)  not null ,
  `rarity` int not null  default 0,
  `label` varchar(764)   default NULL,Primary key(`id`)
 )ENGINE=innodb COLLATE=utf8mb4_unicode_ci;
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(1 , '2023-09-01 06:54:04' , '2023-09-01 06:58:29' ,"💰" ,"Bag of Endless Gold" ,"Never run out of currency for in-game purchases." ,"genesis" ,50 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(2 , '2023-09-01 06:54:04' , '2023-09-01 06:58:29' ,"▶️" ,"Play Button" ,"Skip a challenging puzzle or obstacle." ,"genesis" ,50 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(3 , '2023-09-01 06:55:34' , '2023-09-01 06:58:34' ,"❤️" ,"Heart of Compassion" ,"Heal yourself or a friend to full health." ,"genesis" ,50 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(33 , '2023-09-01 07:10:51' , '2023-09-01 07:10:51' ,"🦋" ,"Ephemeral Butterfly" ,"Grants you the ability to understand animals for one day." ,"genesis" ,50 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(34 , '2023-09-01 07:10:51' , '2023-09-01 07:10:51' ,"🎵" ,"Melodic Note" ,"Play a tune to unlock hidden doors and pathways." ,"genesis" ,50 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(35 , '2023-09-01 07:10:51' , '2023-09-01 07:10:51' ,"🤖" ,"Friendly Robot" ,"A mechanical companion that can solve any math puzzle for you." ,"genesis" ,50 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(36 , '2023-09-01 07:10:51' , '2023-09-01 07:10:51' ,"🌐" ,"Globe of Unity" ,"Instantly learn and speak any language fluently for 24 hours." ,"genesis" ,50 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(37 , '2023-09-01 07:10:51' , '2023-09-01 07:10:51' ,"👥" ,"Community Emblem" ,"Summon a helpful NPC to aid you in your quest." ,"genesis" ,50 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(38 , '2023-09-01 07:10:51' , '2023-09-01 07:10:51' ,"🤝" ,"Handshake of Trust" ,"Win over any NPC to your side, no matter their initial disposition." ,"genesis" ,50 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(39 , '2023-09-01 07:10:51' , '2023-09-01 07:10:51' ,"🔬" ,"Microscope of Insight" ,"Reveal hidden details and clues in your environment." ,"genesis" ,50 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(40 , '2023-09-01 07:43:41' , '2023-09-01 07:43:41' ,"mdi:alien" ,"Alien Communicator" ,"Speak with extraterrestrials and maybe even summon a UFO." ,"weird" ,40 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(41 , '2023-09-01 07:43:41' , '2023-09-01 07:43:41' ,"mdi:flask-empty" ,"Potion of Randomness" ,"Drink to experience a completely unpredictable effect." ,"weird" ,60 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(42 , '2023-09-01 07:43:41' , '2023-09-01 07:43:41' ,"mdi:clock-time-four-outline" ,"Time-Loop Pocket Watch" ,"Rewind time by 5 minutes, but only once." ,"weird" ,30 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(43 , '2023-09-01 07:43:41' , '2023-09-01 07:43:41' ,"mdi:thought-bubble-outline" ,"Dreamcatcher Hat" ,"Capture and interact with your dreams." ,"weird" ,50 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(44 , '2023-09-01 07:43:41' , '2023-09-01 07:43:41' ,"mdi:cat" ,"Schrodinger's Box" ,"Open the box to find out if you gain a life or lose one." ,"weird" ,20 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(45 , '2023-09-01 07:43:41' , '2023-09-01 07:43:41' ,"mdi:pine-tree" ,"Infinite Acorn" ,"Plant it to grow a tree that reaches into another dimension." ,"weird" ,45 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(46 , '2023-09-01 07:43:41' , '2023-09-01 07:43:41' ,"mdi:book-open-page-variant" ,"Book of Unwritten Stories" ,"Read to enter a story where you're the protagonist, but you can't predict the plot." ,"weird" ,55 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(47 , '2023-09-01 07:43:41' , '2023-09-01 07:43:41' ,"mdi:weather-lightning" ,"Thundercloud in a Jar" ,"Release to cause a localized storm, complete with lightning." ,"weird" ,35 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(48 , '2023-09-01 07:43:41' , '2023-09-01 07:43:41' ,"mdi:human-handsdown" ,"Gravity-Reversing Gloves" ,"Flip gravity for yourself for a short period." ,"weird" ,25 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(49 , '2023-09-01 07:43:41' , '2023-09-01 07:43:41' ,"mdi:boombox" ,"Reality Distortion Boombox" ,"Play a tune to temporarily alter the laws of physics." ,"weird" ,70 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(50 , '2023-09-01 15:14:26' , '2023-09-01 15:14:26' ,"mdi:shield" ,"Impenetrable Cape" ,"Block any physical attack once per day." ,"capes and cowls" ,40 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(51 , '2023-09-01 15:14:26' , '2023-09-01 15:14:26' ,"mdi:eye" ,"Cowl of Perception" ,"See through walls for 10 seconds." ,"capes and cowls" ,50 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(52 , '2023-09-01 15:14:26' , '2023-09-01 15:14:26' ,"mdi:flash" ,"Speedster's Boots" ,"Run at super speed for a short burst." ,"capes and cowls" ,60 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(53 , '2023-09-01 15:14:26' , '2023-09-01 15:14:26' ,"mdi:hand" ,"Gloves of Strength" ,"Lift heavy objects effortlessly." ,"capes and cowls" ,55 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(54 , '2023-09-01 15:14:26' , '2023-09-01 15:14:26' ,"mdi:feather" ,"Wings of Flight" ,"Fly for up to 5 minutes." ,"capes and cowls" ,45 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(55 , '2023-09-01 15:14:26' , '2023-09-01 15:14:26' ,"mdi:fire" ,"Flame-Resistant Suit" ,"Become immune to fire damage." ,"capes and cowls" ,35 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(56 , '2023-09-01 15:14:26' , '2023-09-01 15:14:26' ,"mdi:lock" ,"Utility Belt" ,"Access a random useful gadget." ,"capes and cowls" ,70 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(57 , '2023-09-01 15:14:26' , '2023-09-01 15:14:26' ,"mdi:heart" ,"Healing Emblem" ,"Instantly heal minor injuries." ,"capes and cowls" ,65 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(58 , '2023-09-01 15:14:26' , '2023-09-01 15:14:26' ,"mdi:bullhorn" ,"Voice Amplifier" ,"Your voice can be heard clearly in a 1-mile radius." ,"capes and cowls" ,30 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(59 , '2023-09-01 15:14:26' , '2023-09-01 15:14:26' ,"mdi:account" ,"Identity Mask" ,"Conceal your true identity from anyone." ,"capes and cowls" ,50 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(60 , '2023-09-01 15:14:26' , '2023-09-01 15:14:26' ,"mdi:web" ,"Web-Slinger" ,"Shoot webs to swing between buildings." ,"capes and cowls" ,40 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(61 , '2023-09-01 15:14:26' , '2023-09-01 15:14:26' ,"mdi:fish" ,"Aqua Breather" ,"Breathe underwater indefinitely." ,"capes and cowls" ,25 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(62 , '2023-09-01 15:14:26' , '2023-09-01 15:14:26' ,"mdi:magnify" ,"Detective's Lens" ,"Instantly analyze a crime scene." ,"capes and cowls" ,60 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(63 , '2023-09-01 15:14:26' , '2023-09-01 15:14:26' ,"mdi:star" ,"Cosmic Shield" ,"Deflect energy-based attacks." ,"capes and cowls" ,20 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(64 , '2023-09-01 15:14:26' , '2023-09-01 15:14:26' ,"mdi:thought-bubble" ,"Telepathic Tiara" ,"Read the thoughts of one person for 10 seconds." ,"capes and cowls" ,15 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(75 , '2023-09-02 19:47:54' , '2023-09-02 19:47:54' ,"fluent-emoji-high-contrast:ring" ,"Dr. Eliza Dolittle's Ring" ,"Let's you talk to animals" ,"genesis" ,15 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(76 , '2023-09-23 04:39:57' , '2023-09-23 04:39:57' ,"☕" ,"coffee" ,"doubles speed" ,"genesis" ,30 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(77 , '2023-10-03 05:30:29' ,null ,"🦋" ,"you turn in to butterfly" ,"game ends and you rome the land being a butterfly" ,"genesis" ,50 ,null);
insert into `Reward` (`id`, `createdAt`, `updatedAt`, `icon`, `text`, `power`, `collection`, `rarity`, `label`) values(78 , '2023-10-03 05:30:31' ,null ,"🦋" ,"you turn in to butterfly" ,"game ends and you rome the land being a butterfly" ,"genesis" ,50 ,null);
