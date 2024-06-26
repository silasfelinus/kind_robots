
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

DROP TABLE IF EXISTS`Resource`;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `Resource` (
  `id` int not null auto_increment  ,
  `createdAt` datetime  not null ,
  `updatedAt` datetime  ,
  `userId` int  default -65536,
  `name` varchar(764)  not null ,
  `customLabel` varchar(764)   default NULL,
  `MediaPath` varchar(764)   default NULL,
  `customUrl` varchar(764)   default NULL,
  `civitaiUrl` varchar(764)   default NULL,
  `huggingUrl` varchar(764)   default NULL,
  `localPath` varchar(764)   default NULL,
  `description` text   default NULL,
  `resourceType` enum('CHECKPOINT','EMBEDDING','LORA','LYCORIS','HYPERNETWORK','CONTROLNET','URL','API')  not null ,
  `isMature` tinyint not null  default 0,
  `galleryCount` int  default 0,Primary key(`id`),Unique key `Resource_id_key`(`name`(200))
 )ENGINE=innodb COLLATE=utf8mb4_unicode_ci;
insert into `Resource` (`id`, `createdAt`, `updatedAt`, `userId`, `name`, `customLabel`, `MediaPath`, `customUrl`, `civitaiUrl`, `huggingUrl`, `localPath`, `description`, `resourceType`, `isMature`, `galleryCount`) values(0 , '0000-08-27 13:00:00' , '0630-02-00 00:00:38' ,null ,"''" ,'' ,"''" ,'' ,'' ,'' ,'' ,null , '0' ,25 ,null);
