## Overall Instructions

Consider this a new project.

This app is now a "wetransfer" clone, or file transfer site.
I want anyone to be able to uplaod a file, that can then be publically downloaded using a optional passcode (set during upload)

My suggestion is we upload the file eg : "examplefile.mp4" to s3 to a /files bucket.
we then upload another file that we generate containing meta data to /links bucket.
The meta data file can contain the real path to the file to download, as well as the file name, the file size, and a passcode, and an expiry date (7 days?)

when the user is provided a UID eg : files.com/UID it will grab the meta data file, display some basic info about the file, optionally ask for the passcode, and then display the download link (or embed the file for viewing )

This way - no database is required, 

A simple endpoint /clean can be used to read all avaliable /links files, and delete any files past their expiry date

## Tech Stack
Always use Bun.js never node.js 

Use Vite, Vue3, Vue-router, PrimeVue v4 
Note that PrimeVue v4 themeing is different to v3. Use Aura theme
https://primevue.org/theming/styled/

This will be a front-end only app, so no express or similar.

I want the file upload to be handled using uppy, so we get nice feedback. https://uppy.io - 
Store directly using s3? - Uppy Supports S3

https://dsl-test-bucket.lon1.digitaloceanspaces.com
ID : REDACTED_ACCESS_KEY  - SECRET : REDACTED_SECRET_KEY

Finally If the uploaded item is a image file, or a mp4 video file, i want the public user to be able to view it without downloading it - so please embed a video player. - I like plyr. https://plyr.io

The UI should be light, modern and "magical"

## REALLY IMPORTANT
The system must be able to deal with large files - eg 5GB - so reliable resumable upload is important.