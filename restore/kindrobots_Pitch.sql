
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

DROP TABLE IF EXISTS`Pitch`;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `Pitch` (
  `id` int not null auto_increment  ,
  `createdAt` datetime  not null ,
  `updatedAt` datetime  ,
  `title` varchar(764)  not null ,
  `pitch` varchar(764)  not null ,
  `userId` int not null  default 0,
  `isPublic` tinyint not null  default 0,
  `claps` int not null  default 0,
  `boos` int not null  default 0,
  `channelId` int  default 0,
  `designer` varchar(764)  not null ,
  `flavorText` varchar(764)   default NULL,
  `isOrphan` tinyint not null  default 0,
  `creatorId` int  default 0,
  `highlightImage` varchar(764)  not null ,
  `isMature` tinyint not null  default 0,Primary key(`id`),Unique key `Pitch_id_key`(`title`), Unique key `Pitch_title_key`(`channelId`),Key `Pitch_channelId_key`(`userId`)
 )ENGINE=innodb COLLATE=utf8mb4_unicode_ci;
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(0 , '0000-08-27 13:44:00' ,null ,"	" ,'' ,-2147483520 ,-81 ,-378707609 ,-445436053 ,null ,'' ,'' ,-23 ,-295406487 ,"tle.webp�% 	" ,-127);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(0 , '2023-10-06 23:04:42' , '2023-10-06 23:05:23' ,"Secret" ," Archivechambe" ,-232755354 ,-96 ,-211459214 ,-445353088 ,null ,"Ā耀" ,"riousThe S" ,-27 ,-479042188 ," Gallery of Lost Art��" ,-27);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(1 , '2023-10-02 21:41:34' , '2023-10-03 01:56:34' ,"slothcore" ,"sloth with a top hat and monocle" ,0 ,0 ,25165824 ,-2139095040 ,null ,"慄空楬杮䐠汯桰湩琠敨䈠楲汬慩n" ,null ,-12 ,-731355872 ,"classiest sloth you'll ever meet!�'%" ,-119);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(2 , '2023-10-02 21:41:34' , '2023-10-03 01:56:25' ,"zebrapunk" ,"zebra with nose piercings, punk style" ,0 ,0 ,25165824 ,-2139095040 ,null ,"潊汬⁹敊汬晹獩⁨桴⁥楗s" ,null ,-27 ,-731354765 ," zebra is too cool for school!�" ,-121);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(4 , '2023-10-02 21:41:34' , '2023-10-03 01:56:21' ,"gothcore" ,"a raven with dark eyeliner and a choker" ,0 ,1 ,25165824 ,-2139095040 ,null ,"湉敧楮畯⁳杉慵慮琠敨䘠慥汲獥" ,null ,-13 ,-982683872 ,"phase? No, this is who I am.�	8" ,-125);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(5 , '2023-10-02 23:42:02' , '2023-10-03 17:01:01' ,"AMI" ,"AMI - The Anti-Malaria Intelligence, rainbow butterflies" ,0 ,0 ,8388608 ,-2139095040 ,null ,"慄空楬杮䐠汯桰湩琠敨䈠楲汬慩n" ,null ,-12 ,-681236622 ,"e AMI�" ,-118);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(6 , '2023-10-02 23:45:57' , '2023-10-03 01:56:15' ,"dreamscape" ,"Dreamscape Masterpiece" ,0 ,1 ,25165824 ,-2139095040 ,null ,"楈牥湯浹獵䈠牯捳h" ,null ,-12 ,-730914750 ,"osch or Not to Bosch�)" ,-120);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(11 , '2023-10-05 14:35:48' , '2023-10-09 22:22:09' ,"Sylvania" ,"Forest glen filled with magical creatures" ,0 ,0 ,8388608 ,-2122317824 ,null ,"祓癬湡倠牡摡獩" ,null ,-27 ,-144154252 ,"'s in your magical forest?�" ,-116);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(14 , '2023-10-09 22:42:39' , '2023-10-09 22:42:39' ,"Cartoon Violencecute, " ,"deadly�" ,0 ,-44 ,-445100699 ,-132103818 ,null ,"ery�/images/" ,"kindtitle.we" ,-30 ,-259981312 ,'' ,-128);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(15 , '2023-10-10 04:01:40' , '2024-01-31 06:14:57' ,"cute cloud catsfluffy " ,"pastel cloud ca" ,-193781662 ,-20 ,-445750171 ,-226492416 ,null ,"" ,'' ,-30 ,-259981312 ,'' ,-128);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(16 , '2023-10-11 01:08:56' , '2023-10-11 01:08:56' ,"Cryptid Glamour ShotsC" ,"ryptid, photography, " ,-412327571 ,-17 ,-177069965 ,-395348864 ,null ,"Ā脀" ," want to be beaut" ,-23 ,-428512127 ,"/images/kindtitle.webp�" ,-128);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(17 , '2023-10-14 03:34:56' , '2023-10-14 03:43:41' ,"Clouds and catsClouds " ,"and cats�" ,-2147483008 ,-128 ,-2147450577 ,-378707609 ,null ,"es/kindtitle.we" ,'' ,-30 ,-260046848 ,'' ,-106);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(18 , '2023-10-14 04:41:08' , '2023-10-14 04:41:08' ,"Nothing" ,'' ,0 ,-128 ,25165824 ,-2139095040 ,null ,'' ,null ,-128 ,0 ,'' ,-128);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(19 , '2023-10-14 18:31:11' , '2023-10-14 18:31:11' ,"robot" ,"robot futuristic lofi " ,3 ,-128 ,25165824 ,-2139095040 ,null ,'' ,null ,-128 ,4114 ,'' ,-119);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(20 , '2023-10-20 04:23:36' , '2023-10-20 04:23:36' ,"Bandoleer" ,"creative bandoleer" ,0 ,-128 ,25165824 ,-2139095040 ,null ,"慐据潨䈠扯嘠汩l" ,null ,-31 ,1301 ,'' ,-107);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(21 , '2023-10-22 04:20:14' , '2023-10-22 04:20:14' ,"Enter your art prompt" ,"Enter your art prompt" ,1 ,-128 ,25165824 ,-2139095040 ,null ,"敭⠠" ,null ,-70 ,3077 ,'' ,-123);
insert into `Pitch` (`id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `claps`, `boos`, `channelId`, `designer`, `flavorText`, `isOrphan`, `creatorId`, `highlightImage`, `isMature`) values(22 , '2023-11-19 23:19:19' , '2023-11-19 23:19:19' ,"Ramen" ,"ramen" ,1 ,-128 ,25165824 ,-2139095040 ,null ,"楳慬晳汥湩u" ,null ,-13 ,1441792 ,'' ,-96);
