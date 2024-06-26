
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

DROP TABLE IF EXISTS`Channel`;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `Channel` (
  `id` int not null auto_increment  ,
  `createdAt` datetime  not null ,
  `updatedAt` datetime  ,
  `userId` int  default 16580608,
  `label` varchar(764)  not null ,
  `description` varchar(8000)   default NULL,
  `tagId` int  default 0,
  `title` varchar(764)   default NULL,
  `pitchId` int  default 0,Primary key(`id`),Unique key `Channel_id_key`(`label`(200))
 )ENGINE=innodb COLLATE=utf8mb4_unicode_ci;
insert into `Channel` (`id`, `createdAt`, `updatedAt`, `userId`, `label`, `description`, `tagId`, `title`, `pitchId`) values(1 , '2023-10-04 02:33:44' ,null ,0 ,"feed" ,"global feed" ,null ,null ,null);
insert into `Channel` (`id`, `createdAt`, `updatedAt`, `userId`, `label`, `description`, `tagId`, `title`, `pitchId`) values(2 , '2023-10-04 02:34:19' ,null ,0 ,"livechat" ,"global livechat" ,null ,null ,null);
insert into `Channel` (`id`, `createdAt`, `updatedAt`, `userId`, `label`, `description`, `tagId`, `title`, `pitchId`) values(3 , '2023-10-06 16:57:19' ,null ,0 ,"gothcore" ,"Just a cute little bun-bun" ,null ,"Devil Bunny" ,null);
insert into `Channel` (`id`, `createdAt`, `updatedAt`, `userId`, `label`, `description`, `tagId`, `title`, `pitchId`) values(4 , '2023-10-06 23:31:29' ,null ,1 ,"dreamscapes" ,null ,null ,"dreamscapes" ,6);
