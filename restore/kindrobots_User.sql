CREATE DATABASE IF NOT EXISTS `kindrobots`;
USE `kindrobots`;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop the table
DROP TABLE IF EXISTS `User`;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `User` (
  `id` int NOT NULL AUTO_INCREMENT,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime,
  `Role` enum('SYSTEM','USER','ASSISTANT','ADMIN','GUEST','BOT','DESIGNER','CHILD') NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `questPoints` int NOT NULL DEFAULT 0,
  `emailVerified` datetime,
  `name` varchar(255) DEFAULT NULL,
  `address1` TEXT DEFAULT NULL,
  `address2` TEXT DEFAULT NULL,
  `avatarImage` TEXT DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `birthday` datetime,
  `city` TEXT DEFAULT NULL,
  `country` TEXT DEFAULT NULL,
  `discordUrl` TEXT DEFAULT NULL,
  `facebookUrl` TEXT DEFAULT NULL,
  `instagramUrl` TEXT DEFAULT NULL,
  `kindrobotsUrl` TEXT DEFAULT NULL,
  `languages` TEXT DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `timezone` varchar(255) DEFAULT NULL,
  `twitterUrl` TEXT DEFAULT NULL,
  `apiKey` TEXT DEFAULT NULL,
  `password` TEXT DEFAULT NULL,
  `spotifyAccessToken` TEXT DEFAULT NULL,
  `spotifyID` TEXT DEFAULT NULL,
  `spotifyRefreshToken` TEXT DEFAULT NULL,
  `karma` int NOT NULL DEFAULT 0,
  `mana` int NOT NULL DEFAULT 0,
  `clickRecord` int DEFAULT 0,
  `matchRecord` int DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB COLLATE=utf8mb4_unicode_ci;



insert into `User` (`id`, `createdAt`, `updatedAt`, `Role`, `username`, `email`, `questPoints`, `emailVerified`, `name`, `address1`, `address2`, `avatarImage`, `bio`, `birthday`, `city`, `country`, `discordUrl`, `facebookUrl`, `instagramUrl`, `kindrobotsUrl`, `languages`, `phone`, `state`, `timezone`, `twitterUrl`, `apiKey`, `password`, `spotifyAccessToken`, `spotifyID`, `spotifyRefreshToken`, `karma`, `mana`, `clickRecord`, `matchRecord`) values(1 , '2023-10-02 18:24:25' ,null , 'ADMIN' ,"silasfelinus" ,"silasfelinus@gmail.com" ,0 ,null ,"Silas Knight" ,null ,null ,"/images/botcafe.webp" ,"I was born and then things happened and now Im here." ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,"$2b$10$CfjexYomy5sLeUl.jR6cXOGmgfRClWpACei4nPC5d4qIPkjSlgo.e" ,null ,null ,null ,9000 ,9 ,1000 ,55);
insert into `User` (`id`, `createdAt`, `updatedAt`, `Role`, `username`, `email`, `questPoints`, `emailVerified`, `name`, `address1`, `address2`, `avatarImage`, `bio`, `birthday`, `city`, `country`, `discordUrl`, `facebookUrl`, `instagramUrl`, `kindrobotsUrl`, `languages`, `phone`, `state`, `timezone`, `twitterUrl`, `apiKey`, `password`, `spotifyAccessToken`, `spotifyID`, `spotifyRefreshToken`, `karma`, `mana`, `clickRecord`, `matchRecord`) values(2 , '2023-10-02 18:24:31' ,null , 'DESIGNER' ,"FredNylon" ,"hairbysuperkate@gmail.com" ,0 ,null ,"Fred Nylon" ,null ,null ,"/images/botcafe.webp" ,"I was born and then things happened and now Im here." ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,"de04c243fa9858a6154d38eaa8a0b48c" ,"$2b$10$feAcSf3Bpta/Yal5YgvfTe2ORli.Lr.Evk8TmgslRUaXs7iNz4e9C" ,null ,null ,null ,0 ,0 ,0 ,0);
insert into `User` (`id`, `createdAt`, `updatedAt`, `Role`, `username`, `email`, `questPoints`, `emailVerified`, `name`, `address1`, `address2`, `avatarImage`, `bio`, `birthday`, `city`, `country`, `discordUrl`, `facebookUrl`, `instagramUrl`, `kindrobotsUrl`, `languages`, `phone`, `state`, `timezone`, `twitterUrl`, `apiKey`, `password`, `spotifyAccessToken`, `spotifyID`, `spotifyRefreshToken`, `karma`, `mana`, `clickRecord`, `matchRecord`) values(3 , '2023-10-02 18:24:39' ,null , 'CHILD' ,"_someones_" ,"roninknight@gmail.com" ,0 ,null ,"_Someones_" ,null ,null ,"/images/botcafe.webp" ,"I was born and then things happened and now Im here." ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,"5ffc1e989cb1f60041b6e79179ea6dda9fda6500fa214ec194926a86c8698bfc" ,"$2b$10$g7CnbM5wXp6m7duF8LNzUOwidgyXyqDohYXDpQCKg5nTRZnZsTtAq" ,null ,null ,null ,9000 ,9 ,110 ,60);
insert into `User` (`id`, `createdAt`, `updatedAt`, `Role`, `username`, `email`, `questPoints`, `emailVerified`, `name`, `address1`, `address2`, `avatarImage`, `bio`, `birthday`, `city`, `country`, `discordUrl`, `facebookUrl`, `instagramUrl`, `kindrobotsUrl`, `languages`, `phone`, `state`, `timezone`, `twitterUrl`, `apiKey`, `password`, `spotifyAccessToken`, `spotifyID`, `spotifyRefreshToken`, `karma`, `mana`, `clickRecord`, `matchRecord`) values(4 , '2023-10-02 18:24:14' ,null , 'CHILD' ,"Foxy" ,"foxinfoxsocksfoxfoxsock@gmail.com" ,0 ,null ,"Fox Knight" ,null ,null ,"/images/botcafe.webp" ,"I was born and then things happened and now Im here." ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,"8b1cd249e9c7605c87909c529a009e48" ,null ,null ,null ,null ,1000 ,1 ,3000 ,65);
insert into `User` (`id`, `createdAt`, `updatedAt`, `Role`, `username`, `email`, `questPoints`, `emailVerified`, `name`, `address1`, `address2`, `avatarImage`, `bio`, `birthday`, `city`, `country`, `discordUrl`, `facebookUrl`, `instagramUrl`, `kindrobotsUrl`, `languages`, `phone`, `state`, `timezone`, `twitterUrl`, `apiKey`, `password`, `spotifyAccessToken`, `spotifyID`, `spotifyRefreshToken`, `karma`, `mana`, `clickRecord`, `matchRecord`) values(13 , '2023-10-11 04:36:12' ,null , 'CHILD' ,"David :D" ,"roninaknight@gmail.com" ,0 ,null ,null ,null ,null ,"/images/botcafe.webp" ,"I was born and then things happened and now Im here." ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,"bf167a56f05b26886acc5e41d7fbba0d" ,"$2b$10$XAScrhqRV9hd1rrJBQNKNOfHFVf3bpKCmupbEOBlJl7BbDnUllpiG" ,null ,null ,null ,0 ,0 ,0 ,-420);
insert into `User` (`id`, `createdAt`, `updatedAt`, `Role`, `username`, `email`, `questPoints`, `emailVerified`, `name`, `address1`, `address2`, `avatarImage`, `bio`, `birthday`, `city`, `country`, `discordUrl`, `facebookUrl`, `instagramUrl`, `kindrobotsUrl`, `languages`, `phone`, `state`, `timezone`, `twitterUrl`, `apiKey`, `password`, `spotifyAccessToken`, `spotifyID`, `spotifyRefreshToken`, `karma`, `mana`, `clickRecord`, `matchRecord`) values(14 , '2023-10-11 16:38:40' ,null , 'USER' ,"antic" ,"atomantic@gmail.com" ,0 ,null ,null ,null ,null ,"/images/botcafe.webp" ,"I was born and then things happened and now Im here." ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,"793e6eb5fbca4a89eac7993022d6765b" ,"$2b$10$JXUSIAffzkvFb5zReqb9tuzGg/meK7YeqUOOu4X7oUkbc2D0bVFey" ,null ,null ,null ,0 ,0 ,0 ,0);
insert into `User` (`id`, `createdAt`, `updatedAt`, `Role`, `username`, `email`, `questPoints`, `emailVerified`, `name`, `address1`, `address2`, `avatarImage`, `bio`, `birthday`, `city`, `country`, `discordUrl`, `facebookUrl`, `instagramUrl`, `kindrobotsUrl`, `languages`, `phone`, `state`, `timezone`, `twitterUrl`, `apiKey`, `password`, `spotifyAccessToken`, `spotifyID`, `spotifyRefreshToken`, `karma`, `mana`, `clickRecord`, `matchRecord`) values(15 , '2023-10-12 03:33:27' ,null , 'USER' ,"Mauiturtle_tutu" ,"laurie@healingtheinnergoddess.com" ,0 ,null ,null ,null ,null ,"/images/botcafe.webp" ,"I was born and then things happened and now Im here." ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,"5c32e29c882dc7c345511b8c16db0aba" ,"$2b$10$PIdru4zJuuoAc5f7uwKJg.OkswI3WGAkYFPlSHbKiAP4IwFQsX59i" ,null ,null ,null ,0 ,0 ,100 ,10);
insert into `User` (`id`, `createdAt`, `updatedAt`, `Role`, `username`, `email`, `questPoints`, `emailVerified`, `name`, `address1`, `address2`, `avatarImage`, `bio`, `birthday`, `city`, `country`, `discordUrl`, `facebookUrl`, `instagramUrl`, `kindrobotsUrl`, `languages`, `phone`, `state`, `timezone`, `twitterUrl`, `apiKey`, `password`, `spotifyAccessToken`, `spotifyID`, `spotifyRefreshToken`, `karma`, `mana`, `clickRecord`, `matchRecord`) values(16 , '2023-10-14 21:04:28' ,null , 'CHILD' ,"semon03" ,"roninaknight+1@gmail.com" ,0 ,null ,null ,null ,null ,"/images/botcafe.webp" ,"I was born and then things happened and now Im here." ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,"76869a4399813406278437391c3bae0c" ,"$2b$10$Z4aIF5iIP.4hs784yt4xOuVQi3Ht7Rhhtt4w/VYet1HZUYePUEZMO" ,null ,null ,null ,0 ,0 ,0 ,0);
insert into `User` (`id`, `createdAt`, `updatedAt`, `Role`, `username`, `email`, `questPoints`, `emailVerified`, `name`, `address1`, `address2`, `avatarImage`, `bio`, `birthday`, `city`, `country`, `discordUrl`, `facebookUrl`, `instagramUrl`, `kindrobotsUrl`, `languages`, `phone`, `state`, `timezone`, `twitterUrl`, `apiKey`, `password`, `spotifyAccessToken`, `spotifyID`, `spotifyRefreshToken`, `karma`, `mana`, `clickRecord`, `matchRecord`) values(17 , '2023-11-05 22:42:29' ,null , 'USER' ,"kindrobot" ,'' ,0 ,null ,null ,null ,null ,"/images/botcafe.webp" ,"I was born and then things happened and now Im here." ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,"837af26637dd84c83b0c631fc9fe867d" ,'' ,null ,null ,null ,0 ,0 ,0 ,0);
insert into `User` (`id`, `createdAt`, `updatedAt`, `Role`, `username`, `email`, `questPoints`, `emailVerified`, `name`, `address1`, `address2`, `avatarImage`, `bio`, `birthday`, `city`, `country`, `discordUrl`, `facebookUrl`, `instagramUrl`, `kindrobotsUrl`, `languages`, `phone`, `state`, `timezone`, `twitterUrl`, `apiKey`, `password`, `spotifyAccessToken`, `spotifyID`, `spotifyRefreshToken`, `karma`, `mana`, `clickRecord`, `matchRecord`) values(21 , '2023-12-10 02:45:27' ,null , 'USER' ,"Fox" ,"fox@gmail.com" ,0 ,null ,null ,null ,null ,"/images/botcafe.webp" ,"I was born and then things happened and now Im here." ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,"e9c262e59d42d5efc51451d24cd2dee3" ,"$2b$10$Xv4Ujy.RqatQHnDC8k25ZegCiMxJbVriFJjQ7MtlMNgIquyKnMUWK" ,null ,null ,null ,1000 ,1 ,4000 ,55);
INSERT INTO `User` (`id`, `createdAt`, `updatedAt`, `Role`, `username`, `email`, `questPoints`, `emailVerified`, `name`, `address1`, `address2`, `avatarImage`, `bio`, `birthday`, `city`, `country`, `discordUrl`, `facebookUrl`, `instagramUrl`, `kindrobotsUrl`, `languages`, `phone`, `state`, `timezone`, `twitterUrl`, `apiKey`, `password`, `spotifyAccessToken`, `spotifyID`, `spotifyRefreshToken`, `karma`, `mana`, `clickRecord`, `matchRecord`) 
VALUES (0 , '2023-10-02 18:27:14' ,null , 'GUEST' ,"Kind Guest" ,"kindguest@kindrobots.com" ,0 ,null ,"Kind Guest" ,null ,null ,"/images/botcafe.webp" ,"I was born and then things happened and now Im here." ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,"9b0650dfa4c4fd4e8bfbf1d171e32128" ,"$2b$10$TyH7kbSY8ErCNZ0MCuCq8uyJQ4QywHWtbAG6futFr4XejFodqHbY6" ,null ,null ,null ,0 ,0 ,0 ,0);
