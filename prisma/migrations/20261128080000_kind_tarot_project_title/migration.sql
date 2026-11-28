-- Presentation only: the tarot-studio Project row was created by Conductor sync
-- with its slug as the title. Give it its public name and description, and
-- never overwrite a title someone has already edited.
UPDATE `Project`
SET `title` = 'Kind Tarot',
    `description` = 'Daily tarot readings from the 78-card Kind Oracle, a horoscope and in-depth birth chart for everyone you love, a collectible card scrapbook with daily rewards, and the Tarot Circle group chat.'
WHERE `conductorSlug` = 'tarot-studio' AND `title` = 'tarot-studio';
