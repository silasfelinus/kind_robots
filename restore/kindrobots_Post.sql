
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

DROP TABLE IF EXISTS`Post`;
-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `Post` (
  `id` int not null auto_increment  ,
  `createdAt` datetime  not null ,
  `updatedAt` datetime  ,
  `userId` int  default 0,
  `username` varchar(764)  not null ,
  `content` varchar(764)  not null ,
  `title` varchar(764)   default NULL,
  `label` varchar(764)  not null ,
  `imagePath` varchar(764)   default NULL,
  `artId` int  default 0,
  `pitchId` int  default 0,
  `pitchname` varchar(764)   default NULL,
  `sloganContent` varchar(764)   default NULL,
  `sloganId` int  default 0,
  `botId` int  default 0,
  `botname` varchar(764)   default NULL,
  `channelId` int  default 0,
  `likes` int not null  default 0,
  `dislikes` int not null  default 0,
  `hates` int not null  default 0,
  `loves` int not null  default 0,
  `jellybeanClaps` int not null  default 0,
  `isFavorite` tinyint not null  default 0,Primary key(`id`)
 )ENGINE=innodb COLLATE=utf8mb4_unicode_ci;
