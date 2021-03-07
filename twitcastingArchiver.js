// Twitcasting Archiver

// Watches for new streams from a Twitcaster user
// Downloads streams, metadata, timestamped chat, and generates replay webpage

// usage: node twitcastingArchiver.js streamerId passwordFile(optional)


// Dependencies
// Streamlink: https://streamlink.github.io
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');
const WebSocketClient = require('websocket').client;
const {spawn, fork} = require('child_process');
const {stripIndents} = require('common-tags');

// Settings
const streamer = process.argv[2]
const pwFile = process.argv[3]
const archiveDir = 'archive'

// Helper functions
const getTimestamp = () => Math.floor(Date.now() / 1000)
const log = (msg) => console.warn(msg)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

// Get a viewer token (necessary to obtain stream metadata JSON)
const getViewerToken = async (liveId, pw) => {
  const resp = await fetch('https://twitcasting.tv/happytoken.php', {
    'headers': {'content-type': 'multipart/form-data; boundary=xxxx'},
    'method': 'POST',
    'body': stripIndents`--xxxx
    Content-Disposition: form-data; name="movie_id"

    ${liveId}
    ${pw?`--xxxx\nContent-Disposition: form-data; name="password"\n\n${pw}`:''}
    --xxxx--`
  })
  const token = await resp.json()
  return token.token
}

// Get the ID of the livestream
const getLiveId = async (streamer) => {
  const resp = await fetch(`https://twitcasting.tv/${streamer}/show/`)
  const source = await resp.text()
  const isStreaming = source.includes(' LIVE ')
  if (!isStreaming) return false
  const regex = new RegExp(`${streamer}/movie/\\d+`, 'i')
  const liveId = source.match(regex)[0].match(/\d+$/)[0]
  return liveId
}

// Get a metadata JSON of the stream
const getMetadata = async (liveId, pw) => {
  const token = await getViewerToken(liveId, pw)
  const resp = await fetch(` https://frontendapi.twitcasting.tv/movies/${liveId}/status/viewer?token=${token}`)
  const metadata = await resp.json()
  return metadata
}

// Resolve with liveId when streamer is live
const isStreaming = (streamer) => new Promise(async (resolve) => {
  log(`Waiting for ${streamer} to be live...`)
  while (true) {
    const liveId = await getLiveId(streamer)
    if (liveId) return resolve(liveId)
    sleep(15000)
  }
})

// Get the URL of the chat websocket
const getChatWsURL = async (liveId, pw) => {
  const resp = await fetch('https://twitcasting.tv/eventpubsuburl.php', {
    'headers': {'content-type': 'multipart/form-data; boundary=xxxx'},
    'method': 'POST',
    'body': stripIndents`--xxxx
    Content-Disposition: form-data; name="movie_id"

    ${liveId}
    ${pw?`--xxxx\nContent-Disposition: form-data; name="password"\n\n${pw}`:''}
    --xxxx--`
  })
  const wsURLJSON = await resp.json()
  return wsURLJSON.url
}

// Chat downloader
const dlChat = (targetFile, liveId, pw) => new Promise(async (resolve) => {
  const startTime = getTimestamp() + 2
  const chatLogStream = fs.createWriteStream(targetFile, {flags:'a'})
  const chatWsURL = await getChatWsURL(liveId, pw)
  const wsClient = new WebSocketClient();
  wsClient.on('connectFailed', (err) => log(err.toString()))
  wsClient.on('connect', (ws) => {
    log(`Now downloading chat to ${targetFile}`)
    ws.on('error', (err) => log('Chat error: ' + err.toString()))
    ws.on('message', (msg) => {
      if (msg.type !== 'utf8') return
      const msgObj = JSON.parse(msg.utf8Data)[0]
      if (msgObj == undefined || msgObj.type !== 'comment') return
      const msgText = msgObj.htmlMessage ?? msgObj.message
      const timestamp = getTimestamp() - startTime
      const exportedMsg = {
        nick: msgObj.author.name,
        id: msgObj.author.id,
        avatar: msgObj.author.profileImage,
        text: msgText,
        timestamp: timestamp
      }
      chatLogStream.write(JSON.stringify(exportedMsg)+'\n')
    })
    return resolve(ws)
  })
  wsClient.connect(chatWsURL)
})

// Video downloader
const dlVideo = (targetFile, streamer, pw) => {
  const arguments = [
    '-o', `${targetFile}`,
    `https://twitcasting.tv/${streamer}`,
    'best'
  ]
  if (pw) arguments.push('--twitcasting-password', pw)
  const downloader = spawn('streamlink', arguments)
  const uselessMsgs = [
    'Found matching',
    'Available streams',
    'Opening stream',
    'Stream ended',
    'string argument'
  ]
  downloader.stdout.on('data', data => {
    if (uselessMsgs.some(uselessMsg => !data.includes(uselessMsg))) return
    log(`(STREAMLINK) ${data}`)
  })
  downloader.stderr.on('data', data => log(`(STREAMLINK) ${data}`))
  downloader.on('error', error => log(`(STREAMLINK) ${error.message}`))

  log(`Now downloading video to ${targetFile}`)
  return downloader
}

// Stream archiver
const dlStream = (dir, streamer, liveId, pw) => new Promise(async (resolve) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir)
  const startTime = getTimestamp()
  const chatLogFile = path.join(dir, `/${streamer}_${startTime}.chat.jsonl`)
  const videoFile = path.join(dir, `${streamer}_${startTime}.mp4`)
  const metadataFile = path.join(dir, `${streamer}_${startTime}.info.json`)

  const videoDownloader = dlVideo(videoFile, streamer, pw)
  videoDownloader.stdout.on('data', data => {
    if ( data.includes('without an encoding') ) {
      // || data.includes('Stream ended') ) {
      resolve()
      chatDownloader.close()
      videoDownloader.kill()
      return fork('./generateHTMLViewer.js', [videoFile])
    }
  })

  const chatDownloader = await dlChat(chatLogFile, liveId, pw)

  const metadata = await getMetadata(liveId, pw)
  metadata.user = streamer
  fs.writeFile(metadataFile, JSON.stringify(metadata), () => {
    log(`Downloaded metadata to ${metadataFile}`)
  })
})

// Main function
;(async () => {
  while (true) {
    const liveId = await isStreaming(streamer)
    const pw = (pwFile ? fs.readFileSync(pwFile).toString().trim() : "")
    log(`${streamer} is streaming. Downloading now.`)
    await dlStream(archiveDir, streamer, liveId, pw)
  }
})()
