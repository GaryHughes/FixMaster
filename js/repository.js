function selectVersion(evt, beginString) {
   
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
   
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks");
    
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(beginString).style.display = "block";
    evt.currentTarget.className += " active";
}

// window.addEventListener('load', event => {
//     selectVersion('FIX.4.0');
// });

// window.addEventListener('message', event => {
//     const message = event.data;
//     switch (message.command) {
//         case 'selectVersion':
//             selectVersion(message.beginString);
//             break;
//     }
// });