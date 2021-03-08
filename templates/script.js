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
  const profile =  `https://twitcasting.tv/${json.id}`
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
