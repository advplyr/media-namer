function buildInput(name, label_text, value = null) {
  var label = document.createElement('label')
  label.className = 'field'
  label.style.width = '400px'
  label.style.display = 'block'
  label.style.marginTop = '6px'

  var input = document.createElement('input')
  input.type = 'text'
  input.placeholder = ' '
  input.className = 'field__input'
  if (value) {
    input.value = value
  }
  input.id = `${name}`
  label.appendChild(input)

  var span = document.createElement('span')
  span.className = 'field__label-wrap'
  var innerspan = document.createElement('span')
  innerspan.className = 'field__label'
  innerspan.innerText = label_text
  span.appendChild(innerspan)
  label.appendChild(span)

  return label
}

function buildButton(name, text, clickevt) {
  var btn = document.createElement('button')
  btn.innerText = text
  btn.id = name
  btn.style.marginTop = '10px'
  btn.addEventListener('click', clickevt)
  return btn
}

function buildLookupResponse(data, file_id) {
  var parent = document.getElementById(`media-${file_id}`)

  if (parent.firstChild) {
    parent.firstChild.remove()
  }

  if (data.warning) {
    var msg = document.createElement('p')
    msg.innerText = data.warning
    parent.appendChild(msg)
  }

  var container = document.createElement('div')
  container.id = `lookupresponse-${file_id}`
  container.style.width = '100%'
  container.style.maxWidth = '600px'
  container.style.margin = 'auto'
  container.style.display = 'flex'
  container.style.alignItems = 'center'

  if (data.media) {
    var boxleft = document.createElement('div')

    var img = document.createElement('img')
    img.height = 150
    // img.style.height = '100%'
    img.style.marginRight = '15px'
    img.src = data.media.image
    boxleft.appendChild(img)

    container.appendChild(boxleft)

    var box = document.createElement('div')


    if (data.media_type === 'movies') {
      var titleContainer = buildInput(`newtitle-${file_id}`, 'Title', `${data.media.title} (${data.media.year})`)
      box.appendChild(titleContainer)
      var variantContainer = buildInput(`variant-${file_id}`, 'Variant')
      box.appendChild(variantContainer)
      var existingVariantContainer = buildInput(`existingvariant-${file_id}`, 'Existing Variant')
      box.appendChild(existingVariantContainer)
    } else if (data.media_type === 'series') {
      var titleContainer = buildInput(`newtitle-${file_id}`, 'Title', `${data.media.title} (${data.media.year})`)
      box.appendChild(titleContainer)
      var episodeTitleContainer = buildInput(`episodetitle-${file_id}`, 'Episode Title', data.media.episode_title)
      box.appendChild(episodeTitleContainer)
      var seasonContainer = buildInput(`season-${file_id}`, 'Season', data.media.season)
      box.appendChild(seasonContainer)
      var episodeContainer = buildInput(`episode-${file_id}`, 'Episode', data.media.episode)
      box.appendChild(episodeContainer)
    } else if (data.media_type === 'books' || data.media_type === 'audiobooks') {
      var titleContainer = buildInput(`newtitle-${file_id}`, 'Title', data.media.title)
      box.appendChild(titleContainer)
      var authorsContainer = buildInput(`authors-${file_id}`, 'Author(s)', data.media.authors)
      box.appendChild(authorsContainer)
    }

    var renamebtn = buildButton(`renamebtn-${file_id}`, 'Rename', () => {
      rename(file_id)
    })
    renamebtn.style.width = '100%'
    box.appendChild(renamebtn)

    var resetbtn = buildButton(`resetbtn-${file_id}`, 'Reset', () => {
      var lookupbtn = document.getElementById(`lookupbtn-${file_id}`)
      var lookupimdbwrapper = document.getElementById(`lookupimdb-wrapper-${file_id}`)
      lookupbtn.style.display = ''
      lookupimdbwrapper.style.display = ''

      var itemsWrapper = document.getElementById(`mediaitems-${data.media_type}`)
      var itemsInner = document.getElementById(`mediaitems-inner-${data.media_type}`)
      itemsWrapper.style.height = itemsInner.clientHeight - container.clientHeight + 'px'

      container.remove()
    })
    resetbtn.style.padding = '4px 5px'
    box.appendChild(resetbtn)

    container.appendChild(box)

    var lookupbtn = document.getElementById(`lookupbtn-${file_id}`)
    if (lookupbtn) {
      lookupbtn.style.display = 'none'
    }

    var lookupimdbwrapper = document.getElementById(`lookupimdb-wrapper-${file_id}`)
    if (lookupimdbwrapper) {
      lookupimdbwrapper.style.display = 'none'
    }
  } else {
    var msg = document.createElement('p')
    msg.innerText = data.error
    container.appendChild(msg)
  }

  if (parent) {
    parent.appendChild(container)

    var itemsWrapper = document.getElementById(`mediaitems-${data.media_type}`)
    var itemsInner = document.getElementById(`mediaitems-inner-${data.media_type}`)
    itemsWrapper.style.height = itemsInner.clientHeight + 'px'
  } else {
    console.warn('No Parent')
  }
}
