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
    // Clear Password Field On Login Attempt
    activeUserListing.querySelector(".password").value = "";
    pendingAuthentication = false;
    if (lightdm.is_authenticated)
    {
        // Display Welcome Screen
        let template = document.getElementById("welcome-template");
        let welcomeBodyContent = template.content.cloneNode(true);
        let mainContent = document.querySelector("#main-content");
        mainContent.innerHTML = "";
        mainContent.appendChild(welcomeBodyContent);
        // After Welcome Screen Timeout, Start Session
        setTimeout(function() {lightdm.start_session(lightdm.default_session)}, welcomeScreenTimeout);
    }
    else
    {
        // Show Error Popup
        activeUserListing.querySelector(".password-error-popup").classList.add("active");
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
 * Scripting for user selection, makes lightdm calls.
 */

// Called When A User Listing In The Menu Is Selected
function onUserClick(event)
{
    setActiveUser(event.currentTarget);
}

// Sets A User Listing Element As The Active One
function setActiveUser(userListing)
{
    // Get Information For The Selected User Listing
    let userName = lightdm.users[userListing.getAttribute("data-user-index")].username;
    // If Selected User Already Active, Do Nothing
    if (userName === activeUserName)
    {
        return;
    }
    // Switching Users, Cancel Previous Authentication
    if (pendingAuthentication)
    {
        // Make Previously Selected User Appear Unselected
        activeUserListing.classList.remove("active");
        // Clear Previously Selected Password Box
        activeUserListing.querySelector(".password").value = "";
        lightdm.cancel_authentication();
    }
    // Update Status To Reflect Selected User
    pendingAuthentication = true;
    activeUserListing = userListing;
    activeUserName = userName;
    // Assign Styles To Active User Listing
    activeUserListing.classList.add("active");
    // Focus Password Box
    activeUserListing.querySelector(".password").focus();
    // Begin Authentication
    lightdm.authenticate(activeUserName);
}

// If The User Clicks Anywhere On The Document, Clear Any Popups
document.addEventListener("click", removePopup, true);
function removePopup()
{
    if (activeUserListing)
    {
        // Remove Popup, If Any
        activeUserListing.querySelector(".password-error-popup").classList.remove("active");
    }
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
 * Scripting for the shutdown prompt overlay,
 * with options for standby/shutdown/restart.
 */

// Attach Shutdown Options Button Listener
const shutdownOptionsButton = document.getElementById("shutdown-options");
shutdownOptionsButton.addEventListener("click", showShutdownPrompt);

// Show Prompt Overlay With Shutdown Options
function showShutdownPrompt()
{
    document.querySelector("#main-content").style.filter = "grayscale(0.90)";
    let overlay = document.querySelector("#shutdown-prompt-overlay");
    overlay.classList.add("active");
}

const standbyButton = document.querySelector("#standby-button");
standbyButton.addEventListener("click", standby);
function standby()
{
    cancelShutdownPrompt();
    lightdm.suspend();
}

// Shutdown Button Listener
const shutdownButton = document.querySelector("#shutdown-button");
shutdownButton.addEventListener("click", shutdown);
function shutdown()
{
    lightdm.shutdown();
}

const restartButton = document.querySelector("#restart-button");
restartButton.addEventListener("click", restart);
function restart()
{
    lightdm.restart();
}

const cancelButton = document.querySelector("#shutdown-cancel-button");
cancelButton.addEventListener("click", cancelShutdownPrompt);
function cancelShutdownPrompt()
{
    document.querySelector("#main-content").style.filter = "none";
    let overlay = document.querySelector("#shutdown-prompt-overlay");
    overlay.classList.remove("active");
}

// Listen For Keys
const KEY_ESCAPE = 27;
const KEY_TAB = 9;
document.addEventListener("keydown", onKeyEvent);
function onKeyEvent(event)
{
    // Remove Any Password Error Popup On Key Press
    removePopup();
    // Check If Shutdown Prompt Open
    let shutdownPromptOpen = document.querySelector("#shutdown-prompt-overlay").classList.contains("active");
    // Key Events For Shutdown Prompt
    if (shutdownPromptOpen)
    {
        // Close Shutdown Prompt
        if (event.keyCode === KEY_ESCAPE)
        {
            cancelShutdownPrompt();
        }
    }
    // Key Events For General Login Screen
    else
    {
        // Tab Between Users
        if (event.keyCode === KEY_TAB)
        {
            event.preventDefault();
            let next;
            if (!activeUserListing || !(next = activeUserListing.parentElement.nextElementSibling))
            {
                next = document.querySelector("#userListings div:first-of-type");
                console.log(next);
            }
            setActiveUser(next.firstElementChild);
        }
    }
}

/*
 * These are the initialization procedures when
 * the script execution begins.
 */

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
    lightdm.show_prompt?.connect((prompt, type) => {
      show_prompt(prompt, type);
    });
    lightdm.show_message?.connect((msg, type) => {
      show_message(msg, type);
    });
    lightdm.authentication_complete?.connect(() => authentication_complete());
    lightdm.autologin_timer_expired?.connect(() => autologin_timer_expired());
    // For Each User, Add A Listing In The HTML Document
    let userListDiv = document.getElementById("userListings");
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
        userClickBox.addEventListener("click", onUserClick);
        // Add Login Form Listener
        loginForm.addEventListener("submit", attemptLogin);
    }
}
