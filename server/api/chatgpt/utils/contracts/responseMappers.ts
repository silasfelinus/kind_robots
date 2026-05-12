// /server/api/chatgpt/utils/contracts/responseMappers.ts
import type {
  Art,
  ArtCollection,
  ArtImage,
  Bot,
  Butterfly,
  Character,
  Chat,
  Component,
  Dream,
  Gallery,
  Pitch,
  Prompt,
  Reaction,
  Resource,
  Reward,
  Scenario,
  Server,
  SmartIcon,
  Tag,
  Theme,
} from '~/prisma/generated/prisma/client'

export type PublicArt = Pick<
  Art,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'path'
  | 'checkpoint'
  | 'checkpointResourceId'
  | 'sampler'
  | 'seed'
  | 'steps'
  | 'designer'
  | 'isPublic'
  | 'isMature'
  | 'promptId'
  | 'userId'
  | 'pitchId'
  | 'galleryId'
  | 'promptString'
  | 'cfg'
  | 'cfgHalf'
  | 'serverId'
  | 'serverName'
  | 'serverUrl'
  | 'artImageId'
  | 'imagePath'
  | 'genres'
  | 'negativePrompt'
>

export type PublicArtCollection = Pick<
  ArtCollection,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'userId'
  | 'label'
  | 'isMature'
  | 'isPublic'
  | 'description'
  | 'username'
>

export type PublicArtImage = Pick<
  ArtImage,
  | 'id'
  | 'galleryId'
  | 'createdAt'
  | 'updatedAt'
  | 'userId'
  | 'artId'
  | 'fileName'
  | 'fileType'
  | 'rarity'
  | 'botId'
  | 'componentId'
  | 'milestoneId'
  | 'pitchId'
  | 'promptId'
  | 'reactionId'
  | 'resourceId'
  | 'rewardId'
  | 'tagId'
  | 'chatId'
  | 'characterId'
  | 'butterflyId'
>

export type PublicBot = Pick<
  Bot,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'BotType'
  | 'name'
  | 'subtitle'
  | 'description'
  | 'avatarImage'
  | 'botIntro'
  | 'userIntro'
  | 'prompt'
  | 'trainingPath'
  | 'theme'
  | 'personality'
  | 'modules'
  | 'sampleResponse'
  | 'tagline'
  | 'isPublic'
  | 'isMature'
  | 'underConstruction'
  | 'canDelete'
  | 'userId'
  | 'designer'
  | 'serverId'
  | 'serverName'
  | 'artImageId'
>

export type PublicButterfly = Pick<
  Butterfly,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'message'
  | 'wingTopColor'
  | 'wingBottomColor'
  | 'speed'
  | 'wingSpeed'
  | 'scale'
  | 'rarityNumber'
  | 'artImageId'
  | 'designer'
  | 'userId'
  | 'isPublic'
  | 'artId'
  | 'artCollectionId'
  | 'botId'
  | 'characterId'
  | 'pitchId'
  | 'promptId'
  | 'rewardId'
  | 'scenarioId'
  | 'tagId'
>

export type PublicCharacter = Pick<
  Character,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'achievements'
  | 'alignment'
  | 'experience'
  | 'level'
  | 'class'
  | 'species'
  | 'backstory'
  | 'drive'
  | 'inventory'
  | 'statName1'
  | 'statValue1'
  | 'statName2'
  | 'statValue2'
  | 'statName3'
  | 'statValue3'
  | 'statName4'
  | 'statValue4'
  | 'statName5'
  | 'statValue5'
  | 'statName6'
  | 'statValue6'
  | 'quirks'
  | 'skills'
  | 'genre'
  | 'artImageId'
  | 'isPublic'
  | 'isMature'
  | 'userId'
  | 'artPrompt'
  | 'goalStat1Name'
  | 'goalStat1Value'
  | 'goalStat2Name'
  | 'goalStat2Value'
  | 'goalStat3Name'
  | 'goalStat3Value'
  | 'goalStat4Name'
  | 'goalStat4Value'
  | 'honorific'
  | 'imagePath'
  | 'designer'
  | 'personality'
>

export type PublicChat = Pick<
  Chat,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'type'
  | 'sender'
  | 'recipient'
  | 'content'
  | 'title'
  | 'isPublic'
  | 'isFavorite'
  | 'previousEntryId'
  | 'originId'
  | 'userId'
  | 'botId'
  | 'recipientId'
  | 'artImageId'
  | 'promptId'
  | 'botName'
  | 'channel'
  | 'botResponse'
  | 'characterId'
  | 'isRead'
  | 'isMature'
  | 'dreamId'
  | 'serverId'
  | 'serverName'
>

export type PublicComponent = Pick<
  Component,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'folderName'
  | 'componentName'
  | 'isWorking'
  | 'underConstruction'
  | 'isBroken'
  | 'title'
  | 'notes'
  | 'artImageId'
>

export type PublicDream = Pick<
  Dream,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'title'
  | 'slug'
  | 'description'
  | 'currentVibe'
  | 'currentPrompt'
  | 'userId'
  | 'pitchId'
  | 'artId'
  | 'artImageId'
  | 'textServerId'
  | 'artServerId'
  | 'artCollectionId'
  | 'galleryId'
  | 'scenarioId'
  | 'accessMode'
  | 'isPublic'
  | 'isMature'
  | 'isActive'
>

export type PublicGallery = Pick<
  Gallery,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'description'
  | 'url'
  | 'custodian'
  | 'content'
  | 'highlightImage'
  | 'imagePaths'
  | 'isMature'
  | 'userId'
  | 'isPublic'
>

export type PublicPitch = Pick<
  Pitch,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'title'
  | 'pitch'
  | 'designer'
  | 'flavorText'
  | 'highlightImage'
  | 'PitchType'
  | 'creationSource'
  | 'isMature'
  | 'isPublic'
  | 'userId'
  | 'imagePrompt'
  | 'description'
  | 'artImageId'
  | 'examples'
  | 'icon'
>

export type PublicPrompt = Pick<
  Prompt,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'prompt'
  | 'userId'
  | 'galleryId'
  | 'isMature'
  | 'isPublic'
  | 'creationSource'
  | 'pitchId'
  | 'botId'
  | 'artImageId'
>

export type PublicReaction = Pick<
  Reaction,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'comment'
  | 'userId'
  | 'reactionType'
  | 'reactionCategory'
  | 'rating'
  | 'artId'
  | 'artImageId'
  | 'artCollectionId'
  | 'botId'
  | 'butterflyId'
  | 'characterId'
  | 'chatId'
  | 'componentId'
  | 'dreamId'
  | 'galleryId'
  | 'pitchId'
  | 'promptId'
  | 'resourceId'
  | 'rewardId'
  | 'scenarioId'
  | 'tagId'
  | 'themeId'
>

export type PublicResource = Pick<
  Resource,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'customLabel'
  | 'MediaPath'
  | 'customUrl'
  | 'civitaiUrl'
  | 'huggingUrl'
  | 'localPath'
  | 'description'
  | 'isPublic'
  | 'isMature'
  | 'resourceType'
  | 'supportedServer'
  | 'userId'
  | 'artImageId'
  | 'generation'
>

export type PublicReward = Pick<
  Reward,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'icon'
  | 'text'
  | 'power'
  | 'collection'
  | 'rarity'
  | 'label'
  | 'userId'
  | 'artImageId'
  | 'imagePath'
  | 'imagePrompt'
  | 'isPublic'
  | 'isMature'
>

export type PublicScenario = Pick<
  Scenario,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'title'
  | 'description'
  | 'intros'
  | 'userId'
  | 'artImageId'
  | 'imagePath'
  | 'locations'
  | 'artPrompt'
  | 'genres'
  | 'inspirations'
  | 'isMature'
  | 'isPublic'
>

export type PublicServer = Omit<Server, 'apiKey' | 'workflowJson'>

export type PublicSmartIcon = Pick<
  SmartIcon,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'title'
  | 'type'
  | 'designer'
  | 'userId'
  | 'icon'
  | 'label'
  | 'link'
  | 'component'
  | 'isMature'
  | 'isPublic'
  | 'description'
  | 'category'
  | 'modelType'
>

export type PublicTag = Pick<
  Tag,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'label'
  | 'title'
  | 'flavorText'
  | 'pitch'
  | 'isPublic'
  | 'isMature'
  | 'userId'
  | 'artImageId'
>

export type PublicTheme = Pick<
  Theme,
  | 'id'
  | 'name'
  | 'values'
  | 'userId'
  | 'isPublic'
  | 'createdAt'
  | 'tagline'
  | 'room'
  | 'colorScheme'
  | 'prefersDark'
>

export function mapPublicArt(art: PublicArt) {
  return {
    ...art,
    image: art.imagePath || null,
  }
}

export function mapPublicArtCollection(collection: PublicArtCollection) {
  return {
    ...collection,
  }
}

export function mapPublicArtImage(artImage: PublicArtImage) {
  return {
    ...artImage,
    imageData: undefined,
  }
}

export function mapPublicBot(bot: PublicBot) {
  return {
    ...bot,
    avatar: bot.avatarImage || null,
    image: bot.avatarImage || null,
  }
}

export function mapPublicButterfly(butterfly: PublicButterfly) {
  return {
    ...butterfly,
    colors: {
      top: butterfly.wingTopColor,
      bottom: butterfly.wingBottomColor,
    },
  }
}

export function mapPublicCharacter(character: PublicCharacter) {
  return {
    ...character,
    image: character.imagePath || null,
  }
}

export function mapPublicChat(chat: PublicChat) {
  return {
    ...chat,
  }
}

export function mapPublicComponent(component: PublicComponent) {
  return {
    ...component,
  }
}

export function mapPublicDream(dream: PublicDream) {
  return {
    ...dream,
    image: dream.artImageId || dream.artId || null,
  }
}

export function mapPublicGallery(gallery: PublicGallery) {
  return {
    ...gallery,
    image: gallery.highlightImage || null,
  }
}

export function mapPublicPitch(pitch: PublicPitch) {
  return {
    ...pitch,
    image: pitch.highlightImage || null,
  }
}

export function mapPublicPrompt(prompt: PublicPrompt) {
  return {
    ...prompt,
  }
}

export function mapPublicReaction(reaction: PublicReaction) {
  return {
    ...reaction,
  }
}

export function mapPublicResource(resource: PublicResource) {
  return {
    ...resource,
    image: resource.MediaPath || null,
  }
}

export function mapPublicReward(reward: PublicReward) {
  return {
    ...reward,
    image: reward.imagePath || null,
  }
}

export function mapPublicScenario(scenario: PublicScenario) {
  return {
    ...scenario,
    intro: scenario.intros,
    genre: scenario.genres,
    image: scenario.imagePath || null,
  }
}

export function mapPublicServer(server: PublicServer) {
  return {
    ...server,
  }
}

export function mapPublicSmartIcon(icon: PublicSmartIcon) {
  return {
    ...icon,
  }
}

export function mapPublicTag(tag: PublicTag) {
  return {
    ...tag,
  }
}

export function mapPublicTheme(theme: PublicTheme) {
  return {
    ...theme,
  }
}
