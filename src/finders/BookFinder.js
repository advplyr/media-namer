var gbooks = require('../sources/gbooks')
var { levenshteinDistance } = require('../utils')

class BookFinder {
  constructor() { }

  cleanFileTitle(parsed_title, book) {
    var authors = book.authors
    var _title = parsed_title.toLowerCase()
    authors.forEach((author) => {
      if (_title.includes(author.toLowerCase())) {
        _title = _title.replace(author.toLowerCase(), '')
      }
    })
    if (_title.startsWith(' - ')) _title = _title.replace(' - ', '')
    if (_title.endsWith(' - ')) _title = _title.replace(' - ', '')
    return _title.trim()
  }

  async find(fileObj, identifier) {
    var basename = fileObj.basename
    var parsed = fileObj.parsed
    var book_results = await (identifier ? gbooks.findByISBN(identifier) : gbooks.search(basename))

    if (!book_results || !book_results.length) {
      return {
        error: 'No matches'
      }
    }

    var author_matched = book_results.filter(bookresult => {
      if (bookresult.authors && bookresult.authors.length) {
        return bookresult.authors.find(author => {
          return basename.toLowerCase().includes(author.toLowerCase())
        })
      }
      return false
    })

    var has_author_match = author_matched.length
    var books_to_match = has_author_match ? author_matched : book_results
    var closest_books = null
    var closest_leven = null

    books_to_match.forEach((book) => {
      var _title = this.cleanFileTitle(parsed.title, book)
      var levenshtein = levenshteinDistance(_title, book.title)
      if (closest_leven === null || levenshtein < closest_leven) {
        closest_leven = levenshtein
        closest_books = [book]
      } else if (levenshtein === closest_leven) {
        closest_books.push(book)
      }
    })

    var books_ebook_available = closest_books.filter(book => book.isEbookAvailable)
    closest_books = books_ebook_available.length ? books_ebook_available : closest_books


    var best_match = closest_books[0]
    for (let i = 1; i < closest_books.length; i++) {
      var _book = closest_books[i]
      if (_book.ratingsCount > best_match.ratingsCount) {
        best_match = _book
      }
    }

    best_match.authors = best_match.authors.join(', ')

    return {
      levenshtein: closest_leven,
      media: best_match
    }
  }
}
module.exports = new BookFinder()