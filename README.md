# Media Namer

Renames your downloaded media. Movies, series, books and audiobooks. Uses a Web GUI.


I made this for my own use since I didn't find good free alternatives. May expand on this for music.

## Requirements

Requires OMDB Api key for movies/series and Google Books Api key if you want to use it for books/audiobooks.

These environment variables need to be set.
```es6
process.env.GBOOKS_API_KEY
process.env.OMDB_API_KEY
```

## Docker

https://hub.docker.com/r/mcoop320/media-namer/

Built to primarily run as a docker container in my Unraid server.

## Example Rename

Directories and contents are always copied.

`/media/great.movie.2017.1080p/great.movie.mkv` => `/output/Great Movie (2017)/Great Movie (2017).mkv`
`/media/great.movie.2017.1080p/english.srt` => `/output/Great Movie (2017)/Great Movie (2017) [English].srt`

