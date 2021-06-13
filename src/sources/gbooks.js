const axios = require('axios')
const GBOOKS_API_KEY = process.env.GBOOKS_API_KEY

function cleanBookPayload(bookPayload) {
  var volumeInfo = bookPayload.volumeInfo || {}
  var publishedDate = volumeInfo.publishedDate
  var year = publishedDate ? publishedDate.split('-').shift() : 'N/A'
  var image = volumeInfo.imageLinks ? volumeInfo.imageLinks.thumbnail || null : null
  if (image && image.startsWith('http://')) {
    image = 'https' + image.substr(4)
  }
  var authors = volumeInfo.authors
  var ratingsCount = volumeInfo.ratingsCount
  var pageCount = volumeInfo.pageCount
  var publisher = volumeInfo.publisher
  var infoLink = volumeInfo.infoLink

  var saleInfo = bookPayload.saleInfo
  var saleability = saleInfo.saleability
  var isEbookAvailable = saleInfo.isEbook
  var accessInfo = bookPayload.accessInfo
  var isEpubAccessible = accessInfo.epub.isAvailable
  var viewability = accessInfo.viewability

  var industryIdentifiers = volumeInfo.industryIdentifiers || []
  var isbn10obj = industryIdentifiers.find(ii => ii.type === 'ISBN_10')
  var isbn13obj = industryIdentifiers.find(ii => ii.type === 'ISBN_13')

  return {
    id: bookPayload.id,
    title: volumeInfo.title,
    year,
    image,
    authors,
    ratingsCount,
    pageCount,
    publisher,
    saleability,
    isEbookAvailable,
    isEpubAccessible,
    isbn10: isbn10obj ? isbn10obj.identifier : null,
    isbn13: isbn13obj ? isbn13obj.identifier : null,
    infoLink,
    viewability
  }
}

async function search(search_text) {
  var uri = `https://www.googleapis.com/books/v1/volumes?q=${search_text}&key=${GBOOKS_API_KEY}`
  return axios.get(uri).then((axiosRes) => {
    const books = axiosRes.data.items.map(i => cleanBookPayload(i))
    return books
  }).catch((error) => {
    console.log('Failed', error)
    return []
  })
}
module.exports.search = search

function findByISBN(isbn) {
  var uri = `https://www.googleapis.com/books/v1/volumes?q=${isbn}:isbn&key=${GBOOKS_API_KEY}`
  return axios.get(uri).then((axiosRes) => {
    const books = axiosRes.data.items.map(i => cleanBookPayload(i))
    return books
  }).catch((error) => {
    console.log('Failed', error)
    return []
  })
}
module.exports.findByISBN = findByISBN