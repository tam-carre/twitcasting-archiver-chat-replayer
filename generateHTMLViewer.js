// Dependencies
const fs = require('fs');
const fsR = require('fs-reverse');
const path = require('path');

// Settings
const videoFile = process.argv[2]

const dir = path.parse(videoFile).dir
const name = path.parse(videoFile).name
const ext = path.parse(videoFile).ext
const chatFile = path.join(dir, `${name}.chat.jsonl`)
const metadataFile = path.join(dir, `${name}.info.json`)
const outputName = `${name}.html`
const outputFile = path.join(dir, outputName)

// Script
console.log(`Writing HTML viewer to ${outputFile}.`)
if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile)
const pageStream = fs.createWriteStream(outputFile, {flags:'a'})

// Append header
const metadataString = fs.readFileSync(metadataFile)
const meta = JSON.parse(metadataString)
const catId = (meta.movie.category ? meta.movie.category.id : '')
const catName = (meta.movie.category ? meta.movie.category.name : '')
const title = meta.movie.title ?? '無題'
const pageHeader = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width">
      <link rel="stylesheet" href="./assets/style.css">
      <link href="https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=block" rel="stylesheet">

      <title>${name}</title>
    </head>
    <body>
      <div id="page" class="page">
        <div class="vid-block">
          <div class="info">
            <div class="title">
              <a href="https://twitcasting.tv/${meta.user}/movie/${meta.movie.id}">
                ${title}
              </a>
            </div>
            <div class="streamer">
              <a href="https://twitcasting.tv/${meta.user}">
                @${meta.user}
              </a>
            </div>
            <div class="category">
              <a href="https://twitcasting.tv/genre=${catId}">
                ${catName}
              </a>
            </div>
          </div>
          <div class="vid">
            <video controls id="video">
              <source src="${encodeURIComponent(name)}${ext}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
          </div>
        </div>
        <div class="chat">
          <h2>コメント</h2>
            <div id="comments" class="comments">
            </div>
          </div>
        </div>
        <script>
          const comments = [
`
pageStream.write(pageHeader)

// Append comments
const readStream = fsR(chatFile, {})
readStream.on('data', (line) => {
  if (!line) return
  const msg = JSON.parse(line)
  msg.text = msg.text.replace(/src=\"\/img/g, 'src="https://twitcasting.tv/img')
  pageStream.write(JSON.stringify(msg)+',\n')
})

// Append footer
readStream.on('end', () => {
  const pageFooter = `
          ]
let maxComments = 20

const convertSeconds = (x) => new Date(x * 1000).toISOString().substr(11, 8)

const mk = (tag, cls, parent, options) => {
  const el = document.createElement(tag)
  el.classList.add(cls)
  if (parent) parent.appendChild(el)
  if (options == null) return el
  for (const [key, value] of Object.entries(options)) el[key] = value
  return el
}

const makeComment = (json) => {
  const profile =  \`https://twitcasting.tv/\${json.id}\`
  const container = document.getElementById('comments')

  const comment = mk('div', 'comment', container, {
    'dataset': {'timestamp': json.timestamp}
  })
  const avatar = mk('div', 'avatar', comment)
  const avatarLink = mk('a', 'profileLink', avatar, { 'href': profile })
  mk('img', 'avatar-img', avatarLink, {
    'src': json.avatar,
    'alt': json.id,
  })
  const message = mk('div', 'message', comment)
  const author = mk('div', 'author', message)
  mk('a', 'author-link', author, {
    'href': profile,
    'innerHTML': json.nick
  })
  mk('span', 'timestamp', author, {
    'innerHTML': convertSeconds(json.timestamp)
  })
  mk('div', 'text', message, { 'innerHTML': json.text })
}

window.addEventListener('load', () => {
  // const commentEls = document.getElementsByClassName('comment')
  const visible = document.getElementsByClassName('comment')
  const vid = document.getElementById('video')
  const container = document.getElementById('comments')

  let oldTime = vid.currentTime
  vid.addEventListener('timeupdate', () => {
    let time = vid.currentTime
    if (Math.abs(oldTime - time) < 1) return
    // for (const el of visible) el.remove()
    container.innerHTML = ''
    const shown = comments.filter(x => x.timestamp <= time).slice(0, maxComments)
    shown.forEach(x => makeComment(x))
    oldTime = time
  })
})

        </script>
      </body>
    </html>
  `
  pageStream.write(pageFooter)
})
