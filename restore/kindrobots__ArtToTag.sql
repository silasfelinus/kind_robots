
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

DROP TABLE IF EXISTS`_ArtToTag`;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `_ArtToTag` (
  `A` int not null ,
  `B` int not null ,Primary key `_ArtToTag_AB_unique`(`A`,`B`)
 )ENGINE=innodb COLLATE=utf8mb4_unicode_ci;
insert into `_ArtToTag` (`A`, `B`) values(1 ,20);
insert into `_ArtToTag` (`A`, `B`) values(2 ,20);
insert into `_ArtToTag` (`A`, `B`) values(3 ,20);
insert into `_ArtToTag` (`A`, `B`) values(4 ,20);
insert into `_ArtToTag` (`A`, `B`) values(5 ,19);
