// this is for all non-sensitive config information
export default defineAppConfig({
  model: 'gpt-4o-mini',
  completion: 'https://api.openai.com/v1/completions',
  icon: {
    size: '24px', // default <Icon> size applied
    class: 'icon', // default <Icon> class applied
    mode: 'css', // default <Icon> mode applied
    aliases: {
      nuxt: 'logos:nuxt-icon',
    },
  },
})
