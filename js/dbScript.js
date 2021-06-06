// Database create/open => camera
// Database object/store => gallery
// photo capture / video record => gallery(obs) store
// format:
// data = {
    // mId: 1585884,
    // type: img/video
    // media: actual apka content (img => c.toDataUrl, video => blob)
// }

// indexedDb mai pura blob store kara sakte ho. localstorage mei nai kara sakte

let dbAccess;
let container = document.querySelector(".container");
let request = indexedDB.open("Camera", 1);

request.addEventListener("success", function(){
    dbAccess = request.result;
});

request.addEventListener("upgradeneeded", function(){
    let db = request.result;
    db.createObjectStore("gallery", {keyPath: "mId"});
});

request.addEventListener("error", function(){
    alert("some error occured");
})

function addMedia(type, media){
    // Tabhi chalega jab dbAccess hoga
    let tx = dbAccess.transaction("gallery", "readwrite");
    let galleryObjectStore = tx.objectStore("gallery");
    let data = {
        mId: Date.now(),
        type,
        media
    };

    galleryObjectStore.add(data);
}


function viewMedia(){
    // Tabhi chalega jab dbAccess hoga
   // Showing all img/video in gallery that are stored in db 
    let tx=dbAccess.transaction("gallery","readonly");
    let galleryObjectStore=tx.objectStore("gallery");
    let req = galleryObjectStore.openCursor();
    req.addEventListener("success" , function(){
    let cursor = req.result;

    if(cursor){
        let div = document.createElement("div");
        div.classList.add("media-card");
        div.innerHTML= `<div class = "media-container">
        </div>
        <div class = "action-container">
        <button class = "media-download">Download</button>
        <button class = "media-delete" data-id = ${cursor.value.mId}>Delete</button>
        </div>`;
        let downloadbtn = div.querySelector(".media-download");
        let deletebtn = div.querySelector(".media-delete");
        
        deletebtn.addEventListener("click" , function(e){
            let mId = e.currentTarget.getAttribute("data-id");
            console.log(cursor.value.mId)
            console.log("mId", mId);
            // Delete from UI
            e.currentTarget.parentElement.parentElement.remove();  // media-card remove
            // Delete from indexedDB
            deleteMediaFromDB(mId);
        });

        if(cursor.value.type == "img"){
            let img = document.createElement("img")
            img.classList.add("media-gallery");
            img.src = cursor.value.media;  // cursor.value gives object
            let mediaContainer = div.querySelector(".media-container");
            mediaContainer.appendChild(img)

            downloadbtn.addEventListener("click" , function(e){
                let a = document.createElement("a")
                a.download = "image.jpg";
                a.href = img.src;   // img.src has src of image as above
                a.click();
                a.remove();

            });

        }else{
            // cursor.value.type = "video means blob"
            let video = document.createElement("video")
            video.classList.add("media-gallery");
            video.src = window.URL.createObjectURL(cursor.value.media);
            video.addEventListener("mouseenter" , function(){  
                video.currentTime = 0;   // when mouse enters it starts with 0 (starting se)
                video.play();
            });

            video.addEventListener("mouseleave" , function(){
                video.pause();
            });

            video.controls = true;
            video.loop = true;
            video.muted=true;

            let mediaContainer = div.querySelector(".media-container");
            mediaContainer.appendChild(video)

            downloadbtn.addEventListener("click" , function(e){
            let a = document.createElement("a")
            a.download = "video.mp4";
            a.href = video.src;
            a.click();
            a.remove();
            });
        }
        
        container.appendChild(div);
        cursor.continue();
    }
 })
}

function deleteMediaFromDB(mId){
    console.log(mId)
    let tx=dbAccess.transaction("gallery","readwrite");
    let galleryObjectStore=tx.objectStore("gallery");
    console.log("Deleted");
    galleryObjectStore.delete(Number(mId));  // mId string hai so converted to no

}