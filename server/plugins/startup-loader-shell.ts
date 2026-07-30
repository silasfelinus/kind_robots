export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    html.bodyPrepend.push(`
      <div class="kr-prehydrate-loader" aria-hidden="true">
        <div class="kr-prehydrate-content">
          <div class="kr-prehydrate-heading">Building Kind Robots...</div>

          <div class="kr-prehydrate-visual"></div>

          <div class="kr-prehydrate-status">
            <span class="kr-prehydrate-spinner">
              <i></i><i></i><i></i><i></i>
              <i></i><i></i><i></i><i></i>
            </span>

            <div class="kr-prehydrate-message">
              <span>Wiring robots for suspicious levels of charm...</span>
              <span>Downloading charm...</span>
              <span>Releasing digital butterflies...</span>
            </div>
          </div>
        </div>
      </div>
    `)
  })
})
