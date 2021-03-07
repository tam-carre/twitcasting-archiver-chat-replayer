let maxComments = 20

window.addEventListener('load', () => {
  const comments = document.getElementsByClassName('comment')
  const visible = document.getElementsByClassName('visible')
  const vid = document.getElementById('video')

  let oldTime = vid.currentTime
  vid.addEventListener('timeupdate', () => {
    let time = vid.currentTime
    if (Math.abs(oldTime - time) < 1) return

    if (oldTime < time) {
      for (const comment of comments) {
        if (comment.dataset.timestamp > time) continue
        if (comment.classList.contains('visible')) break
        comment.classList.add('visible')
        if (visible.length > maxComments) {
          visible.item(visible.length-1).classList.remove('visible')
        }
      }
    }

    else {
      for (const comment of comments) {
        if ( comment.dataset.timestamp > time
          || visible.length >= maxComments
        ) {
          comment.classList.remove('visible')
          continue
        }
        comment.classList.add('visible')
      }
    }

    oldTime = time
  })
})
