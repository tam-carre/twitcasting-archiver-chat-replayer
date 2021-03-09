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

const style = fs.readFileSync('templates/style.css')

const pageHeader = html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width">
      <link href="https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=block" rel="stylesheet">

      <style>
        ${style}
      </style>

      <title>${name}</title>
    </head>
    <body>
      <div id="page">
        <div id="vid-block">
          <div id="info">
            <div id="title">
              <a href="https://twitcasting.tv/${meta.user}/movie/${meta.movie.id}">
                ${title}
              </a>
            </div>
            <div id="streamer">
              <a href="https://twitcasting.tv/${meta.user}">
                @${meta.user}
              </a>
            </div>
            <div id="category">
              <a href="https://twitcasting.tv/genre=${catId}">
                ${catName}
              </a>
            </div>
          </div>
          <div id="vid">
            <video controls id="video">
              <source src="${encodeURIComponent(name)}${ext}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
          </div>
        </div>
        <div id="chat">
          <h2>コメント</h2>
            <div id="comments">
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
  const script = fs.readFileSync('templates/script.js')
  const pageFooter = `
          ]
          ${script}
        </script>
      </body>
    </html>
  `
  pageStream.write(pageFooter)
})
