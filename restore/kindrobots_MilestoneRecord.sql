
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

DROP TABLE IF EXISTS`MilestoneRecord`;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `MilestoneRecord` (
  `id` int not null auto_increment  ,
  `createdAt` datetime  not null ,
  `updatedAt` datetime  ,
  `milestoneId` int not null ,
  `userId` int not null ,
  `username` varchar(764)   default NULL,Primary key(`id`)
 )ENGINE=innodb COLLATE=utf8mb4_unicode_ci;
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(1 , '2023-10-09 11:27:55' , '0000-00-00 00:02:00' ,-2146696960 ,-2147472384 ,"4�");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(3 , '2023-10-08 05:48:28' , '0000-00-00 00:42:00' ,-2123142804 ,-512530843 ,"l");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(4 , '2023-10-08 05:55:46' , '0000-00-00 00:46:00' ,-2123142804 ,-512530843 ,"l");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(5 , '2023-10-09 21:46:02' , '0000-00-00 00:10:00' ,-2123142804 ,-512530843 ,"l");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(6 , '2023-10-09 21:48:43' , '0000-00-00 00:14:00' ,-2123142804 ,-512530843 ,"l");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(7 , '2023-10-09 22:15:42' , '0000-00-00 00:06:00' ,-2123142804 ,-512530843 ,"l");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(8 , '2023-10-09 23:14:04' , '0000-00-00 00:26:00' ,-2123142804 ,-512530843 ,"l");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(9 , '2023-10-09 23:29:29' , '0000-00-00 00:38:00' ,-2123142804 ,-512530843 ,"l");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(10 , '2023-10-10 00:43:51' , '0000-00-00 00:22:00' ,-2123142804 ,-512530843 ,"l");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(11 , '2023-10-10 02:25:59' , '0000-00-00 00:42:00' ,-2090896529 ,-312119442 ,"e");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(12 , '2023-10-10 02:47:34' , '0000-00-00 00:26:00' ,-2090896529 ,-312119442 ,"e");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(13 , '2023-10-10 02:57:04' , '0000-00-00 00:22:00' ,-2090896529 ,-312119442 ,"e");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(14 , '2023-10-10 03:04:26' , '0000-00-00 00:10:00' ,-2090896529 ,-312119442 ,"e");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(15 , '2023-10-10 04:01:41' , '0000-00-00 00:06:00' ,-2090896529 ,-312119442 ,"e");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(16 , '2023-10-10 04:04:45' , '0000-00-00 00:14:00' ,-2090896529 ,-312119442 ,"e");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(17 , '2023-10-10 04:07:06' , '0000-00-00 00:46:00' ,-2090896529 ,-312119442 ,"e");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(18 , '2023-10-10 04:08:00' , '0000-00-00 00:38:00' ,-2090896529 ,-312119442 ,"e");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(19 , '2023-10-10 05:56:06' , '0000-00-00 00:18:00' ,-2123142804 ,-512530843 ,"l");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(20 , '2023-10-11 04:10:44' , '0000-00-00 00:18:00' ,-2090896529 ,-312119442 ,"e");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(21 , '2023-10-12 03:36:59' , '0000-00-00 00:26:00' ,-1890754187 ,-378243726 ,"t");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(22 , '2023-12-10 02:41:16' , '0000-00-00 00:10:00' ,-2075758728 ,-117243648 ,"''");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(23 , '2023-12-10 02:47:12' , '0000-00-00 00:22:00' ,-1790546056 ,-2097086464 ,"''");
insert into `MilestoneRecord` (`id`, `createdAt`, `updatedAt`, `milestoneId`, `userId`, `username`) values(24 , '2024-03-04 02:44:31' , '0000-00-00 00:26:00' ,-1790546056 ,0 ,"''");
