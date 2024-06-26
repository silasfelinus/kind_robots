
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

DROP TABLE IF EXISTS`Milestone`;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `Milestone` (
  `id` int not null auto_increment  ,
  `label` varchar(764)  not null ,
  `message` varchar(764)  not null ,
  `icon` varchar(764)  not null ,
  `karma` int not null  default 0,
  `isRepeatable` tinyint not null  default 100,
  `createdAt` datetime  not null ,
  `updatedAt` datetime  ,
  `triggerCode` varchar(764)  not null ,
  `tooltip` varchar(764)   default NULL,
  `isActive` tinyint not null  default 0,
  `pageHint` varchar(764)   default NULL,
  `subtleHint` varchar(764)   default NULL,Primary key(`id`)
 )ENGINE=innodb COLLATE=utf8mb4_unicode_ci;
insert into `Milestone` (`id`, `label`, `message`, `icon`, `karma`, `isRepeatable`, `createdAt`, `updatedAt`, `triggerCode`, `tooltip`, `isActive`, `pageHint`, `subtleHint`) values(1 ,"Pitchmaster!" ,"You set the vibe with a fresh pitch" ,"icon-park-twotone:paper-ship" ,1000 ,0 , '2023-10-02 00:11:06' , '2023-10-02 00:11:06' ,"pitchmaster" ,"Create a new Pitch in Art Maker" ,1 ,"/artmaker" ,"pitch a fresh idea");
insert into `Milestone` (`id`, `label`, `message`, `icon`, `karma`, `isRepeatable`, `createdAt`, `updatedAt`, `triggerCode`, `tooltip`, `isActive`, `pageHint`, `subtleHint`) values(2 ,"Brainstorm!" ,"Your creativity is electrifying!" ,"mdi:lightning-bolt" ,1000 ,0 , '2023-10-02 00:11:06' , '2023-10-02 00:11:06' ,"Brainstorm" ,"Create a brainstorm." ,1 ,"/brainstorm" ,"Flex your cranium");
insert into `Milestone` (`id`, `label`, `message`, `icon`, `karma`, `isRepeatable`, `createdAt`, `updatedAt`, `triggerCode`, `tooltip`, `isActive`, `pageHint`, `subtleHint`) values(3 ,"Weirdlandia!" ,"You embarked on a whimsical journey!" ,"mdi:alien" ,1000 ,0 , '2023-10-02 00:11:06' , '2023-10-02 00:11:06' ,"weirdlandia" ,"Start your path in weirdlandia" ,1 ,"/weirdlandia" ,"Venture into a new realm");
insert into `Milestone` (`id`, `label`, `message`, `icon`, `karma`, `isRepeatable`, `createdAt`, `updatedAt`, `triggerCode`, `tooltip`, `isActive`, `pageHint`, `subtleHint`) values(4 ,"Botcafe!" ,"You had a heart-to-heart with a Kind Robot!" ,"mdi:robot" ,1000 ,0 , '2023-10-02 00:11:06' , '2023-10-02 00:11:06' ,"botcafe" ,"Send a chat message to a robot." ,0 ,"/botcafe" ,"Palaver with a pseudo-intelligence");
insert into `Milestone` (`id`, `label`, `message`, `icon`, `karma`, `isRepeatable`, `createdAt`, `updatedAt`, `triggerCode`, `tooltip`, `isActive`, `pageHint`, `subtleHint`) values(5 ,"Matchmaker" ,"You completed a game of Card Match" ,"fluent:pair-24-filled" ,1000 ,0 , '2023-10-02 00:11:06' , '2023-10-02 00:11:06' ,"matchmaker" ,"Earn at least 50 points on Memory Match" ,0 ,"/memory" ,"Reserved for those with an impressive Memory");
insert into `Milestone` (`id`, `label`, `message`, `icon`, `karma`, `isRepeatable`, `createdAt`, `updatedAt`, `triggerCode`, `tooltip`, `isActive`, `pageHint`, `subtleHint`) values(6 ,"Rebel Yell!" ,"You don't follow pointless directives, good job!" ,"clarity:cursor-hand-click-line" ,1000 ,0 , '2023-10-02 00:11:06' , '2023-10-02 00:11:06' ,"button" ,"Press the button to 100" ,0 ,"/button" ,"Don't follow directions");
insert into `Milestone` (`id`, `label`, `message`, `icon`, `karma`, `isRepeatable`, `createdAt`, `updatedAt`, `triggerCode`, `tooltip`, `isActive`, `pageHint`, `subtleHint`) values(7 ,"Art Critic!" ,"You made a tasteful judgment!" ,"mdi:eye-check" ,1000 ,0 , '2023-10-02 00:11:06' , '2023-10-02 00:11:06' ,"artcritic" ,"Respond to something with a comment or reaction." ,0 ,"/galleries" ,"Express an opinion");
insert into `Milestone` (`id`, `label`, `message`, `icon`, `karma`, `isRepeatable`, `createdAt`, `updatedAt`, `triggerCode`, `tooltip`, `isActive`, `pageHint`, `subtleHint`) values(8 ,"Malaria Activist!" ,"You helped AMI gain flight" ,"icon-park-twotone:butterfly" ,1000 ,0 , '2023-10-02 00:11:06' , '2023-10-02 00:11:06' ,"amibot" ,"Launch AMI in the fundraiser page" ,0 ,"/ammibot" ,"Contribute to a social movement");
insert into `Milestone` (`id`, `label`, `message`, `icon`, `karma`, `isRepeatable`, `createdAt`, `updatedAt`, `triggerCode`, `tooltip`, `isActive`, `pageHint`, `subtleHint`) values(9 ,"Designer!" ,"You revamped your style in our Theme Changer." ,"mdi:brush" ,1000 ,0 , '2023-10-02 00:11:06' , '2023-10-02 00:11:06' ,"theme" ,"Change your theme in Theme Changer" ,0 ,"/theme" ,"Try out a new look");
insert into `Milestone` (`id`, `label`, `message`, `icon`, `karma`, `isRepeatable`, `createdAt`, `updatedAt`, `triggerCode`, `tooltip`, `isActive`, `pageHint`, `subtleHint`) values(10 ,"The road ahead!" ,"You've eyed the horizon and explored the milestones gallery." ,"mdi:compass" ,1000 ,0 , '2023-10-02 00:11:06' , '2023-10-02 00:11:06' ,"milestone" ,"Visit the milestone gallery" ,1 ,"/milestones" ,"Aspire for greatness");
insert into `Milestone` (`id`, `label`, `message`, `icon`, `karma`, `isRepeatable`, `createdAt`, `updatedAt`, `triggerCode`, `tooltip`, `isActive`, `pageHint`, `subtleHint`) values(11 ,"Artist!" ,"You made Art!" ,"mdi:palette" ,1000 ,0 , '2023-10-07 20:44:14' ,null ,"Artist" ,"Make new Art with our Art Modeler" ,1 ,"/artmaker" ,"Go press some buttons in the art room");
