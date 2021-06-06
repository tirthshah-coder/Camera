//Camera ka access karna hai toh JS/Node mei toh kuch hai nahi so Browser ki help se kar sakte hai so we use BOM(Browser Object Modal)
let video = document.querySelector("video");
let constraints = {video: true, audio: true};  // what we have to access, you can pass here
let vidBtn = document.querySelector("button#record");
let capBtn = document.querySelector("button#capture");
let mediaRecorder;
let isRecording = false;
let chunks = [];

let filters = document.querySelectorAll(".filters");
let body = document.querySelector("body");

let galleryBtn = document.querySelector("#gallery");

galleryBtn.addEventListener("click", function(){
    location.assign("gallery.html");
})

// canvas will use image filter dalne ke liye
let filter = "";

let zoomIn = document.querySelector(".zoomIn");
let zoomOut = document.querySelector(".zoomOut");

let minZoom = 1;
let maxZoom = 3;
let currZoom = 1;

for(let i = 0; i < filters.length; i++){
    filters[i].addEventListener("click", function(e){
        filter = e.currentTarget.style.backgroundColor;
        // We have to first remove selected color then apply new one otherwise color will be override
        removeFilter();
        applyFilter(filter);
    })
}

vidBtn.addEventListener("click", function(){
    let innerDiv = vidBtn.querySelector("div");
    if(isRecording){
        isRecording = false;
        mediaRecorder.stop();   
        innerDiv.classList.remove("record-animation");
    }else{
        isRecording = true;
        mediaRecorder.start();
        // Bcoz we dont want filter during recording bcoz it is GPU Expensive
        filter = "";
        removeFilter();
        // We dont want zoom in recording bcoz gpu expensive
        video.style.transform = `scale(1)`;
        currZoom = 1;
        innerDiv.classList.add("record-animation");
    }
});

capBtn.addEventListener("click", function(){
    let innerDiv = capBtn.querySelector("div");
    innerDiv.classList.add("capture-animation");
    setTimeout(function(){
        innerDiv.classList.remove("capture-animation");
    }, 500);
    
    capture();
});

zoomIn.addEventListener("click", function(){
    if(currZoom < maxZoom){
        currZoom += 0.1;
        video.style.transform = `scale(${currZoom})`;
    }
});

zoomOut.addEventListener("click", function(){
    if(currZoom > minZoom){
        currZoom -= 0.1;
        video.style.transform = `scale(${currZoom})`;
    }
});

//navigator is BOM object -> mediaDevices obj -> getUserMedia is function which return promise if we give permission access then we get mediaStream obj(Jo camera view kar raha hai)so we attach video.srcObject to mediaStream 

navigator.mediaDevices.getUserMedia(constraints)
    .then(function(mediaStream){
        video.srcObject = mediaStream;
        mediaRecorder = new MediaRecorder(mediaStream);   // to record videos
        // MediaRecorder has 2 main events : 1. DataAvailable 2. Stop
        //1. Jab bhi mediaRecorder ki limit kam ho jayegi woh dataavailable event ko call karke chunks mei dal dega.
        mediaRecorder.addEventListener("dataavailable", function(e){
            chunks.push(e.data);         
        });

        mediaRecorder.addEventListener("stop", function(e){
            //2. Jab bhi recording stop karoge then stop event will occur

            // Blob is large raw data(binary) : Jo chunks hai woh collect karke ek large file create kar dega and we specify which type of file it is.
            let blob = new Blob(chunks, {type: "video/mp4"});
            // pura blob pass kar rahe hai bcoz if we pass blob url then what happens it is pointer that pointing to ram jab refresh karege toh ram mei se url chala jayega toh pointer null ko point karega thats why we pass whole blob
            addMedia("video", blob);    
            chunks = [];
            
            // blob file browser mei kahi hogi so uska url create kar diya
            // let url = URL.createObjectURL(blob);

            // // <a href="someurl" download="video.mp4"></a>
            // let a = document.createElement("a");
            // a.href = url;
            // a.download = "video.mp4";
            // a.click();
            // a.remove();
        })
    });

function capture(){
    let c = document.createElement("canvas");
    c.width = video.videoWidth;   // video jo play ho raha hai uski widht and height
    c.height = video.videoHeight;
    let ctx = c.getContext("2d");

    // Jab hum zoom in/out karege toh canvas ka top-left mid hota hai so hume actual mei usko mid point pe lana hoga.
    ctx.translate(c.width / 2, c.height / 2);
    // Scale kar do humari currZoom ki value jitna.
    ctx.scale(currZoom, currZoom);
    // Scale ho jaye uske baad wapas hum woh point pe chale jayega bcoz hume top-left se mid tak ka chahiye pic.
    ctx.translate(-c.width / 2, -c.height / 2);

    ctx.drawImage(video, 0, 0);

    // When we capture img if filter selected then filter capture img should be downloaded
    if(filter != ""){
        ctx.fillStyle = filter;
        ctx.fillRect(0,0,c.width,c.height);
    }

    // let a = document.createElement("a");
    // a.download = "image.jpg";
    // a.href = c.toDataURL();   // Return the current content of canvas as an image
    // Img case mei pointer nahi hoga bcoz isme pura data hoga so url stored
    addMedia("img", c.toDataURL()); 
    // a.click();    // so it starts download
    // a.remove();
}

function applyFilter(filterColor){
    let filterDiv = document.createElement("div");
    filterDiv.classList.add("filter-div");
    filterDiv.style.backgroundColor = filterColor;
    body.appendChild(filterDiv);
}

function removeFilter(){
    let filterDiv = document.querySelector(".filter-div");
    if(filterDiv){
        filterDiv.remove();
    }
}