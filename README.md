# twitcasting-archiver-chat-replayer
TACR downloads all new streams by a TwitCasting user and produces a live chat replay.
Since TwitCasting doesn't save chat message timestamps, it is difficult to re-live special moments.
With this script, you can.

![Demonstration of twitcasting-archiver-chat-replay](https://i.imgur.com/g4yKiG2.gif)

## Setup
[Install Streamlink](https://streamlink.github.io/install.html). Currently, you must install a development build if you want to archive password-protected streams.

Clone the repository and install dependencies:
```sh
git clone https://github.com/alnj/twitcasting-archiver-chat-replayer/
cd twitcasting-archiver-chat-replayer
npm install
```

## Usage
To continuously watch for new streams and archive them as they go live:
```sh
node twitcastingArchiver.js streamerName passwordFile(optional)
```

If something went wrong and you need to (re-)generate the HTML viewer yourself:
```sh
node generateHTMLViewer.js pathToVideo.mp4
```

## Known issues
- Currently the implementation is too naive for huge numbers of comments. (hangs on seeking)
- Untested on platforms other than Linux. Feel free to open an issue in case of bugs. Please do open an issue to let me know if it works as expected also.
- (Solved?) HTML generation might occur twice at once resulting in a corrupted file. If this happens run the above command to re-generate the page.

