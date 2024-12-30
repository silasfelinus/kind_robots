CREATE DATABASE IF NOT EXISTS `kindblank`;
USE `kindblank`;

INSERT INTO `Pitch` (
  `id`, `createdAt`, `updatedAt`, `title`, `pitch`, `userId`, `isPublic`, `isMature`, `flavorText`, `highlightImage`
) 
VALUES 
(1, '2023-10-02 21:41:34', '2023-10-03 01:56:34', 'slothcore', 'sloth with a top hat and monocle', 1, 1, 0, 'classiest sloth youll ever meet!', ''),
(2, '2023-10-02 21:41:34', '2023-10-03 01:56:25', 'zebrapunk', 'zebra with nose piercings, punk style', 1, 1, 0, 'zebra is too cool for school!�', ''),
(4, '2023-10-02 21:41:34', '2023-10-03 01:56:21', 'gothcore', 'a raven with dark eyeliner and a choker', 1, 1, 0, 'phase? No, this is who I am.�', ''),
(5, '2023-10-02 23:42:02', '2023-10-03 17:01:01', 'AMI', 'AMI - The Anti-Malaria Intelligence, rainbow butterflies', 1, 1, 0, 'e AMI�', ''),
(6, '2023-10-02 23:45:57', '2023-10-03 01:56:15', 'dreamscape', 'Dreamscape Masterpiece', 1, 1, 0, 'osch or Not to Bosch�', ''),
(11, '2023-10-05 14:35:48', '2023-10-09 22:22:09', 'Sylvania', 'Forest glen filled with magical creatures', 1, 1, 0, '', ''),
(14, '2023-10-09 22:42:39', '2023-10-09 22:42:39', 'Cartoon Violence', 'cute, deadly', 1, 1, 1, '', ''),
(15, '2023-10-10 04:01:40', '2024-01-31 06:14:57', 'cute cloud cats', 'fluffy pastel cloud cats', 1, 1, 0, '', ''),
(16, '2023-10-11 01:08:56', '2023-10-11 01:08:56', 'Cryptid Glamour Shots', 'Cryptid, photography', 1, 1, 1, 'I want to be beaut', '/images/kindtitle.webp�'),
(17, '2023-10-14 03:34:56', '2023-10-14 03:43:41', 'Clouds and cats', 'Clouds and cats�', 1, 1, 1, '', ''),
(18, '2023-10-14 04:41:08', '2023-10-14 04:41:08', 'Nothing', '', 1, 1, 1, '', ''),
(19, '2023-10-14 18:31:11', '2023-10-14 18:31:11', 'robot', 'robot futuristic lofi', 1, 1, 1, '', ''),
(20, '2023-10-20 04:23:36', '2023-10-20 04:23:36', 'Bandoleer', 'creative bandoleer', 1, 1, 1, '', ''),
(21, '2023-10-22 04:20:14', '2023-10-22 04:20:14', 'Enter your art prompt', 'Enter your art prompt', 1, 1, 1, '', ''),
(22, '2023-11-19 23:19:19', '2023-11-19 23:19:19', 'Ramen', 'ramen', 1, 1, 1, '', '');
