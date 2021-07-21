const socket = io('/')
const videoGrid = document.getElementById('video-grid')
let Peer = window.Peer;
const peer = new Peer({
    host: '/',
    path: '/peerjs',
    debug: 3,
    port: 80,
    secure: false,
});

console.log('***Created peer instance, userId: ' + peer.id)

// Function to obtain stream and then await until after it is obtained to go into video chat call and answer code. Critical to start the event listener ahead of everything to ensure not to miss an incoming call.

const ownVideo = document.createElement('video') // Own Video
ownVideo.muted = true
const peers = {}
// On Receiving Other Persons Call
peer.on("call", async (call) => {
    try {
        let stream = null;
        stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        call.answer(stream) // Send Video Stream On Answer
        const video = document.createElement('video');
        // Send Back Video Stream On Stream
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        });
    }
    catch (err) {
        /* handle the error */
        console.log('*** ERROR returning the stream: ' + err);
    }
});

    (async () => {
        try {
            let stream = null;
            stream = await navigator.mediaDevices.getUserMedia(
                {
                    audio: true,
                    video: true,
                });
            if (stream != undefined) {
                addVideoStream(ownVideo, stream);
                console.log('added own Video stream');
            } else {
                console.log('You can only access your audio/video media streams over https');
                alert('Sorry retry using https, for security reasons Google Media blocks access to your video stream over unsecure http connections');
            }
        } catch (err) {
            /* handle the error */
            console.log('*** ERROR returning the stream: ' + err);
            alert('Sorry retry using https, for security reasons Google Media blocks access to your video stream over unsecure http connections');
        }
    })();


socket.on('user-connected', userId => { // Allow Self To Be Connected To Others
    console.log('User Connected: ' + userId)
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    }).then(stream => {
        connectToNewUser(userId, stream)
    })
})

socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
})

peer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
    const call = peer.call(userId, stream) // We Connect To Other User
    const video = document.createElement('video')
    call.on('stream', userVideoStream => { // Other User Connects To Us
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => { // Other User Disconnects
        video.remove()
    })

    peers[userId] = call
}

function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(video)
}