
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

DROP TABLE IF EXISTS`Message`;


-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
CREATE TABLE `Message` (
  `id` int not null auto_increment  ,
  `createdAt` datetime  not null ,
  `updatedAt` datetime  ,
  `sender` varchar(764)  not null ,
  `recipient` varchar(764)  not null ,
  `content` text  not null ,
  `channelId` int not null ,
  `botId` int  default 0,
  `userId` int  default 0,Primary key(`id`),Key `Message_id_key`(`userId`)
 )ENGINE=innodb COLLATE=utf8mb4_unicode_ci;
insert into `Message` (`id`, `createdAt`, `updatedAt`, `sender`, `recipient`, `content`, `channelId`, `botId`, `userId`) values(1 , '2023-10-04 02:38:49' ,null ,"WELCOMEBOT" ,"Kind User" ,"Hello! Welcome to our Livechat!" ,2 ,0 ,0);
insert into `Message` (`id`, `createdAt`, `updatedAt`, `sender`, `recipient`, `content`, `channelId`, `botId`, `userId`) values(2 , '2023-10-05 16:59:42' ,null ,"WELCOMEBOT" ,"Kind User" ,"Hello! Welcome to our Livechat!" ,2 ,0 ,0);
