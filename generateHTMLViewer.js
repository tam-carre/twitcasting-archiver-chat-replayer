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

// Helpers
const convertSeconds = (x) => new Date(x * 1000).toISOString().substr(11, 8)

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
      <script src="./assets/script.js"></script>

      <title>${name}</title>
    </head>
    <body>
      <div class="page">
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
            <div class="comments">
`
pageStream.write(pageHeader)

// Append comments
const readStream = fsR(chatFile, {})
readStream.on('data', (line) => {
  if (!line) return
  const msg = JSON.parse(line)
  const text = msg.text.replace(/src=\"\/img/g, 'src="https://twitcasting.tv/img')
  const commentTag = `
    <div class="comment" data-timestamp="${msg.timestamp}">
      <div class="avatar">
        <a href="https://twitcasting.tv/${msg.id}">
          <img src="${msg.avatar}" alt="${msg.id}">
        </a>
      </div>
      <div class="message">
        <div class="author">
          <a href="https://twitcasting.tv/${msg.id}">${msg.nick}</a>
          <span class="timestamp">${convertSeconds(msg.timestamp)}</span>
        </div>
        <div class="text">
          ${text}
        </div>
      </div>
    </div>
  `
  pageStream.write(commentTag)
})

// Append footer
readStream.on('end', () => {
  const pageFooter = `
            </div>
          </div>
        </div>
      </body>
    </html>
  `
  pageStream.write(pageFooter)
})

