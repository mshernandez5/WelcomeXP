/*
 * Windows XP LightDM Webkit Greeter Theme
 * by Markus Hernandez
 * 
 * For anybody taking a look at this as a reference
 * to make their own lightdm-webkit-greeter theme,
 * check the man pages for lightdm-webkit2-greeter
 * after having this package installed; it has the
 * most complete description of the API available
 * as far as I am aware.
 * 
 * This is how the process works with a correct login:
 * 
 * This Script                              LightDM
 * Authenticate [Selected Username] ->
 *                       <- What is their password?
 * Respond With Password ->
 *     <- Call Authentication Complete Callback Method
 * 
 * Finally,
 * Check lightdm.is_authenticated, which will indicate
 * whether the password was correct. If so, log the
 * user in.
 */

// Mininum Time To Show Welcome Screen (Milliseconds)
const welcomeScreenTimeout = 1000;
// Default Profile Picture If None Available
const defaultProfilePicture = "img/bike.png";

// Variables
let activeUserListing = null;
let activeUserName = null;
let pendingAuthentication = false;

/*
 * Callback Functions Required by LightDM JavaScript API
 */

// LightDM Needs To Prompt User
// text: The prompt text
// type: "text" or "password" (should the response be hidden)
function show_prompt(text, type)
{
    // For Debugging Purposes
    // let header = document.querySelector("#header");
    // header.textContent = type + ": " + text;
}

// LightDM Needs To Show Message
// text: The message text
// type: "info" or "error"
function show_message(text, type)
{
    let header = document.querySelector("#header");
    header.textContent = type + ": " + text;
}

// Called When Authentication Completed
function authentication_complete()
{
    pendingAuthentication = false;
    if (lightdm.is_authenticated)
    {
        // Display Welcome Screen
        let template = document.getElementById("welcome-template");
        let welcomeBodyContent = template.content.cloneNode(true);
        let body = document.querySelector("body");
        body.innerHTML = "";
        body.appendChild(welcomeBodyContent);
        // After Welcome Screen Timeout, Start Session
        setTimeout(function() {lightdm.start_session_sync(lightdm.default_session)}, welcomeScreenTimeout);
    }
    else
    {
        show_message("Authentication failed!", "error");
        // Enable Password Input Forms
        disablePasswordForms(false);
        // Keep User Selected For Another Attempt
        pendingAuthentication = true;
        lightdm.authenticate(activeUserName);
    }
}

// Autologin User's Login Timer Expired
function autologin_timer_expired()
{
    // nothing, don't autologin
}

/*
 * Custom Greeter Logic
 */

// Attach Shutdown Button Listener
const shutdownButton = document.getElementById("shutdown");
shutdownButton.addEventListener("click",
    function()
    {
        lightdm.shutdown();
    }
);

// Called When A User Listing In The Menu Is Selected
function setActiveUser(event)
{
    // Get Information For The Selected User Listing
    let userListing = event.currentTarget;
    let userName = users[userListing.getAttribute("data-user-index")].name;
    // If Selected User Already Active, Do Nothing
    if (userName === activeUserName)
    {
        return;
    }
    // Switching Users, Cancel Previous Authentication
    if (pendingAuthentication)
    {
        activeUserListing.classList.remove("active");
        lightdm.cancel_authentication();
    }
    // Update Status To Reflect Selected User
    pendingAuthentication = true;
    activeUserListing = userListing;
    activeUserName = userName;
    // Assign Styles To Active User Listing
    activeUserListing.classList.add("active");
    // Begin Authentication
    lightdm.authenticate(activeUserName);
}

// Called When Password Form Is Submitted
function attemptLogin(event)
{
    // Prevent Default Form Behavior (Try To Submit To Location)
    event.preventDefault();
    // Disable All Password Input Forms
    disablePasswordForms(true);
    // Tell LightDM The Password
    let password = activeUserListing.querySelector(".password").value;
    lightdm.respond(password);
}

// For Each Password Form Get Each Element & Enable/Disable
function disablePasswordForms(isDisabled)
{
    let forms = document.querySelectorAll(".password-form");
    for (let i = 0; i < forms.length; i++)
    {
        let elements = forms[i].elements;
        for (let j = 0; j < elements.length; j++)
        {
            elements[j].disabled = isDisabled;
        }
    }
}

/*
 * lightdm is sometimes unavailable at the time
 * this script executes causing crashes.
 * This alleviates the issue by waiting until
 * the object is initialized.
 */
let interval = setInterval(checkInit, 10);

function checkInit()
{
    if (lightdm)
    {
        clearInterval(interval);
        init();
    }
}

function init()
{
    // For Each User, Add A Listing In The HTML Document
    let userListDiv = document.getElementById("centerRight");
    for (let i = 0; i < lightdm.users.length; i++)
    {
        let user = lightdm.users[i];
        // Copy HTML Template For New User Listing
        let template = document.querySelector("#user-template");
        let userListing = template.content.cloneNode(true);
        // Populate Template With User-Specific Information
        userListing.querySelector(".user-name").textContent = user.display_name;
        let userImage = user.image;
        if (!userImage)
        {
            userImage = defaultProfilePicture;
        }
        userListing.querySelector(".profile-picture").setAttribute("src", userImage);
        // Get Reference To Click Area
        let userClickBox = userListing.querySelector(".user");
        // Get Reference To Login Form
        let loginForm = userListing.querySelector(".password-form");
        // Insert User Listing To Login Page HTML
        userListDiv.appendChild(userListing);
        // Associate Listing With Associated User Index
        userClickBox.setAttribute("data-user-index", i);
        // Add User Selection Listener
        userClickBox.addEventListener("click", setActiveUser);
        // Add Login Form Listener
        loginForm.addEventListener("submit", attemptLogin);
    }
}