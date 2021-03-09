let maxComments = 20

const convertSeconds = (x) => new Date(x * 1000).toISOString().substr(11, 8)
const makeComment = (json, container) => {
  const profile =  `https://twitcasting.tv/${json.id}`
  const commentHTML = html`
    <div class="comment">
      <div class="avatar">
        <a class="profileLink" href="${profile}">
          <img class="avatar-img" src="${json.avatar}" alt="${json.id}">
        </a>
      </div>
      <div class="message">
        <div class="author">
          <a class="author-link" href="${profile}">${json.nick}</a>
          <span class="timestamp">${convertSeconds(json.timestamp)}</span>
        </div>
        <div class="text">${json.text}</div>
      </div>
    </div>
  `
  container.insertAdjacentHTML('beforeend', commentHTML)
}

window.addEventListener('load', () => {
  const vid = document.getElementById('video')
  const container = document.getElementById('comments')

  let oldTime = vid.currentTime
  vid.addEventListener('timeupdate', () => {
    let time = vid.currentTime
    if (Math.abs(oldTime - time) < 1) return
    container.innerHTML = ''
    const shown = comments.filter(x => x.timestamp <= time).slice(0, maxComments)
    shown.forEach(x => makeComment(x, container))
    oldTime = time
  })
})
