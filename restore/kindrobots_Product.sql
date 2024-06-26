
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

DROP TABLE IF EXISTS`Product`;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `Product` (
  `id` int not null auto_increment  ,
  `createdAt` datetime  not null ,
  `updatedAt` datetime  ,
  `title` varchar(764)  not null ,
  `category` varchar(764)  not null ,
  `flavorText` varchar(764)   default NULL,
  `description` varchar(8000)  not null ,
  `costInPennies` int not null  default 0,
  `userId` int not null  default 0,
  `passcode` varchar(764)   default NULL,
  `imagePath` varchar(764)   default NULL,Primary key(`id`)
 )ENGINE=innodb COLLATE=utf8mb4_unicode_ci;
insert into `Product` (`id`, `createdAt`, `updatedAt`, `title`, `category`, `flavorText`, `description`, `costInPennies`, `userId`, `passcode`, `imagePath`) values(0 , '0000-09-17 19:24:00' ,null ,"" ,'' ,null ,'' ,0 ,0 ,'' ,'');
