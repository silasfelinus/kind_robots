CREATE DATABASE IF NOT EXISTS `kindblank`;
USE `kindblank`;

INSERT INTO `User` (
  `id`, `createdAt`, `Role`, `username`, `email`, 
  `questPoints`, `avatarImage`, `password`, `karma`, `mana`, 
  `clickRecord`, `matchRecord`
) 
VALUES (
  1, '2023-10-02 18:24:25', 'ADMIN', 'silasfelinus', 
  'silasfelinus@gmail.com', 0, '/images/botcafe.webp', 
  '$2b$10$CfjexYomy5sLeUl.jR6cXOGmgfRClWpACei4nPC5d4qIPkjSlgo.e', 
  9000, 9, 1000, 55
);

INSERT INTO `User` (
  `id`, `createdAt`, `Role`, `username`, `email`, 
  `questPoints`, `avatarImage`, `apiKey`, `password`, 
  `karma`, `mana`, `clickRecord`, `matchRecord`
) 
VALUES (
  2, '2023-10-02 18:24:31', 'DESIGNER', 'FredNylon', 
  'hairbysuperkate@gmail.com', 0, '/images/botcafe.webp', 
  'de04c243fa9858a6154d38eaa8a0b48c', 
  '$2b$10$feAcSf3Bpta/Yal5YgvfTe2ORli.Lr.Evk8TmgslRUaXs7iNz4e9C', 
  0, 0, 0, 0
);

INSERT INTO `User` (
  `id`, `createdAt`, `Role`, `username`, `email`, 
  `questPoints`, `avatarImage`, `apiKey`, `password`, 
  `karma`, `mana`, `clickRecord`, `matchRecord`
) 
VALUES (
  3, '2023-10-02 18:24:39', 'CHILD', '_someones_', 
  'roninknight@gmail.com', 0, '/images/botcafe.webp', 
  '5ffc1e989cb1f60041b6e79179ea6dda9fda6500fa214ec194926a86c8698bfc', 
  '$2b$10$g7CnbM5wXp6m7duF8LNzUOwidgyXyqDohYXDpQCKg5nTRZnZsTtAq', 
  9000, 9, 110, 60
);

INSERT INTO `User` (
  `id`, `createdAt`, `Role`, `username`, `email`, 
  `questPoints`, `avatarImage`, 
  `karma`, `mana`, `clickRecord`, `matchRecord`
) 
VALUES (
  4, '2023-10-02 18:24:14', 'CHILD', 'Foxy', 
  'foxinfoxsocksfoxfoxsock@gmail.com', 0, '/images/botcafe.webp', 
  1000, 1, 3000, 65
);


INSERT INTO `User` (
  `id`, `createdAt`, `Role`, `username`, `email`, 
  `questPoints`, `avatarImage`, `apiKey`, `password`, 
  `karma`, `mana`, `clickRecord`, `matchRecord`
) 
VALUES (
  13, '2023-10-11 04:36:12', 'CHILD', 'David :D', 
  'roninaknight@gmail.com', 0, '/images/botcafe.webp', 
  'bf167a56f05b26886acc5e41d7fbba0d', 
  '$2b$10$XAScrhqRV9hd1rrJBQNKNOfHFVf3bpKCmupbEOBlJl7BbDnUllpiG', 
  0, 0, 0, -420
);


INSERT INTO `User` (
  `id`, `createdAt`, `Role`, `username`, `email`, 
  `questPoints`, `avatarImage`, `apiKey`, `password`, 
  `karma`, `mana`, `clickRecord`, `matchRecord`
) 
VALUES (
  14, '2023-10-11 16:38:40', 'USER', 'antic', 
  'atomantic@gmail.com', 0, '/images/botcafe.webp', 
  '793e6eb5fbca4a89eac7993022d6765b', 
  '$2b$10$JXUSIAffzkvFb5zReqb9tuzGg/meK7YeqUOOu4X7oUkbc2D0bVFey', 
  0, 0, 0, 0
);


INSERT INTO `User` (
  `id`, `createdAt`, `Role`, `username`, `email`, 
  `questPoints`, `avatarImage`, `apiKey`, `password`, 
  `karma`, `mana`, `clickRecord`, `matchRecord`
) 
VALUES (
  15, '2023-10-12 03:33:27', 'USER', 'Mauiturtle_tutu', 
  'laurie@healingtheinnergoddess.com', 0, '/images/botcafe.webp', 
  '5c32e29c882dc7c345511b8c16db0aba', 
  '$2b$10$PIdru4zJuuoAc5f7uwKJg.OkswI3WGAkYFPlSHbKiAP4IwFQsX59i', 
  0, 0, 100, 10
);


INSERT INTO `User` (
  `id`, `createdAt`, `Role`, `username`, `email`, 
  `questPoints`, `avatarImage`, `apiKey`, `password`, 
  `karma`, `mana`, `clickRecord`, `matchRecord`
) 
VALUES (
  16, '2023-10-14 21:04:28', 'CHILD', 'semon03', 
  'roninaknight+1@gmail.com', 0, '/images/botcafe.webp', 
  '76869a4399813406278437391c3bae0c', 
  '$2b$10$Z4aIF5iIP.4hs784yt4xOuVQi3Ht7Rhhtt4w/VYet1HZUYePUEZMO', 
  0, 0, 0, 0
);


INSERT INTO `User` (
  `id`, `createdAt`, `Role`, `username`, `email`, `questPoints`, 
  `avatarImage`, `apiKey`, `karma`, `mana`, `clickRecord`, 
  `matchRecord`
) 
VALUES (
  17, '2023-11-05 22:42:29', 'USER', 'kindrobot', 'email@example.com', 
  0, '/images/botcafe.webp', '837af26637dd84c83b0c631fc9fe867d', 
  0, 0, 0, 0
);



INSERT INTO `User` (
  `id`, `createdAt`, `Role`, `username`, `email`, 
  `questPoints`, `avatarImage`, `apiKey`, `password`, 
  `karma`, `mana`, `clickRecord`, `matchRecord`
) 
VALUES (
  21, '2023-12-10 02:45:27', 'USER', 'Fox', 
  'fox@gmail.com', 0, '/images/botcafe.webp', 
  'e9c262e59d42d5efc51451d24cd2dee3', 
  '$2b$10$Xv4Ujy.RqatQHnDC8k25ZegCiMxJbVriFJjQ7MtlMNgIquyKnMUWK', 
  1000, 1, 4000, 55
);


INSERT INTO `User` (
  `id`, `createdAt`, `Role`, `username`, `email`, 
  `questPoints`, `avatarImage`, `apiKey`, `password`, 
  `karma`, `mana`, `clickRecord`, `matchRecord`
) 
VALUES (
  0, '2023-10-02 18:27:14', 'GUEST', 'Kind Guest', 
  'kindguest@kindrobots.com', 0, '/images/botcafe.webp', 
  '9b0650dfa4c4fd4e8bfbf1d171e32128', 
  '$2b$10$TyH7kbSY8ErCNZ0MCuCq8uyJQ4QywHWtbAG6futFr4XejFodqHbY6', 
  0, 0, 0, 0
);
