let form = document.getElementById("Kontaktformular");
let nameInput = document.getElementById("name");
let emailInput = document.getElementById("email");
let messageInput = document.getElementById("message");
let nachricht = document.getElementById("messag");

form.addEventListener("submit", function(event){
    event.preventDefault();
    
    if(nameInput.value === "" || emailInput.value === "" || messageInput.value === ""){
        nachricht.style.color = "Red";
        nachricht.innerText = "Bitte alle Felder ausfüllen ❌";
    }
    else{
        nachricht.style.color = "green";
        nachricht.innerText = "Nachricht wurde gesendet ✅";
        form.reset();
    }

    

});